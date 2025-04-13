
import { useCallback } from 'react';
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

  return {
    handleRefresh,
    handleBybitRateRefresh
  };
};
