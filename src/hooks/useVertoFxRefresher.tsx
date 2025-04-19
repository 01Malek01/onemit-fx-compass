import { useCallback, useEffect, useState, useRef } from 'react';
import { VertoFXRates } from '@/services/api';
import { loadVertoFxRates, getTimeUntilNextAttempt, isVertoFxRateLimited } from '@/utils/rates/vertoRateLoader';
import { logger } from '@/utils/logUtils';
import { addNotification } from '@/contexts/NotificationContext';

interface VertoFxRefresherProps {
  setVertoFxRates: (rates: VertoFXRates) => void;
  vertoFxRates: VertoFXRates;
}

// Default refresh interval in seconds
const DEFAULT_REFRESH_INTERVAL = 60;

/**
 * Custom hook to handle automatic refreshing of VertoFX rates every minute
 * with improved rate limiting awareness
 */
export const useVertoFxRefresher = ({
  setVertoFxRates,
  vertoFxRates
}: VertoFxRefresherProps) => {
  // State for tracking next refresh countdown
  const [nextRefreshIn, setNextRefreshIn] = useState(DEFAULT_REFRESH_INTERVAL);
  
  // State to indicate when a refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State to track the last time rates were updated
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // State to track if we're currently rate limited
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  // Function to get the correct next refresh time
  const updateNextRefreshTime = useCallback(() => {
    // Check with the rate limiting system for accurate timing
    const timeUntilNextCall = getTimeUntilNextAttempt();
    const isLimited = isVertoFxRateLimited();
    
    // Update the rate limited state if needed
    if (isLimited !== isRateLimited) {
      setIsRateLimited(isLimited);
    }
    
    // If we're rate limited or have a cooldown, use that time as countdown
    if (timeUntilNextCall > 0) {
      setNextRefreshIn(timeUntilNextCall);
      return timeUntilNextCall;
    }
    
    // Otherwise, use the default refresh interval
    return nextRefreshIn;
  }, [nextRefreshIn, isRateLimited]);
  
  // Function to manually refresh VertoFX rates
  const refreshVertoFxRates = useCallback(async (forceRefresh: boolean = false): Promise<boolean> => {
    logger.debug("VertoFxRefresher: Manually refreshing VertoFX rates", { forceRefresh });
    
    // Don't allow refresh if rate limited and not forcing
    if (isVertoFxRateLimited() && !forceRefresh) {
      logger.warn("VertoFxRefresher: Currently rate limited, cannot refresh");
      return false;
    }
    
    setIsRefreshing(true);
    
    try {
      // Use a temporary state updater function for loadVertoFxRates
      const tempSetRates = (rates: VertoFXRates) => {
        setVertoFxRates(rates);
        setLastUpdated(new Date());
      };
      
      // Call the loader function with our temporary state updater and the forceRefresh flag
      const updatedRates = await loadVertoFxRates(false, tempSetRates, forceRefresh);
      
      // After refresh, update the countdown time based on rate limits
      updateNextRefreshTime();
      
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
  }, [setVertoFxRates, updateNextRefreshTime]);
  
  // Function to perform auto-refresh (without UI notifications)
  const performAutoRefresh = useCallback(async () => {
    // Don't auto-refresh if we're rate limited
    if (isVertoFxRateLimited()) {
      addNotification({
        title: "Rate Limited",
        description: "VertoFX API access is temporarily restricted",
        type: "warning"
      });
      return;
    }
    
    logger.debug("VertoFxRefresher: Performing auto-refresh");
    setIsRefreshing(true);
    
    try {
      // Create a temporary state updater that doesn't trigger UI updates
      const silentSetRates = (rates: VertoFXRates) => {
        // Only update if we actually got valid rates
        if (rates && Object.keys(rates).length > 0) {
          setVertoFxRates(rates);
          setLastUpdated(new Date());
          
          addNotification({
            title: "Auto Market Rate Refresh",
            description: "Rates automatically updated in background",
            type: "info"
          });
        }
      };
      
      // Automatic refreshes are NOT forced - they respect the cooldown
      await loadVertoFxRates(false, silentSetRates, false);
      logger.debug("VertoFxRefresher: Auto-refresh completed");
    } catch (error) {
      addNotification({
        title: "Auto Refresh Failed",
        description: "Could not update market rates automatically",
        type: "error"
      });
    } finally {
      setIsRefreshing(false);
      // Update the countdown based on rate limits
      updateNextRefreshTime();
    }
  }, [setVertoFxRates, updateNextRefreshTime]);
  
  // Set up countdown timer and auto-refresh - use a ref to track if mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    // First, check if we're currently rate limited and update the state
    setIsRateLimited(isVertoFxRateLimited());
    
    // Initial update for next refresh time
    updateNextRefreshTime();
    
    // Prevent duplicate refreshes by using a mount check
    if (!isMountedRef.current) {
      return;
    }
    isMountedRef.current = false;
    
    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          // Before triggering refresh, check for rate limiting again
          if (isVertoFxRateLimited()) {
            // If rate limited, update time to reflect the actual wait time
            const limitedTime = getTimeUntilNextAttempt();
            if (limitedTime > 0) {
              return limitedTime;
            }
            // If still limited but no time reported, use default
            return DEFAULT_REFRESH_INTERVAL;
          }
          
          // Trigger auto-refresh when countdown reaches 0 and not rate limited
          performAutoRefresh(); 
          return DEFAULT_REFRESH_INTERVAL; // Reset to default interval
        }
        return prev - 1;
      });
      
      // Every 5 seconds, check for rate limiting changes
      if (nextRefreshIn % 5 === 0) {
        updateNextRefreshTime();
      }
    }, 1000);
    
    // Initial refresh on mount if not rate limited
    if (!isVertoFxRateLimited()) {
      performAutoRefresh();
    }
    
    // Clean up
    return () => {
      clearInterval(countdownInterval);
      isMountedRef.current = true; // Reset for next mount if component remounts
    };
  }, []); // Empty dependency array to ensure this runs only once on mount
  
  return {
    refreshVertoFxRates,
    nextRefreshIn,
    isRefreshing,
    lastUpdated,
    isRateLimited
  };
};
