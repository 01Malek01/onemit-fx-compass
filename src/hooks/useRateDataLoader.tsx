
import { useCallback, useMemo } from 'react';
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { useUsdtRateUpdater } from './useUsdtRateUpdater';
import { useBybitRateFetcher } from './useBybitRateFetcher';
import { useRatesLoader } from './useRatesLoader';
import { useDeviceDetect } from './use-mobile';
import { isLikelySlowDevice } from '@/utils/deviceUtils';
import { toast } from 'sonner';

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
  // Enhanced device detection with connection quality awareness
  const { isMobile, connection } = useDeviceDetect();
  
  // Determine if we should use ultra-light mode for very slow connections
  const isUltraLightMode = useMemo(() => {
    return isMobile && isLikelySlowDevice();
  }, [isMobile, connection]);
  
  // Use the USDT rate updater hook
  const { updateUsdtRate } = useUsdtRateUpdater({
    setUsdtNgnRate,
    setLastUpdated,
    setIsLoading,
    calculateAllCostPrices,
    fxRates
  });
  
  // Use the Bybit rate fetcher hook with mobile optimization
  const { fetchBybitRate, refreshBybitRate } = useBybitRateFetcher({
    setUsdtNgnRate,
    setLastUpdated,
    setIsLoading
  });
  
  // Use the rates loader hook with mobile awareness
  const { loadAllData } = useRatesLoader({
    setUsdtNgnRate,
    setFxRates,
    setVertoFxRates,
    setLastUpdated,
    setIsLoading,
    calculateAllCostPrices,
    fetchBybitRate,
    isMobile
  });

  // Function to intelligently load data based on device and connection
  const smartLoad = useCallback(async () => {
    // Start the loading indicator only if this is a manual refresh
    // This avoids flashing loading spinners during background updates
    setIsLoading(true);
    
    try {
      if (isUltraLightMode) {
        // For ultra light mode, only load essential data
        console.log("[useRateDataLoader] Ultra light mode detected, minimal loading strategy");
        
        // Prioritize DB values for immediate display
        await loadAllData();
      } else {
        // Progressive loading strategy for better performance
        await loadAllData();
      }
    } catch (error) {
      console.error("[useRateDataLoader] Error in smart loading:", error);
      toast.error("Failed to load data", {
        description: "Please check your connection and try again"
      });
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData, isUltraLightMode, setIsLoading]);

  return { 
    loadAllData: smartLoad, 
    updateUsdtRate, 
    refreshBybitRate,
    isMobile,
    isUltraLightMode
  };
};
