
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { useUsdtRateUpdater } from './useUsdtRateUpdater';
import { useBybitRateFetcher } from './useBybitRateFetcher';
import { useRatesLoader } from './useRatesLoader';

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
  
  // Use the Bybit rate fetcher hook
  const { fetchBybitRate, refreshBybitRate } = useBybitRateFetcher({
    setUsdtNgnRate,
    setLastUpdated,
    setIsLoading
  });
  
  // Use the rates loader hook
  const { loadAllData } = useRatesLoader({
    setUsdtNgnRate,
    setFxRates,
    setVertoFxRates,
    setLastUpdated,
    setIsLoading,
    calculateAllCostPrices,
    fetchBybitRate
  });

  return { 
    loadAllData, 
    updateUsdtRate, 
    refreshBybitRate 
  };
};
