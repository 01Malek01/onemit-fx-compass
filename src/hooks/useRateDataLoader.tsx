
import { useCallback, useMemo } from 'react';
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { useUsdtRateUpdater } from './useUsdtRateUpdater';
import { useBybitRateFetcher } from './useBybitRateFetcher';
import { useRatesLoader } from './useRatesLoader';
import { useDeviceDetect } from './use-mobile';
import { isLikelySlowDevice, getConnectionInfo } from '@/utils/deviceUtils';
import { toast } from 'sonner';
import { cacheWithExpiration } from '@/utils/cacheUtils';

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

// Loading debounce flag
const LOADING_IN_PROGRESS = 'loading_in_progress';

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
  const { isMobile } = useDeviceDetect();
  const connectionInfo = useMemo(() => getConnectionInfo(), []);
  
  // Determine if we should use ultra-light mode for very slow connections
  const isUltraLightMode = useMemo(() => {
    return (isMobile && isLikelySlowDevice()) || 
           (connectionInfo.effectiveType === '2g') ||
           (connectionInfo.downlink && connectionInfo.downlink < 0.5);
  }, [isMobile, connectionInfo]);
  
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
    // Prevent duplicate loads
    if (cacheWithExpiration.get(LOADING_IN_PROGRESS)) {
      console.log("[useRateDataLoader] Loading already in progress, skipping");
      return;
    }

    // Set loading flag for 10 seconds max
    cacheWithExpiration.set(LOADING_IN_PROGRESS, true, 10000);
    
    // Start the loading indicator only if this is a manual refresh
    setIsLoading(true);
    
    try {
      if (isUltraLightMode) {
        // For ultra light mode, only load essential data
        console.log("[useRateDataLoader] Ultra light mode detected, minimal loading strategy");
        
        // Use immediate cache if available
        const cachedRates = cacheWithExpiration.get('essential_rates');
        if (cachedRates) {
          setUsdtNgnRate(cachedRates.usdtRate);
          setFxRates(cachedRates.fxRates);
          setLastUpdated(new Date(cachedRates.timestamp));
          
          // Still load data in background for future use
          setTimeout(() => loadAllData().catch(console.error), 2000);
          return;
        }
        
        // Fetch DB values for immediate display
        await loadAllData();
      } else {
        // Progressive loading strategy for better performance
        await loadAllData();
      }
      
      // Cache essential rates for ultra-light mode
      cacheWithExpiration.set('essential_rates', {
        usdtRate: usdtNgnRate,
        fxRates,
        timestamp: Date.now()
      }, 5 * 60 * 1000); // 5 minute cache
    } catch (error) {
      console.error("[useRateDataLoader] Error in smart loading:", error);
      toast.error("Failed to load data", {
        description: "Please check your connection and try again"
      });
    } finally {
      setIsLoading(false);
      // Clear loading flag after a short delay
      setTimeout(() => {
        cacheWithExpiration.set(LOADING_IN_PROGRESS, false, 0);
      }, 1000);
    }
  }, [loadAllData, isUltraLightMode, setIsLoading, usdtNgnRate, fxRates]);

  return { 
    loadAllData: smartLoad, 
    updateUsdtRate, 
    refreshBybitRate,
    isMobile,
    isUltraLightMode
  };
};
