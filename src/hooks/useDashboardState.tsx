
import { useState, useEffect, useCallback } from 'react';
import useCurrencyData from '@/hooks/useCurrencyData';
import { fetchMarginSettings, updateMarginSettings } from '@/services/margin-settings-service';
import { fetchLatestUsdtNgnRate } from '@/services/usdt-ngn-service';
import { CurrencyRates } from '@/services/api';
import { saveHistoricalRates } from '@/services/historical-rates-service';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';

export const useDashboardState = () => {
  // Margins state
  const [usdMargin, setUsdMargin] = useState<number>(2.5);
  const [otherCurrenciesMargin, setOtherCurrenciesMargin] = useState<number>(3.0);
  
  // Use our custom hook for currency data
  const [
    { usdtNgnRate, costPrices, previousCostPrices, vertoFxRates, lastUpdated, isLoading, fxRates },
    { loadAllData, updateUsdtRate, setUsdtNgnRate, calculateAllCostPrices, refreshBybitRate }
  ] = useCurrencyData();

  // Handler for real-time USDT/NGN rate updates
  const handleRealtimeUsdtRateUpdate = (rate: number) => {
    console.log("Received real-time USDT/NGN rate update:", rate);
    setUsdtNgnRate(rate);
    calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
  };
  
  // Handler for real-time margin settings updates
  const handleRealtimeMarginUpdate = (newUsdMargin: number, newOtherMargin: number) => {
    console.log("Received real-time margin settings update:", { newUsdMargin, newOtherMargin });
    setUsdMargin(newUsdMargin);
    setOtherCurrenciesMargin(newOtherMargin);
    calculateAllCostPrices(newUsdMargin, newOtherMargin);
  };
  
  // Set up real-time subscriptions
  useRealtimeUpdates({
    onUsdtRateChange: handleRealtimeUsdtRateUpdate,
    onMarginSettingsChange: handleRealtimeMarginUpdate
  });

  // Refresh Bybit rate on an interval
  useEffect(() => {
    // Refresh every 10 minutes (600000 milliseconds)
    const intervalId = setInterval(() => {
      console.log("Auto-refreshing Bybit rate...");
      refreshBybitRate().catch(console.error);
    }, 600000);
    
    return () => clearInterval(intervalId);
  }, [refreshBybitRate]);

  // Load initial data - make sure this runs only once and correctly loads the data
  useEffect(() => {
    console.log("DashboardContainer: Running initial data loading effect");
    const initialize = async () => {
      try {
        // Load all currency data including Bybit rate
        console.log("DashboardContainer: Initializing and loading all data");
        await loadAllData();
        
        // Fetch margin settings from database
        const settings = await fetchMarginSettings();
        if (settings) {
          console.log("Initial margin settings loaded:", settings);
          setUsdMargin(settings.usd_margin);
          setOtherCurrenciesMargin(settings.other_currencies_margin);
          
          // Calculate cost prices with the loaded margins
          calculateAllCostPrices(settings.usd_margin, settings.other_currencies_margin);
        } else {
          console.warn("No margin settings found, using defaults");
        }
      } catch (error) {
        console.error("DashboardContainer: Error during initialization:", error);
      }
    };
    
    initialize();
  }, []);

  // Recalculate cost prices when rates or margins change
  useEffect(() => {
    if (usdtNgnRate !== null && usdtNgnRate > 0) {
      console.log("DashboardContainer: Recalculating with USDT rate:", usdtNgnRate);
      calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
    }
  }, [usdtNgnRate, usdMargin, otherCurrenciesMargin]);

  // Handle refresh button click
  const handleRefresh = async () => {
    console.log("DashboardContainer: Handling refresh button click");
    await loadAllData();
    
    // After loading data, recalculate with current margins
    calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
    
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

  // Handle manual Bybit rate refresh
  const handleBybitRateRefresh = useCallback(async () => {
    console.log("DashboardContainer: Manually refreshing Bybit rate");
    await refreshBybitRate();
    
    // After refreshing the rate, recalculate with current margins
    calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
  }, [refreshBybitRate, calculateAllCostPrices, usdMargin, otherCurrenciesMargin]);

  // Handle margin updates
  const handleMarginUpdate = async (newUsdMargin: number, newOtherMargin: number) => {
    console.log("DashboardContainer: Updating margins:", { newUsdMargin, newOtherMargin });
    // Update local state
    setUsdMargin(newUsdMargin);
    setOtherCurrenciesMargin(newOtherMargin);
    
    // Save margins to database
    const success = await updateMarginSettings(newUsdMargin, newOtherMargin);
    console.log("Margin update success:", success);
    
    // Recalculate prices with new margins
    if (success) {
      calculateAllCostPrices(newUsdMargin, newOtherMargin);
      
      // Save historical data after margin update with source="manual"
      try {
        if (usdtNgnRate && Object.keys(costPrices).length > 0) {
          await saveHistoricalRates(
            usdtNgnRate,
            newUsdMargin,
            newOtherMargin,
            fxRates,
            costPrices,
            'manual'
          );
          console.log("Historical data saved after margin update");
        }
      } catch (error) {
        console.error("Error saving historical data after margin update:", error);
      }
    }
  };

  // Generate Oneremit rates based on cost prices
  const getOneremitRates = (currencyCode: string): { buy: number; sell: number } => {
    const costPrice = costPrices[currencyCode] || 0;
    
    // In a real scenario, buy/sell would be calculated based on spread
    // For now, using a simple 2% spread for demonstration
    return {
      buy: costPrice,
      sell: costPrice * 0.98, // 2% lower for sell rate
    };
  };

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
  };
};
