
import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { fetchLatestUsdtNgnRate } from '@/services/usdt-ngn-service';
import { loadRatesData, loadAndApplyMarginSettings, saveHistoricalRatesData } from '@/utils/rateDataUtils';
import { useUsdtRateUpdater } from './useUsdtRateUpdater';

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
  
  // Use the USDT rate updater hook
  const { updateUsdtRate } = useUsdtRateUpdater({
    setUsdtNgnRate,
    setLastUpdated,
    setIsLoading,
    calculateAllCostPrices,
    fxRates
  });
  
  // Load all data from APIs and database
  const loadAllData = async () => {
    console.log("[useRateDataLoader] Loading all data...");
    setIsLoading(true);
    
    try {
      // Load rates data (FX rates, USDT/NGN rate, VertoFX rates)
      const { usdtRate, fxRates: loadedFxRates, success } = await loadRatesData(
        setFxRates,
        setVertoFxRates,
        setIsLoading
      );
      
      // Important: Only update the state if we get a valid rate
      if (usdtRate && usdtRate > 0) {
        console.log("[useRateDataLoader] Setting USDT/NGN rate from database:", usdtRate);
        setUsdtNgnRate(usdtRate);
      } else {
        console.warn("[useRateDataLoader] Received invalid or no USDT/NGN rate from database:", usdtRate);
      }
      
      // Apply margin settings and calculate cost prices
      const calculationsApplied = await loadAndApplyMarginSettings(
        calculateAllCostPrices,
        loadedFxRates,
        usdtRate
      );
      
      if (calculationsApplied) {
        // Save historical data for analytics
        await saveHistoricalRatesData(loadedFxRates, usdtRate);
      }
      
      setLastUpdated(new Date());
      console.log("[useRateDataLoader] All rates loaded and updated successfully");
    } catch (error) {
      console.error("[useRateDataLoader] Error loading data:", error);
      toast.error("Failed to load some data");
    } finally {
      setIsLoading(false);
    }
  };

  return { loadAllData, updateUsdtRate };
};
