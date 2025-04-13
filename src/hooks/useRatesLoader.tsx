
import { toast } from "sonner";
import { fetchLatestUsdtNgnRate, DEFAULT_RATE } from '@/services/usdt-ngn-service';
import { loadRatesData } from '@/utils/rates/ratesLoader';
import { CurrencyRates } from '@/services/api';
import { loadAndApplyMarginSettings } from '@/utils';
import { cacheWithExpiration } from '@/utils/cacheUtils';
import { AlertTriangle } from "lucide-react";

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
// Retry count for critical operations
const MAX_RETRIES = 2;

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
  
  // Helper function to retry critical operations
  const withRetry = async <T,>(
    operation: () => Promise<T>, 
    fallback: T, 
    retries = MAX_RETRIES
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      if (retries > 0) {
        console.log(`Retrying operation, ${retries} attempts remaining`);
        // Exponential backoff
        await new Promise(r => setTimeout(r, (MAX_RETRIES - retries + 1) * 200));
        return withRetry(operation, fallback, retries - 1);
      }
      console.error("Operation failed after retries:", error);
      return fallback;
    }
  };
  
  const loadAllData = async (): Promise<boolean> => {
    // Use cached loading status to prevent duplicate loads
    if (cacheWithExpiration.get(LOADING_STATUS_KEY)) {
      console.log("[useRatesLoader] Loading already in progress, skipping");
      return true;
    }
    
    cacheWithExpiration.set(LOADING_STATUS_KEY, true, 5000); // Prevent multiple loads for 5 seconds
    setIsLoading(true);
    
    try {
      // Fetch database rate in parallel but with low priority
      const dbRatePromise = withRetry(
        () => fetchLatestUsdtNgnRate(), 
        null
      );
      
      // First, load core rates data with optimized loader
      const { usdtRate, fxRates, success } = await withRetry(
        () => loadRatesData(
          setFxRates,
          setVertoFxRates,
          () => {}, // Handle loading state separately
          isMobile
        ),
        { usdtRate: 0, fxRates: {}, success: false }
      );
      
      // Set USDT rate immediately for faster UI update
      if (usdtRate && usdtRate > 0) {
        setUsdtNgnRate(usdtRate);
      }
      
      // Try to get Bybit rate in parallel with short timeout
      const bybitRate = await Promise.race([
        fetchBybitRate(),
        new Promise<null>(resolve => setTimeout(() => resolve(null), isMobile ? 1000 : 2000))
      ]);
      
      // Use the best rate available
      const dbRate = await dbRatePromise;
      const finalRate = (bybitRate && bybitRate > 0) ? bybitRate : 
                        (usdtRate && usdtRate > 0) ? usdtRate :
                        (dbRate && dbRate > 0) ? dbRate : DEFAULT_RATE;
      
      setUsdtNgnRate(finalRate);
      
      // Apply margin settings in parallel
      await withRetry(
        () => loadAndApplyMarginSettings(
          calculateAllCostPrices,
          fxRates,
          finalRate
        ),
        undefined
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
      
      return success;
    } catch (error) {
      console.error("[useRatesLoader] Error loading data:", error);
      
      // Show error toast with icon
      toast.error("Failed to load rates data", {
        description: "Using default values instead",
        icon: <AlertTriangle className="h-4 w-4" />,
      });
      
      // Use default values as fallback
      setUsdtNgnRate(DEFAULT_RATE);
      calculateAllCostPrices(2.5, 3.0);
      
      return false;
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
