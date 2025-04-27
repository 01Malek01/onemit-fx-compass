
import { useState, useEffect, useCallback } from 'react';
import useCurrencyData from '@/hooks/useCurrencyData';
import { fetchMarginSettings } from '@/services/margin-settings-service';
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useRateRefresher } from '@/hooks/useRateRefresher';
import { useMarginManager } from '@/hooks/useMarginManager';
import { useOneremitRates } from '@/hooks/useOneremitRates';
import { toast } from 'sonner';
import { useVertoFxRefresher } from '@/hooks/useVertoFxRefresher';

export const useDashboardState = () => {
  // Use our custom hook for currency data
  const [
    { usdtNgnRate, costPrices, previousCostPrices, vertoFxRates: rawVertoFxRates, lastUpdated, isLoading, fxRates },
    { loadAllData, setUsdtNgnRate, calculateAllCostPrices, refreshBybitRate, setVertoFxRates: setRawVertoFxRates }
  ] = useCurrencyData();

  // Ensure vertoFxRates has the required properties
  const vertoFxRates: VertoFXRates = {
    USD: rawVertoFxRates?.USD || { buy: 0, sell: 0 },
    EUR: rawVertoFxRates?.EUR || { buy: 0, sell: 0 },
    GBP: rawVertoFxRates?.GBP || { buy: 0, sell: 0 },
    CAD: rawVertoFxRates?.CAD || { buy: 0, sell: 0 },
    ...rawVertoFxRates
  };

  // Create a wrapper for setVertoFxRates that ensures required properties
  const setVertoFxRates = useCallback((rates: VertoFXRates) => {
    const safeRates: VertoFXRates = {
      USD: rates?.USD || { buy: 0, sell: 0 },
      EUR: rates?.EUR || { buy: 0, sell: 0 },
      GBP: rates?.GBP || { buy: 0, sell: 0 },
      CAD: rates?.CAD || { buy: 0, sell: 0 },
      ...rates
    };
    setRawVertoFxRates(safeRates);
  }, [setRawVertoFxRates]);

  // Use VertoFX refresher
  const { 
    refreshVertoFxRates,
    nextRefreshIn: vertoNextRefreshIn
  } = useVertoFxRefresher({
    vertoFxRates,
    setVertoFxRates
  });

  // Use our rate refresher hook with countdown
  const { handleRefresh, handleBybitRateRefresh, nextRefreshIn } = useRateRefresher({
    usdtNgnRate,
    costPrices,
    fxRates,
    refreshBybitRate,
    calculateAllCostPrices,
    refreshVertoFXRates: refreshVertoFxRates, // Add the missing property
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

  // Modify the initial data loading effect
  useEffect(() => {
    console.log("DashboardContainer: Running initial data loading effect");
    const initialize = async () => {
      try {
        // Load all currency data including VertoFX rates
        await loadAllData();

        // Fetch margin settings
        const settings = await fetchMarginSettings();
        if (settings) {
          setUsdMargin(settings.usd_margin);
          setOtherCurrenciesMargin(settings.other_currencies_margin);
          calculateAllCostPrices(settings.usd_margin, settings.other_currencies_margin);
        }
      } catch (error) {
        console.error("Error during initialization:", error);
        toast.error("Failed to load market data", {
          description: "Please refresh the page or try again later"
        });
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
    setVertoFxRates,
  };
};
