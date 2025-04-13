
import { useState, useEffect } from 'react';
import useCurrencyData from '@/hooks/useCurrencyData';
import { fetchMarginSettings } from '@/services/margin-settings-service';
import { CurrencyRates } from '@/services/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useRateRefresher } from '@/hooks/useRateRefresher';
import { useMarginManager } from '@/hooks/useMarginManager';
import { useOneremitRates } from '@/hooks/useOneremitRates';

export const useDashboardState = () => {
  // Use our custom hook for currency data
  const [
    { usdtNgnRate, costPrices, previousCostPrices, vertoFxRates, lastUpdated, isLoading, fxRates },
    { loadAllData, setUsdtNgnRate, calculateAllCostPrices, refreshBybitRate }
  ] = useCurrencyData();

  // Use our rate refresher hook with countdown
  const { handleRefresh, handleBybitRateRefresh, nextRefreshIn } = useRateRefresher({
    usdtNgnRate,
    costPrices,
    fxRates,
    refreshBybitRate,
    calculateAllCostPrices,
    usdMargin: 2.5, // Default value, will be updated in useEffect
    otherCurrenciesMargin: 3.0 // Default value, will be updated in useEffect
  });

  // Use our margin manager hook
  const {
    usdMargin,
    otherCurrenciesMargin,
    setUsdMargin,
    setOtherCurrenciesMargin,
    handleMarginUpdate
  } = useMarginManager({
    usdtNgnRate,
    costPrices,
    fxRates,
    calculateAllCostPrices
  });

  // Use our Oneremit rates generator hook
  const { getOneremitRates } = useOneremitRates({
    costPrices
  });

  // Handler for real-time USDT/NGN rate updates
  const handleRealtimeUsdtRateUpdate = (rate: number) => {
    setUsdtNgnRate(rate);
    calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
  };

  // Handler for real-time margin settings updates
  const handleRealtimeMarginUpdate = (newUsdMargin: number, newOtherMargin: number) => {
    setUsdMargin(newUsdMargin);
    setOtherCurrenciesMargin(newOtherMargin);
    calculateAllCostPrices(newUsdMargin, newOtherMargin);
  };

  // Set up real-time subscriptions
  useRealtimeUpdates({
    onUsdtRateChange: handleRealtimeUsdtRateUpdate,
    onMarginSettingsChange: handleRealtimeMarginUpdate
  });

  // Load initial data - make sure this runs only once and correctly loads the data
  useEffect(() => {
    // Use a more concise log for initialization
    const initialize = async () => {
      try {
        // Load all currency data including Bybit rate
        await loadAllData();

        // Fetch margin settings from database
        const settings = await fetchMarginSettings();
        if (settings) {
          setUsdMargin(settings.usd_margin);
          setOtherCurrenciesMargin(settings.other_currencies_margin);

          // Calculate cost prices with the loaded margins
          calculateAllCostPrices(settings.usd_margin, settings.other_currencies_margin);
        } else {
          console.warn("No margin settings found, using defaults");
        }
      } catch (error) {
        console.error("Error during dashboard initialization:", error);
      }
    };

    initialize();
  }, []);

  // Recalculate cost prices when rates or margins change
  useEffect(() => {
    if (usdtNgnRate !== null && usdtNgnRate > 0) {
      calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
    }
  }, [usdtNgnRate, usdMargin, otherCurrenciesMargin, calculateAllCostPrices]);

  return {
    usdtNgnRate,
    costPrices,
    previousCostPrices,
    vertoFxRates,
    lastUpdated,
    isLoading,
    usdMargin,
    otherCurrenciesMargin,
    setUsdtNgnRate,
    handleRefresh,
    handleBybitRateRefresh,
    handleMarginUpdate,
    getOneremitRates,
    fxRates,
    nextRefreshIn,
  };
};
