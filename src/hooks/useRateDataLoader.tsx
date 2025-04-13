
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

// Loading debounce flag - Add a timeout to prevent double loading
const LOADING_IN_PROGRESS = 'loading_in_progress';
const LOADING_TIMEOUT_MS = 10000; // 10 seconds to prevent deadlock
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

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
    // Improved race condition handling with automatic timeout clearing
    if (cacheWithExpiration.get(LOADING_IN_PROGRESS)) {
      console.log("[useRateDataLoader] Loading already in progress, skipping");
      return;
    }

    // Set loading flag with automatic timeout to prevent deadlock
    cacheWithExpiration.set(LOADING_IN_PROGRESS, true, LOADING_TIMEOUT_MS);
    
    // Start the loading indicator only if this is a manual refresh
    setIsLoading(true);
    
    try {
      if (isUltraLightMode) {
        // For ultra light mode, only load essential data
        console.log("[useRateDataLoader] Ultra light mode detected, minimal loading strategy");
        
        // Use immediate cache if available
        const cachedData = cacheWithExpiration.get('essential_rates');
        if (cachedData && cachedData.usdtRate > 0) { // Validate cache data
          console.log("[useRateDataLoader] Using cached essential data");
          setUsdtNgnRate(cachedData.usdtRate);
          
          // Validate FX rates before using
          if (cachedData.fxRates && Object.keys(cachedData.fxRates).length > 0) {
            setFxRates(cachedData.fxRates);
          }
          
          if (cachedData.timestamp) {
            setLastUpdated(new Date(cachedData.timestamp));
          }
          
          // Still load data in background for future use, with error handling
          setTimeout(() => {
            loadAllData().catch(error => {
              console.error("[useRateDataLoader] Background data load failed:", error);
            });
          }, 2000);
          
          return;
        }
        
        // Fetch DB values for immediate display
        await loadAllData();
      } else {
        // Progressive loading strategy for better performance
        await loadAllData();
      }
      
      // Only cache valid data
      if (usdtNgnRate && usdtNgnRate > 0 && Object.keys(fxRates).length > 0) {
        // Cache essential rates for ultra-light mode with improved structure
        cacheWithExpiration.set('essential_rates', {
          usdtRate: usdtNgnRate,
          fxRates,
          timestamp: Date.now()
        }, CACHE_DURATION_MS);
      }
    } catch (error) {
      console.error("[useRateDataLoader] Error in smart loading:", error);
      toast.error("Failed to load data", {
        description: "Please check your connection and try again"
      });
    } finally {
      setIsLoading(false);
      // Clear loading flag after a short delay, always ensuring it's cleared
      setTimeout(() => {
        cacheWithExpiration.set(LOADING_IN_PROGRESS, false, 0);
      }, 1000);
    }
  }, [loadAllData, isUltraLightMode, setIsLoading, usdtNgnRate, fxRates, setUsdtNgnRate, setFxRates, setLastUpdated]);

  return { 
    loadAllData: smartLoad, 
    updateUsdtRate, 
    refreshBybitRate,
    isMobile,
    isUltraLightMode
  };
};
