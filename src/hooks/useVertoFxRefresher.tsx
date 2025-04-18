import { useCallback, useEffect, useState, useRef } from 'react';
import { VertoFXRates } from '@/services/api';
import { loadVertoFxRates } from '@/utils/rates/vertoRateLoader';
import { logger } from '@/utils/logUtils';

interface VertoFxRefresherProps {
  setVertoFxRates: (rates: VertoFXRates) => void;
  vertoFxRates: VertoFXRates;
}

/**
 * Custom hook to handle automatic refreshing of VertoFX rates every minute
 */
export const useVertoFxRefresher = ({
  setVertoFxRates,
  vertoFxRates
}: VertoFxRefresherProps) => {
  // State for tracking next refresh countdown
  const [nextRefreshIn, setNextRefreshIn] = useState(60); // 60 seconds default
  
  // State to indicate when a refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State to track the last time rates were updated
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Function to manually refresh VertoFX rates
  const refreshVertoFxRates = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    logger.debug("VertoFxRefresher: Manually refreshing VertoFX rates");
    setIsRefreshing(true);
    
    try {
      // Force bypass the cooldown check if forceRefresh is true
      if (forceRefresh) {
        const now = Date.now() - 40000; // Set to 40 seconds ago to bypass the 30 second cooldown
        global.window.localStorage.setItem('lastVertoFxApiAttempt', now.toString());
      }
      
      // Use a temporary state updater function for loadVertoFxRates
      const tempSetRates = (rates: VertoFXRates) => {
        setVertoFxRates(rates);
        setLastUpdated(new Date());
      };
      
      // Call the loader function with our temporary state updater
      const updatedRates = await loadVertoFxRates(false, tempSetRates);
      
      if (updatedRates && Object.keys(updatedRates).length > 0) {
        logger.info("VertoFxRefresher: Successfully refreshed VertoFX rates");
        return true;
      } else {
        logger.warn("VertoFxRefresher: No valid rates returned");
        return false;
      }
    } catch (error) {
      logger.error("VertoFxRefresher: Error refreshing rates:", error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [setVertoFxRates]);
  
  // Function to perform auto-refresh (without UI notifications)
  const performAutoRefresh = useCallback(async () => {
    logger.debug("VertoFxRefresher: Performing auto-refresh");
    setIsRefreshing(true);
    
    try {
      // Create a temporary state updater that doesn't trigger UI updates
      const silentSetRates = (rates: VertoFXRates) => {
        // Only update if we actually got valid rates
        if (rates && Object.keys(rates).length > 0) {
          setVertoFxRates(rates);
          setLastUpdated(new Date());
        }
      };
      
      await loadVertoFxRates(false, silentSetRates);
      logger.debug("VertoFxRefresher: Auto-refresh completed");
    } catch (error) {
      logger.error("VertoFxRefresher: Auto-refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [setVertoFxRates]);
  
  // Set up countdown timer and auto-refresh every minute
  useEffect(() => {
    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          // Trigger auto-refresh when countdown reaches 0
          performAutoRefresh(); 
          return 60; // Reset to 60 seconds
        }
        return prev - 1;
      });
    }, 1000);
    
    // Initial refresh on mount
    performAutoRefresh();
    
    // Clean up
    return () => {
      clearInterval(countdownInterval);
    };
  }, [performAutoRefresh]);
  
  return {
    refreshVertoFxRates,
    nextRefreshIn,
    isRefreshing,
    lastUpdated
  };
}; 