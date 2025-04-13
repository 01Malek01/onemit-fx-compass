
import { useCallback, useEffect, useRef } from 'react';
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
  
  // Handle manual Bybit rate refresh
  const handleBybitRateRefresh = useCallback(async () => {
    console.log("RateRefresher: Manually refreshing Bybit rate");
    await refreshBybitRate();
    
    // After refreshing the rate, recalculate with current margins
    calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
  }, [refreshBybitRate, calculateAllCostPrices, usdMargin, otherCurrenciesMargin]);

  // Handle refresh button click
  const handleRefresh = async () => {
    console.log("RateRefresher: Handling refresh button click");
    await handleBybitRateRefresh();
    
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
  };

  // Setup automatic refresh interval (every 60 seconds)
  useEffect(() => {
    // Clear any existing timer
    if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }
    
    // Set up a new timer for auto-refresh every minute (60000ms)
    autoRefreshTimerRef.current = setInterval(async () => {
      console.log("RateRefresher: Auto-refreshing Bybit rate");
      try {
        // Important: Use await to ensure we get the result
        const success = await refreshBybitRate();
        
        // Only recalculate if the refresh was successful
        if (success) {
          calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
          
          // Save historical data after auto-refresh with source="auto"
          if (usdtNgnRate && Object.keys(costPrices).length > 0) {
            await saveHistoricalRates(
              usdtNgnRate,
              usdMargin,
              otherCurrenciesMargin,
              fxRates,
              costPrices,
              'auto'
            );
            console.log("Historical data saved after auto-refresh");
          }
        } else {
          console.warn("RateRefresher: Auto-refresh did not update the rate");
        }
      } catch (error) {
        console.error("Auto-refresh failed:", error);
      }
    }, 60000); // 1 minute interval
    
    // Cleanup on unmount
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
        autoRefreshTimerRef.current = null;
      }
    };
  }, [handleBybitRateRefresh, refreshBybitRate, calculateAllCostPrices, usdMargin, otherCurrenciesMargin, usdtNgnRate, costPrices, fxRates]);

  return {
    handleRefresh,
    handleBybitRateRefresh
  };
};
