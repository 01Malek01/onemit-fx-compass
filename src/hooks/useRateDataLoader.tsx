import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { fetchLatestUsdtNgnRate, DEFAULT_RATE } from '@/services/usdt-ngn-service';
import { useUsdtRateUpdater } from './useUsdtRateUpdater';
import { loadRatesData, loadAndApplyMarginSettings, saveHistoricalRatesData } from '@/utils/index';

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
  
  const loadAllData = async () => {
    console.log("[useRateDataLoader] Loading all data...");
    setIsLoading(true);
    
    try {
      const { usdtRate, fxRates: loadedFxRates, success } = await loadRatesData(
        setFxRates,
        setVertoFxRates,
        setIsLoading
      );
      
      if (usdtRate && usdtRate > 0) {
        console.log("[useRateDataLoader] Setting USDT/NGN rate from database:", usdtRate);
        setUsdtNgnRate(usdtRate);
      } else {
        console.warn("[useRateDataLoader] Received invalid or no USDT/NGN rate from database, using default:", DEFAULT_RATE);
        setUsdtNgnRate(DEFAULT_RATE);
      }
      
      const calculationsApplied = await loadAndApplyMarginSettings(
        calculateAllCostPrices,
        loadedFxRates,
        usdtRate || DEFAULT_RATE
      );
      
      if (calculationsApplied) {
        try {
          await saveHistoricalRatesData(loadedFxRates, usdtRate || DEFAULT_RATE);
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

  return { loadAllData, updateUsdtRate };
};
