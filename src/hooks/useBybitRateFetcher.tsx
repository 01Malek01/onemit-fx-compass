import { fetchBybitRateWithRetry } from '@/services/bybit/bybit-utils';
import { saveUsdtNgnRate } from '@/services/usdt-ngn-service';
import { logger } from '@/utils/logUtils';

interface BybitRateFetcherProps {
  setUsdtNgnRate: (rate: number) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useBybitRateFetcher = ({
  setUsdtNgnRate,
  setLastUpdated,
  setIsLoading
}: BybitRateFetcherProps) => {
  
  const fetchBybitRate = async (): Promise<number | null> => {
    try {
      logger.debug("Fetching Bybit P2P rate with improved retry logic");
      const { rate, error } = await fetchBybitRateWithRetry(3, 2000); // Increased retries to 3
      
      if (!rate || rate <= 0) {
        logger.warn(`Failed to get valid Bybit rate: ${error || "Unknown error"}`);
        return null;
      }
      
      logger.info("Bybit P2P rate fetched successfully:", rate);
      
      // Save to the standard rate service with 'bybit' as source
      try {
        // Always use silent=true here, as toast notifications are managed at a higher level
        await saveUsdtNgnRate(rate, 'bybit', true);
      } catch (err) {
        logger.error("Failed to save Bybit rate to database:", err);
        // Continue execution even if save fails
      }
      
      return rate;
    } catch (error) {
      logger.error("Error in fetchBybitRate:", error);
      return null;
    }
  };

  const refreshBybitRate = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const bybitRate = await fetchBybitRate();
      
      if (bybitRate && bybitRate > 0) {
        logger.info("Refreshed Bybit USDT/NGN rate:", bybitRate);
        setUsdtNgnRate(bybitRate);
        setLastUpdated(new Date());
        
        // Show toast only for manual refresh with clearer messaging about real-time updates
        import('sonner').then(({ toast }) => {
          toast.success("USDT/NGN rate updated from Bybit", {
            description: "The new rate will sync with all connected users"
          });
        });
        
        return true;
      } else {
        logger.warn("Could not refresh Bybit rate");
        
        import('sonner').then(({ toast }) => {
          toast.error("Failed to update USDT/NGN rate from Bybit", {
            description: "Using last saved rate instead"
          });
        });
        
        return false;
      }
    } catch (error) {
      logger.error("Error refreshing Bybit rate:", error);
      import('sonner').then(({ toast }) => {
        toast.error("Failed to update USDT/NGN rate", {
          description: "Check your network connection and try again"
        });
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchBybitRate,
    refreshBybitRate
  };
};
