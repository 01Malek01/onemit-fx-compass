
import { useState, useEffect } from 'react';
import useCurrencyData from '@/hooks/useCurrencyData';
import { fetchMarginSettings, updateMarginSettings } from '@/services/margin-settings-service';
import { fetchLatestUsdtNgnRate } from '@/services/usdt-ngn-service';
import { CurrencyRates } from '@/services/api';

export const useDashboardState = () => {
  // Margins state
  const [usdMargin, setUsdMargin] = useState<number>(2.5);
  const [otherCurrenciesMargin, setOtherCurrenciesMargin] = useState<number>(3.0);
  
  // Use our custom hook for currency data
  const [
    { usdtNgnRate, costPrices, previousCostPrices, vertoFxRates, lastUpdated, isLoading },
    { loadAllData, updateUsdtRate, setUsdtNgnRate, calculateAllCostPrices }
  ] = useCurrencyData();

  // Load initial data - make sure this runs only once and correctly loads the data
  useEffect(() => {
    console.log("DashboardContainer: Running initial data loading effect");
    const initialize = async () => {
      try {
        // Force-fetch the latest USDT/NGN rate first to ensure we have it
        const latestRate = await fetchLatestUsdtNgnRate();
        console.log("DashboardContainer: Pre-fetched latest USDT/NGN rate:", latestRate);
        
        if (latestRate && latestRate > 0) {
          console.log("DashboardContainer: Setting pre-fetched USDT/NGN rate:", latestRate);
          setUsdtNgnRate(latestRate); // Directly update the state
        }
        
        // Load all currency data
        console.log("DashboardContainer: Initializing and loading all data");
        await loadAllData();
        
        // After loading data, fetch the rate again to ensure we have the latest
        // This is crucial as sometimes the rate might not be set correctly in loadAllData due to async timing
        const confirmedRate = await fetchLatestUsdtNgnRate();
        if (confirmedRate && confirmedRate > 0) {
          console.log("DashboardContainer: Confirming USDT/NGN rate after loadAllData:", confirmedRate);
          setUsdtNgnRate(confirmedRate); // Force-set the rate again to ensure UI reflects latest value
        }
        
        // Fetch margin settings from database
        const settings = await fetchMarginSettings();
        if (settings) {
          console.log("Initial margin settings loaded:", settings);
          setUsdMargin(settings.usd_margin);
          setOtherCurrenciesMargin(settings.other_currencies_margin);
          
          // Calculate cost prices with the loaded margins and confirmed rate
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
    
    // After loading data, force fetch the latest rate again to ensure consistency
    const latestRate = await fetchLatestUsdtNgnRate();
    if (latestRate && latestRate > 0) {
      setUsdtNgnRate(latestRate);
    }
    
    // After loading data, recalculate with current margins
    calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
  };

  // Handle USDT/NGN rate update
  const handleUsdtRateUpdate = async () => {
    console.log("DashboardContainer: Handling USDT rate update with value:", usdtNgnRate);
    if (usdtNgnRate !== null && usdtNgnRate > 0) {
      await updateUsdtRate(usdtNgnRate);
    } else {
      console.warn("Attempted to update with invalid USDT rate:", usdtNgnRate);
    }
  };

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
    handleUsdtRateUpdate,
    handleMarginUpdate,
    getOneremitRates
  };
};
