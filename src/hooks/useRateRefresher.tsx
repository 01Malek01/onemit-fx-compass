import { useCallback, useEffect, useRef, useState } from 'react';
import { saveHistoricalRates } from '@/services/historical-rates-service';
import { CurrencyRates } from '@/services/api';

interface RateRefresherProps {
  usdtNgnRate: number | null;
  usdMargin: number;
  otherCurrenciesMargin: number;
  costPrices: CurrencyRates;
  fxRates: CurrencyRates;
  refreshBybitRate: () => Promise<boolean>;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
}

export const useRateRefresher = ({
  usdtNgnRate,
  usdMargin,
  otherCurrenciesMargin,
  costPrices,
  fxRates,
  refreshBybitRate,
  calculateAllCostPrices
}: RateRefresherProps) => {
  // Reference to store timer
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add state for tracking next refresh
  const [nextRefreshIn, setNextRefreshIn] = useState(60); // 60 seconds

  // Handle manual Bybit rate refresh
  const handleBybitRateRefresh = useCallback(async () => {
    console.log("RateRefresher: Manually refreshing Bybit rate");
    const success = await refreshBybitRate();

    if (success) {
      console.log("RateRefresher: Manual refresh was successful");
      // After refreshing the rate, recalculate with current margins
      calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
      return true;
    } else {
      console.warn("RateRefresher: Manual refresh did not update the rate");
      return false;
    }
  }, [refreshBybitRate, calculateAllCostPrices, usdMargin, otherCurrenciesMargin]);

  // Handle refresh button click
  const handleRefresh = async () => {
    console.log("RateRefresher: Handling refresh button click");
    const success = await handleBybitRateRefresh();

    // Only save historical data if refresh was successful
    if (success) {
      // Save historical data after refresh with source="refresh"
      try {
        if (usdtNgnRate && Object.keys(costPrices).length > 0) {
          await saveHistoricalRates(
            usdtNgnRate,
            usdMargin,
            otherCurrenciesMargin,
            fxRates,
            costPrices,
            'refresh'
          );
          console.log("Historical data saved after refresh");
        }
      } catch (error) {
        console.error("Error saving historical data after refresh:", error);
      }
    }
  };

  // Function to handle the actual refresh
  const performRefresh = async () => {
    console.log("RateRefresher: Performing auto-refresh");
    try {
      const success = await refreshBybitRate();

      if (success) {
        console.log("RateRefresher: Auto-refresh successful");
        calculateAllCostPrices(usdMargin, otherCurrenciesMargin);

        // Save historical data
        if (usdtNgnRate && Object.keys(costPrices).length > 0) {
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
      console.error("Auto-refresh failed:", error);
    }
  };

  // Setup countdown timer and auto-refresh
  useEffect(() => {
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

    // Initial refresh
    performRefresh();

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
