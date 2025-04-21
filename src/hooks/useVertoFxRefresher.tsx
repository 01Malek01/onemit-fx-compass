import { useCallback, useEffect, useState, useRef } from 'react';
import { VertoFXRates } from '@/services/api';
import { loadVertoFxRates, getTimeUntilNextAttempt, isVertoFxRateLimited } from '@/utils/rates/vertoRateLoader';
import { logger } from '@/utils/logUtils';
import { useNotifications } from '@/contexts/NotificationContext';

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
  // Get the notification context functions
  const { addNotification } = useNotifications();

  // State for tracking next refresh countdown
  const [nextRefreshIn, setNextRefreshIn] = useState(600);

  // State to indicate when a refresh is in progress
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State to track the last time rates were updated
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // State to track if we're currently rate limited
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Add a ref to track initial load
  const isInitialLoadRef = useRef(true);

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
  }, [setVertoFxRates, updateNextRefreshTime, addNotification]);

  // Function to perform initial load
  const performInitialLoad = useCallback(async () => {
    logger.debug("VertoFxRefresher: Performing initial load");
    setIsRefreshing(true);

    try {
      const updatedRates = await loadVertoFxRates(false, setVertoFxRates, true);
      if (updatedRates && Object.keys(updatedRates).length > 0) {
        setLastUpdated(new Date());
        logger.info("VertoFxRefresher: Successfully loaded initial rates");
      }
    } catch (error) {
      logger.error("VertoFxRefresher: Error during initial load:", error);
    } finally {
      setIsRefreshing(false);
      updateNextRefreshTime();
    }
  }, [setVertoFxRates, updateNextRefreshTime]);

  // Update the useEffect to handle initial load
  useEffect(() => {
    // Perform initial load immediately
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      performInitialLoad();
    }

    // Set up the regular refresh interval
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          if (!isVertoFxRateLimited()) {
            performAutoRefresh();
          }
          return DEFAULT_REFRESH_INTERVAL; // Reset to 1 minute
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [performInitialLoad, performAutoRefresh]);

  return {
    refreshVertoFxRates,
    nextRefreshIn,
    isRefreshing,
    lastUpdated,
    isRateLimited
  };
};
