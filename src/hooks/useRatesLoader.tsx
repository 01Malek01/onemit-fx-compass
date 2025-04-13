
import { toast } from "sonner";
import { fetchLatestUsdtNgnRate, DEFAULT_RATE } from '@/services/usdt-ngn-service';
import { loadRatesData, loadAndApplyMarginSettings, saveHistoricalRatesData } from '@/utils/index';
import { CurrencyRates } from '@/services/api';

interface RatesLoaderProps {
  setUsdtNgnRate: (rate: number) => void;
  setFxRates: (rates: CurrencyRates) => void;
  setVertoFxRates: (rates: Record<string, { buy: number; sell: number }>) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fetchBybitRate: () => Promise<number | null>;
  isMobile?: boolean; // Add mobile awareness
}

export const useRatesLoader = ({
  setUsdtNgnRate,
  setFxRates,
  setVertoFxRates,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fetchBybitRate,
  isMobile = false
}: RatesLoaderProps) => {
  
  const loadAllData = async () => {
    console.log(`[useRatesLoader] Loading all data... (mobile: ${isMobile})`);
    setIsLoading(true);
    
    try {
      // Track components loaded successfully for detailed error reporting
      const loadStatus = {
        bybitRate: false,
        fxRates: false,
        margins: false
      };
      
      // Prioritize critical data first on mobile
      if (isMobile) {
        // On mobile, prioritize database rates first for faster initial load
        console.log("[useRatesLoader] Mobile detected, prioritizing cached rates");
        const databaseRate = await fetchLatestUsdtNgnRate().catch(error => {
          console.error("[useRatesLoader] Error fetching from database:", error);
          return null;
        });
        
        if (databaseRate && databaseRate > 0) {
          console.log("[useRatesLoader] Setting USDT/NGN rate from database:", databaseRate);
          setUsdtNgnRate(databaseRate);
          
          // Show toast that we're using cached data initially
          toast.info("Using cached rates", {
            description: "Live rates are loading in background"
          });
        }
      }
      
      // First fetch live Bybit rate - but with timeout optimization for mobile
      const bybitRatePromise = fetchBybitRate();
      const bybitRate = isMobile 
        ? await Promise.race([
            bybitRatePromise, 
            new Promise<null>(resolve => setTimeout(() => resolve(null), 3000))
          ])
        : await bybitRatePromise;
      
      loadStatus.bybitRate = !!bybitRate;
      
      // Load other FX rates with mobile optimization
      const { fxRates: loadedFxRates, success } = await loadRatesData(
        setFxRates,
        setVertoFxRates,
        setIsLoading,
        isMobile
      );
      
      loadStatus.fxRates = success;
      
      // Use Bybit rate if available, otherwise fall back to database or default
      if (bybitRate && bybitRate > 0) {
        console.log("[useRatesLoader] Setting USDT/NGN rate from Bybit:", bybitRate);
        setUsdtNgnRate(bybitRate);
      } else if (!isMobile || !databaseRate) {
        // Only try to fetch from database again if we're not on mobile
        // or if we didn't already set a database rate
        console.log("[useRatesLoader] Bybit rate unavailable, fetching from database");
        const databaseRate = await fetchLatestUsdtNgnRate().catch(error => {
          console.error("[useRatesLoader] Error fetching from database:", error);
          return null;
        });
        
        if (databaseRate && databaseRate > 0) {
          console.log("[useRatesLoader] Setting USDT/NGN rate from database:", databaseRate);
          setUsdtNgnRate(databaseRate);
        } else {
          console.warn("[useRatesLoader] No valid rate found, using default:", DEFAULT_RATE);
          setUsdtNgnRate(DEFAULT_RATE);
        }
      }
      
      // Apply margin settings and calculate cost prices
      const calculationsApplied = await loadAndApplyMarginSettings(
        calculateAllCostPrices,
        loadedFxRates,
        bybitRate || DEFAULT_RATE
      ).catch(error => {
        console.error("[useRatesLoader] Error applying margin settings:", error);
        return false;
      });
      
      loadStatus.margins = calculationsApplied;
      
      // On non-mobile or after initial mobile load is complete, save historical data
      if (!isMobile && calculationsApplied) {
        try {
          await saveHistoricalRatesData(loadedFxRates, bybitRate || DEFAULT_RATE);
        } catch (error) {
          console.error("[useRatesLoader] Error saving historical data:", error);
        }
      }
      
      setLastUpdated(new Date());
      
      // Check if any data sources failed and show appropriate notifications
      // On mobile, show fewer and simpler toasts
      if (!loadStatus.bybitRate && !loadStatus.fxRates && !isMobile) {
        toast.warning("Using cached rates - external data sources unavailable", {
          description: "Check your network connection"
        });
      } else if (!loadStatus.bybitRate && !isMobile) {
        toast.info("Using fallback USDT/NGN rate", {
          description: "Bybit rates unavailable"
        });
      } else if (!loadStatus.fxRates && !isMobile) {
        toast.info("Using cached exchange rates", {
          description: "Currency API unavailable"
        });
      } else if (!isMobile) {
        toast.success("All rates loaded successfully");
      }
      
      console.log("[useRatesLoader] All rates loaded with status:", loadStatus);
    } catch (error) {
      console.error("[useRatesLoader] Error loading data:", error);
      
      // Simpler error toast for mobile
      if (isMobile) {
        toast.error("Failed to load data");
      } else {
        toast.error("Failed to load some data", {
          description: "Using cached values where possible"
        });
      }
      
      setUsdtNgnRate(DEFAULT_RATE);
    } finally {
      setIsLoading(false);
    }
  };

  return { loadAllData };
};
