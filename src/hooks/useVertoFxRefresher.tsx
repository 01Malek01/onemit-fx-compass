
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { getAllNgnRates } from '@/services/vertofx';
import { saveVertoFxHistoricalRates } from '@/services/vertofx-historical-service';
import { logger } from '@/utils/logUtils';
import { useNotifications } from '@/contexts/notifications/NotificationContext';

const DEFAULT_REFRESH_INTERVAL = 60; // Default 60 seconds countdown

export const useVertoFxRefresher = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(DEFAULT_REFRESH_INTERVAL);
  const timerRef = useRef<number | null>(null);
  const { addNotification } = useNotifications();
  
  useEffect(() => {
    // Start countdown timer when component mounts or after refresh
    if (lastRefreshTime) {
      startCountdown();
    }
    
    return () => {
      // Clear timer on unmount
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [lastRefreshTime]);
  
  const startCountdown = () => {
    // Clear any existing timer
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    
    // Reset countdown
    setNextRefreshIn(DEFAULT_REFRESH_INTERVAL);
    
    // Set up interval to update countdown every second
    timerRef.current = window.setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current as number);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  const refreshVertoFxRates = async () => {
    setIsLoading(true);
    
    try {
      logger.info("Refreshing VertoFX rates");
      
      const rates = await getAllNgnRates();
      
      if (rates && Object.keys(rates).length > 0) {
        // Store the data in the database
        await saveVertoFxHistoricalRates(rates);
        
        // Update the last refresh time
        const now = new Date();
        setLastRefreshTime(now);
        
        logger.info(`Successfully refreshed ${Object.keys(rates).length} VertoFX rates`);
        
        // Show a success toast
        toast.success('VertoFX rates updated successfully');
        
        // Add a notification
        addNotification({
          title: 'VertoFX rates updated',
          description: `${Object.keys(rates).length} currency rates refreshed`,
          type: 'success'
        });
        
        // Restart countdown timer
        startCountdown();
        
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
    lastRefreshTime,
    nextRefreshIn
  };
};
