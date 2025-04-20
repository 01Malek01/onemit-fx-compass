
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchVertoFxRates } from '@/services/vertofx';
import { storeVertoFxRates } from '@/services/vertofx-historical-service';
import { logger } from '@/utils/logUtils';
import { useNotifications } from '@/contexts/notifications/NotificationContext';

export const useVertoFxRefresher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const { addNotification } = useNotifications();
  
  const refreshVertoFxRates = async () => {
    setIsLoading(true);
    
    try {
      logger.info("Refreshing VertoFX rates");
      
      const rates = await fetchVertoFxRates();
      
      if (rates && rates.length > 0) {
        // Store the data in the database
        await storeVertoFxRates(rates);
        
        // Update the last refresh time
        const now = new Date();
        setLastRefreshTime(now);
        
        logger.info(`Successfully refreshed ${rates.length} VertoFX rates`);
        
        // Show a success toast
        toast.success('VertoFX rates updated successfully');
        
        // Add a notification
        addNotification({
          title: 'VertoFX rates updated',
          description: `${rates.length} currency rates refreshed`,
          type: 'success'
        });
        
        return rates;
      } else {
        throw new Error('No rates returned from VertoFX API');
      }
    } catch (error) {
      logger.error('Error refreshing VertoFX rates:', error);
      
      toast.error('Failed to refresh VertoFX rates');
      
      // Add an error notification
      addNotification({
        title: 'Failed to refresh VertoFX rates',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error'
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    refreshVertoFxRates,
    isLoading,
    lastRefreshTime
  };
};
