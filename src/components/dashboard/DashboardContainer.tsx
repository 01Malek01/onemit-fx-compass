import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CurrencyInputPanel from '@/components/dashboard/CurrencyInputPanel';
import CostPricePanel from '@/components/dashboard/CostPricePanel';
import MarketComparisonPanel from '@/components/dashboard/MarketComparisonPanel';
import { Separator } from '@/components/ui/separator';
import useCurrencyData from '@/hooks/useCurrencyData';

const DashboardContainer = () => {
  // Margins state
  const [usdMargin, setUsdMargin] = useState<number>(2.5);
  const [otherCurrenciesMargin, setOtherCurrenciesMargin] = useState<number>(3.0);
  
  // Use our custom hook for currency data
  const [
    { usdtNgnRate, costPrices, previousCostPrices, vertoFxRates, lastUpdated, isLoading },
    { loadAllData, updateUsdtRate, setUsdtNgnRate, calculateAllCostPrices }
  ] = useCurrencyData();

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Recalculate cost prices when rates or margins change
  useEffect(() => {
    if (usdtNgnRate) {
      calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
    }
  }, [usdtNgnRate, usdMargin, otherCurrenciesMargin]);

  // Handle refresh button click
  const handleRefresh = () => {
    loadAllData();
  };

  // Handle USDT/NGN rate update
  const handleUsdtRateUpdate = () => {
    updateUsdtRate(usdtNgnRate);
  };

  // Handle margin updates
  const handleMarginUpdate = (newUsdMargin: number, newOtherMargin: number) => {
    setUsdMargin(newUsdMargin);
    setOtherCurrenciesMargin(newOtherMargin);
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Header 
        lastUpdated={lastUpdated} 
        onRefresh={handleRefresh} 
        isLoading={isLoading} 
      />

      <CurrencyInputPanel 
        usdtNgnRate={usdtNgnRate}
        setUsdtNgnRate={setUsdtNgnRate}
        usdMargin={usdMargin}
        otherCurrenciesMargin={otherCurrenciesMargin}
        onUsdtRateUpdate={handleUsdtRateUpdate}
        onMarginUpdate={handleMarginUpdate}
        isLoading={isLoading}
      />

      <h2 className="text-xl font-semibold mb-4 mt-8">Cost Prices (NGN)</h2>
      <CostPricePanel 
        costPrices={costPrices}
        previousCostPrices={previousCostPrices}
        isLoading={isLoading}
      />
      
      <Separator className="my-8" />
      
      <h2 className="text-xl font-semibold mb-4">Market Comparison</h2>
      <MarketComparisonPanel 
        currencies={['USD', 'EUR', 'GBP', 'CAD']} 
        oneremitRatesFn={getOneremitRates}
        vertoFxRates={vertoFxRates}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardContainer;
