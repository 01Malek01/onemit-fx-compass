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
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [nextRefreshIn, setNextRefreshIn] = useState(60);

  const handleBybitRateRefresh = useCallback(async () => {
    logger.debug("RateRefresher: Manually refreshing Bybit rate");
    const success = await refreshBybitRate();

    if (success) {
      logger.debug("RateRefresher: Manual refresh was successful");
      if (usdtNgnRate && usdtNgnRate > 0) {
        calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
      }
      return true;
    } else {
      logger.warn("RateRefresher: Manual refresh did not update the rate");
      return false;
    }
  }, [refreshBybitRate, calculateAllCostPrices, usdMargin, otherCurrenciesMargin, usdtNgnRate]);

  const handleRefresh = async () => {
    logger.debug("RateRefresher: Handling refresh button click");
    const success = await handleBybitRateRefresh();

    if (success) {
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
  };

  const performRefresh = async () => {
    logger.debug("RateRefresher: Performing auto-refresh");
    try {
      const success = await refreshBybitRate();

      if (success) {
        logger.debug("RateRefresher: Auto-refresh successful");
        if (usdtNgnRate && usdtNgnRate > 0) {
          calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
        }

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

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          performRefresh();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    performRefresh();

    return () => {
      clearInterval(countdownInterval);
    };
  }, [usdMargin, otherCurrenciesMargin, performRefresh]);

  return {
    handleRefresh,
    handleBybitRateRefresh,
    nextRefreshIn
  };
};
