
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveHistoricalRates } from '@/services/historical-rates-service';
import { CurrencyRates } from '@/services/api';
import { logger } from '@/utils/logUtils';

interface RateRefresherProps {
  usdtNgnRate: number | null;
  usdMargin: number;
  otherCurrenciesMargin: number;
  costPrices: CurrencyRates;
  fxRates: CurrencyRates;
  refreshBybitRate: () => Promise<boolean>;
  refreshVertoFXRates: () => Promise<boolean>;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
}

export const useRateRefresher = ({
  usdtNgnRate,
  usdMargin,
  otherCurrenciesMargin,
  costPrices,
  fxRates,
  refreshBybitRate,
  refreshVertoFXRates,
  calculateAllCostPrices
}: RateRefresherProps) => {
  // Reference to store timer
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add state for tracking next refresh
  const [nextRefreshIn, setNextRefreshIn] = useState(60); // 60 seconds

  // Handle manual Bybit rate refresh
  const handleBybitRateRefresh = useCallback(async () => {
    logger.debug("RateRefresher: Manually refreshing Bybit rate");
    const success = await refreshBybitRate();

    if (success) {
      logger.debug("RateRefresher: Manual refresh was successful");
      // Ensure we have a valid rate before recalculating
      if (usdtNgnRate && usdtNgnRate > 0) {
        // After refreshing the rate, recalculate with current margins
        calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
      }
      return true;
    } else {
      logger.warn("RateRefresher: Manual refresh did not update the rate");
      return false;
    }
  }, [refreshBybitRate, calculateAllCostPrices, usdMargin, otherCurrenciesMargin, usdtNgnRate]);

  // Handle refresh button click
  const handleRefresh = async () => {
    logger.debug("RateRefresher: Handling refresh button click");

    try {
      // Refresh both Bybit and VertoFX rates concurrently
      const [bybitSuccess, vertoSuccess] = await Promise.all([
        handleBybitRateRefresh(),
        refreshVertoFXRates()
      ]);

      // Only save historical data if both refreshes were successful
      if (bybitSuccess) {
        try {
          if (usdtNgnRate && usdtNgnRate > 0 && Object.keys(costPrices).length > 0) {
            await saveHistoricalRates(
              usdtNgnRate,
              usdMargin,
              otherCurrenciesMargin,
              fxRates,
              costPrices,
              'refresh'
            );
            logger.debug("Historical data saved after refresh");
          }
        } catch (error) {
          logger.error("Error saving historical data after refresh:", error);
        }
      }
    } catch (error) {
      logger.error("Error during refresh:", error);
    }
  };

  // Function to handle the actual refresh
  const performRefresh = async () => {
    logger.debug("RateRefresher: Performing auto-refresh");
    try {
      // For auto-refresh, use a different approach - don't show toast notifications
      // We'll directly fetch the rate without notification
      const success = await refreshBybitRate();

      if (success) {
        logger.debug("RateRefresher: Auto-refresh successful");
        // Ensure we have a valid rate before recalculating
        if (usdtNgnRate && usdtNgnRate > 0) {
          calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
        }

        // Save historical data only if we have valid rates
        if (usdtNgnRate && usdtNgnRate > 0 && Object.keys(costPrices).length > 0) {
          await saveHistoricalRates(
            usdtNgnRate,
            usdMargin,
            otherCurrenciesMargin,
            fxRates,
            costPrices,
            'auto'
          );
        }
      }
    } catch (error) {
      logger.error("Auto-refresh failed:", error);
    }
  };

  // Setup countdown timer and auto-refresh
  useEffect(() => {
    // Perform initial refresh immediately
    performRefresh();

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          performRefresh(); // Trigger refresh when countdown reaches 0
          return 60; // Reset to 60 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
    };
  }, [usdMargin, otherCurrenciesMargin]);

  return {
    handleRefresh,
    handleBybitRateRefresh,
    nextRefreshIn
  };
};
