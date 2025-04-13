
import { toast } from "sonner";
import { fetchLatestUsdtNgnRate, DEFAULT_RATE } from '@/services/usdt-ngn-service';
import { loadRatesData } from '@/utils/rates/ratesLoader';
import { CurrencyRates } from '@/services/api';
import { loadAndApplyMarginSettings } from '@/utils';
import { cacheWithExpiration } from '@/utils/cacheUtils';

interface RatesLoaderProps {
  setUsdtNgnRate: (rate: number) => void;
  setFxRates: (rates: CurrencyRates) => void;
  setVertoFxRates: (rates: Record<string, { buy: number; sell: number }>) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fetchBybitRate: () => Promise<number | null>;
  isMobile?: boolean;
}

// Cache key for loading status
const LOADING_STATUS_KEY = 'rates_loading_status';

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
    // Use cached loading status to prevent duplicate loads
    if (cacheWithExpiration.get(LOADING_STATUS_KEY)) {
      console.log("[useRatesLoader] Loading already in progress, skipping");
      return;
    }
    
    cacheWithExpiration.set(LOADING_STATUS_KEY, true, 5000); // Prevent multiple loads for 5 seconds
    setIsLoading(true);
    
    try {
      // Fetch database rate in parallel but with low priority
      const dbRatePromise = fetchLatestUsdtNgnRate().catch(() => null);
      
      // First, load core rates data with optimized loader
      const { usdtRate, fxRates, success } = await loadRatesData(
        setFxRates,
        setVertoFxRates,
        () => {}, // Handle loading state separately
        isMobile
      );
      
      // Set USDT rate immediately for faster UI update
      if (usdtRate && usdtRate > 0) {
        setUsdtNgnRate(usdtRate);
      }
      
      // Try to get Bybit rate in parallel with short timeout
      const bybitRate = await Promise.race([
        fetchBybitRate(),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 1500))
      ]);
      
      // Use the best rate available
      const finalRate = (bybitRate && bybitRate > 0) ? bybitRate : 
                        (usdtRate && usdtRate > 0) ? usdtRate :
                        await dbRatePromise || DEFAULT_RATE;
      
      setUsdtNgnRate(finalRate);
      
      // Apply margin settings in parallel
      loadAndApplyMarginSettings(
        calculateAllCostPrices,
        fxRates,
        finalRate
      ).catch(error => {
        console.warn("[useRatesLoader] Error applying margin settings:", error);
        // Still use default margins to show something
        calculateAllCostPrices(2.5, 3.0);
      });
      
      setLastUpdated(new Date());
      
      // Only save historical data in background after UI is ready
      setTimeout(() => {
        try {
          import('@/utils').then(({ saveHistoricalRatesData }) => {
            saveHistoricalRatesData(fxRates, finalRate).catch(() => {});
          });
        } catch (error) {
          // Ignore background tasks errors
        }
      }, 2000);
    } catch (error) {
      console.error("[useRatesLoader] Error loading data:", error);
      setUsdtNgnRate(DEFAULT_RATE);
      calculateAllCostPrices(2.5, 3.0);
    } finally {
      setIsLoading(false);
      // Clear loading status after completion
      setTimeout(() => {
        cacheWithExpiration.set(LOADING_STATUS_KEY, false, 0);
      }, 1000);
    }
  };

  return { loadAllData };
};
