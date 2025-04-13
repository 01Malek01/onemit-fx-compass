
import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { fetchLatestUsdtNgnRate, DEFAULT_RATE, saveUsdtNgnRate } from '@/services/usdt-ngn-service';
import { useUsdtRateUpdater } from './useUsdtRateUpdater';
import { loadRatesData, loadAndApplyMarginSettings, saveHistoricalRatesData } from '@/utils/index';
import { getBybitP2PRate, saveBybitRate } from '@/services/bybit';

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
  
  const fetchBybitRate = async (retry: boolean = true): Promise<number | null> => {
    try {
      console.log("[useRateDataLoader] Fetching Bybit P2P rate...");
      const bybitData = await getBybitP2PRate("NGN", "USDT");
      
      if (!bybitData) {
        console.warn("[useRateDataLoader] No data returned from Bybit API");
        
        // Implement retry with a 2-second delay if this is our first attempt
        if (retry) {
          console.log("[useRateDataLoader] Retrying Bybit API call in 2 seconds...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          return fetchBybitRate(false); // No more retries after this
        }
        
        return null;
      }
      
      // Use median price as it's more resistant to outliers, fallback to average
      const rate = bybitData.market_summary.price_range.median || 
                   bybitData.market_summary.price_range.average;
      
      console.log("[useRateDataLoader] Bybit P2P rate fetched:", rate);
      
      // Save to Supabase for history/analytics
      if (rate) {
        await saveBybitRate(rate);
        // Also save to the standard rate service for compatibility
        await saveUsdtNgnRate(rate);
      }
      
      return rate;
    } catch (error) {
      console.error("[useRateDataLoader] Error fetching Bybit rate:", error);
      
      // Implement retry with a 2-second delay if this is our first attempt
      if (retry) {
        console.log("[useRateDataLoader] Retrying Bybit API call in 2 seconds...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchBybitRate(false); // No more retries after this
      }
      
      return null;
    }
  };
  
  const loadAllData = async () => {
    console.log("[useRateDataLoader] Loading all data...");
    setIsLoading(true);
    
    try {
      // First fetch live Bybit rate
      const bybitRate = await fetchBybitRate();
      
      // Load other FX rates
      const { fxRates: loadedFxRates, success } = await loadRatesData(
        setFxRates,
        setVertoFxRates,
        setIsLoading
      );
      
      // Use Bybit rate if available, otherwise fall back to database or default
      if (bybitRate && bybitRate > 0) {
        console.log("[useRateDataLoader] Setting USDT/NGN rate from Bybit:", bybitRate);
        setUsdtNgnRate(bybitRate);
      } else {
        console.log("[useRateDataLoader] Bybit rate unavailable, fetching from database");
        const databaseRate = await fetchLatestUsdtNgnRate();
        
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
      );
      
      if (calculationsApplied) {
        try {
          await saveHistoricalRatesData(loadedFxRates, bybitRate || usdtNgnRate || DEFAULT_RATE);
        } catch (error) {
          console.error("[useRateDataLoader] Error saving historical data:", error);
        }
      }
      
      setLastUpdated(new Date());
      console.log("[useRateDataLoader] All rates loaded and updated successfully");
    } catch (error) {
      console.error("[useRateDataLoader] Error loading data:", error);
      toast.error("Failed to load some data");
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
        toast.error("Failed to update USDT/NGN rate from Bybit");
        return false;
      }
    } catch (error) {
      console.error("[useRateDataLoader] Error refreshing Bybit rate:", error);
      toast.error("Failed to update USDT/NGN rate");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { loadAllData, updateUsdtRate, refreshBybitRate };
};
