import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { fetchLatestUsdtNgnRate, DEFAULT_RATE, saveUsdtNgnRate } from '@/services/usdt-ngn-service';
import { useUsdtRateUpdater } from './useUsdtRateUpdater';
import { loadRatesData, loadAndApplyMarginSettings, saveHistoricalRatesData } from '@/utils/index';
import { fetchBybitRateWithRetry } from '@/services/bybit/bybit-utils';

export interface RateDataLoaderProps {
  setUsdtNgnRate: (rate: number) => void;
  setFxRates: (rates: CurrencyRates) => void;
  setVertoFxRates: (rates: VertoFXRates) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fxRates: CurrencyRates;
  usdtNgnRate: number | null;
}

export const useRateDataLoader = ({
  setUsdtNgnRate,
  setFxRates,
  setVertoFxRates,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fxRates,
  usdtNgnRate
}: RateDataLoaderProps) => {
  
  const { updateUsdtRate } = useUsdtRateUpdater({
    setUsdtNgnRate,
    setLastUpdated,
    setIsLoading,
    calculateAllCostPrices,
    fxRates
  });
  
  const fetchBybitRate = async (): Promise<number | null> => {
    try {
      console.log("[useRateDataLoader] Fetching Bybit P2P rate with improved retry logic");
      const { rate, error } = await fetchBybitRateWithRetry(3, 2000); // Increased retries to 3
      
      if (!rate || rate <= 0) {
        console.warn(`[useRateDataLoader] Failed to get valid Bybit rate: ${error || "Unknown error"}`);
        return null;
      }
      
      console.log("[useRateDataLoader] Bybit P2P rate fetched successfully:", rate);
      
      // Save to the standard rate service for compatibility
      await saveUsdtNgnRate(rate).catch(err => {
        console.error("[useRateDataLoader] Failed to save Bybit rate to database:", err);
        // Continue execution even if save fails
      });
      
      return rate;
    } catch (error) {
      console.error("[useRateDataLoader] Error in fetchBybitRate:", error);
      return null;
    }
  };
  
  const loadAllData = async () => {
    console.log("[useRateDataLoader] Loading all data...");
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
        console.log("[useRateDataLoader] Setting USDT/NGN rate from Bybit:", bybitRate);
        setUsdtNgnRate(bybitRate);
      } else {
        console.log("[useRateDataLoader] Bybit rate unavailable, fetching from database");
        const databaseRate = await fetchLatestUsdtNgnRate().catch(error => {
          console.error("[useRateDataLoader] Error fetching from database:", error);
          return null;
        });
        
        if (databaseRate && databaseRate > 0) {
          console.log("[useRateDataLoader] Setting USDT/NGN rate from database:", databaseRate);
          setUsdtNgnRate(databaseRate);
        } else {
          console.warn("[useRateDataLoader] No valid rate found, using default:", DEFAULT_RATE);
          setUsdtNgnRate(DEFAULT_RATE);
        }
      }
      
      // Apply margin settings and calculate cost prices
      const calculationsApplied = await loadAndApplyMarginSettings(
        calculateAllCostPrices,
        loadedFxRates,
        bybitRate || usdtNgnRate || DEFAULT_RATE
      ).catch(error => {
        console.error("[useRateDataLoader] Error applying margin settings:", error);
        return false;
      });
      
      loadStatus.margins = calculationsApplied;
      
      if (calculationsApplied) {
        try {
          await saveHistoricalRatesData(loadedFxRates, bybitRate || usdtNgnRate || DEFAULT_RATE);
        } catch (error) {
          console.error("[useRateDataLoader] Error saving historical data:", error);
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
      
      console.log("[useRateDataLoader] All rates loaded with status:", loadStatus);
    } catch (error) {
      console.error("[useRateDataLoader] Error loading data:", error);
      toast.error("Failed to load some data", {
        description: "Using cached values where possible"
      });
      setUsdtNgnRate(DEFAULT_RATE);
    } finally {
      setIsLoading(false);
    }
  };

  // Function for refreshing only the Bybit rate with improved error handling
  const refreshBybitRate = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const bybitRate = await fetchBybitRate();
      
      if (bybitRate && bybitRate > 0) {
        console.log("[useRateDataLoader] Refreshed Bybit USDT/NGN rate:", bybitRate);
        setUsdtNgnRate(bybitRate);
        setLastUpdated(new Date());
        
        // Recalculate prices with the new rate
        if (Object.keys(fxRates).length > 0) {
          // The actual margin values will be applied within the dashboard state
          calculateAllCostPrices(2.5, 3.0); // Default margins as placeholder
        }
        
        toast.success("USDT/NGN rate updated from Bybit");
        return true;
      } else {
        console.warn("[useRateDataLoader] Could not refresh Bybit rate");
        
        // Try to get the latest rate from database as a fallback
        const databaseRate = await fetchLatestUsdtNgnRate().catch(err => {
          console.error("[useRateDataLoader] Failed to fetch database rate:", err);
          return null;
        });
        
        if (databaseRate && databaseRate > 0) {
          console.log("[useRateDataLoader] Using fallback database rate:", databaseRate);
          setUsdtNgnRate(databaseRate);
          setLastUpdated(new Date());
          calculateAllCostPrices(2.5, 3.0); // Default margins
          
          toast.info("Using last saved USDT/NGN rate", {
            description: "Bybit service unavailable"
          });
          return true;
        }
        
        toast.error("Failed to update USDT/NGN rate from Bybit", {
          description: "Using last saved rate instead"
        });
        
        return false;
      }
    } catch (error) {
      console.error("[useRateDataLoader] Error refreshing Bybit rate:", error);
      toast.error("Failed to update USDT/NGN rate", {
        description: "Check your network connection and try again"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { loadAllData, updateUsdtRate, refreshBybitRate };
};
