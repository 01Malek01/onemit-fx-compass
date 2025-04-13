
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
}

export const useRatesLoader = ({
  setUsdtNgnRate,
  setFxRates,
  setVertoFxRates,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fetchBybitRate
}: RatesLoaderProps) => {
  
  const loadAllData = async () => {
    console.log("[useRatesLoader] Loading all data...");
    setIsLoading(true);
    
    try {
      // Track components loaded successfully for detailed error reporting
      const loadStatus = {
        bybitRate: false,
        fxRates: false,
        margins: false
      };
      
      // First fetch live Bybit rate
      const bybitRate = await fetchBybitRate();
      loadStatus.bybitRate = !!bybitRate;
      
      // Load other FX rates
      const { fxRates: loadedFxRates, success } = await loadRatesData(
        setFxRates,
        setVertoFxRates,
        setIsLoading
      );
      
      loadStatus.fxRates = success;
      
      // Use Bybit rate if available, otherwise fall back to database or default
      if (bybitRate && bybitRate > 0) {
        console.log("[useRatesLoader] Setting USDT/NGN rate from Bybit:", bybitRate);
        setUsdtNgnRate(bybitRate);
      } else {
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
      
      if (calculationsApplied) {
        try {
          await saveHistoricalRatesData(loadedFxRates, bybitRate || DEFAULT_RATE);
        } catch (error) {
          console.error("[useRatesLoader] Error saving historical data:", error);
        }
      }
      
      setLastUpdated(new Date());
      
      // Check if any data sources failed and show appropriate notifications
      if (!loadStatus.bybitRate && !loadStatus.fxRates) {
        toast.warning("Using cached rates - external data sources unavailable", {
          description: "Check your network connection"
        });
      } else if (!loadStatus.bybitRate) {
        toast.info("Using fallback USDT/NGN rate", {
          description: "Bybit rates unavailable"
        });
      } else if (!loadStatus.fxRates) {
        toast.info("Using cached exchange rates", {
          description: "Currency API unavailable"
        });
      } else {
        toast.success("All rates loaded successfully");
      }
      
      console.log("[useRatesLoader] All rates loaded with status:", loadStatus);
    } catch (error) {
      console.error("[useRatesLoader] Error loading data:", error);
      toast.error("Failed to load some data", {
        description: "Using cached values where possible"
      });
      setUsdtNgnRate(DEFAULT_RATE);
    } finally {
      setIsLoading(false);
    }
  };

  return { loadAllData };
};
