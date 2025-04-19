
import { fetchBybitRateWithRetry } from '@/services/bybit/bybit-utils';
import { saveUsdtNgnRate } from '@/services/usdt-ngn-service';
import { logger } from '@/utils/logUtils';
import { useNotifications } from '@/contexts/NotificationContext';

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
  const { addNotification } = useNotifications();
  
  const fetchBybitRate = async (): Promise<number | null> => {
    try {
      logger.debug("Fetching Bybit P2P rate with improved retry logic");
      const { rate, error } = await fetchBybitRateWithRetry(3, 2000); // Increased retries to 3
      
      if (!rate || rate <= 0) {
        logger.warn(`Failed to get valid Bybit rate: ${error || "Unknown error"}`);
        return null;
      }
      
      logger.info("Bybit P2P rate fetched successfully:", rate);
      
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
        
        // Update local state
        setUsdtNgnRate(bybitRate);
        setLastUpdated(new Date());
        
        // Important: Save the rate to the database with explicit source value
        // This creates a new INSERT that will trigger real-time updates
        const saveSuccess = await saveUsdtNgnRate(bybitRate, 'bybit', false);
        
        if (!saveSuccess) {
          logger.error("Failed to save the rate to database for real-time sync");
        }
        
        // Show notification for the user who initiated the refresh
        addNotification({
          title: "USDT/NGN rate updated from Bybit",
          description: "The new rate will sync with all connected users",
          type: "success"
        });
        
        return true;
      } else {
        logger.warn("Could not refresh Bybit rate");
        
        addNotification({
          title: "Failed to update USDT/NGN rate from Bybit",
          description: "Using last saved rate instead",
          type: "error"
        });
        
        return false;
      }
    } catch (error) {
      logger.error("Error refreshing Bybit rate:", error);
      addNotification({
        title: "Failed to update USDT/NGN rate",
        description: "Check your network connection and try again",
        type: "error"
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
