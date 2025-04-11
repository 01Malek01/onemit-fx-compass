import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CurrencyInputPanel from '@/components/dashboard/CurrencyInputPanel';
import CostPricePanel from '@/components/dashboard/CostPricePanel';
import MarketComparisonPanel from '@/components/dashboard/MarketComparisonPanel';
import { Separator } from '@/components/ui/separator';
import useCurrencyData from '@/hooks/useCurrencyData';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp } from 'lucide-react';
import { fetchMarginSettings, updateMarginSettings } from '@/services/margin-settings-service';
import { fetchLatestUsdtNgnRate } from '@/services/usdt-ngn-service';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardContainer = () => {
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

  // Show loading state if usdtNgnRate is null or if isLoading is true
  if (usdtNgnRate === null || isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="dashboard-bg absolute inset-0 -z-10"></div>
        <Card className="bg-card/80 backdrop-blur-sm border-border/40 mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="dashboard-bg absolute inset-0 -z-10"></div>
      
      <Card className="bg-card/80 backdrop-blur-sm border-border/40 mb-6 overflow-hidden">
        <CardContent className="p-0">
          <Header 
            lastUpdated={lastUpdated} 
            onRefresh={handleRefresh} 
            isLoading={isLoading} 
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-3">
          <Card className="fx-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowDownUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium">Rate Calculator</h2>
              </div>
              <CurrencyInputPanel 
                usdtNgnRate={usdtNgnRate}
                setUsdtNgnRate={setUsdtNgnRate}
                usdMargin={usdMargin}
                otherCurrenciesMargin={otherCurrenciesMargin}
                onUsdtRateUpdate={handleUsdtRateUpdate}
                onMarginUpdate={handleMarginUpdate}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
          Cost Prices (NGN)
        </h2>
        <CostPricePanel 
          costPrices={costPrices}
          previousCostPrices={previousCostPrices}
          isLoading={isLoading}
        />
      </div>
      
      <Separator className="my-8 opacity-30" />
      
      <div>
        <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
          Market Comparison
        </h2>
        <MarketComparisonPanel 
          currencies={['USD', 'EUR', 'GBP', 'CAD']} 
          oneremitRatesFn={getOneremitRates}
          vertoFxRates={vertoFxRates}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default DashboardContainer;
