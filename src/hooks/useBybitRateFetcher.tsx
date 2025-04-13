
import { toast } from "sonner";
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
      
      // Save to the standard rate service for compatibility
      try {
        await saveUsdtNgnRate(rate);
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
        
        toast.success("USDT/NGN rate updated from Bybit");
        return true;
      } else {
        logger.warn("Could not refresh Bybit rate");
        
        toast.error("Failed to update USDT/NGN rate from Bybit", {
          description: "Using last saved rate instead"
        });
        
        return false;
      }
    } catch (error) {
      logger.error("Error refreshing Bybit rate:", error);
      toast.error("Failed to update USDT/NGN rate", {
        description: "Check your network connection and try again"
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
