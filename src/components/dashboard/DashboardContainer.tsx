
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
    const initialize = async () => {
      // Load all currency data
      await loadAllData();
      
      // Fetch margin settings from database
      const settings = await fetchMarginSettings();
      if (settings) {
        setUsdMargin(settings.usd_margin);
        setOtherCurrenciesMargin(settings.other_currencies_margin);
        
        // Calculate cost prices with the loaded margins
        calculateAllCostPrices(settings.usd_margin, settings.other_currencies_margin);
      }
    };
    
    initialize();
  }, []);

  // Recalculate cost prices when rates or margins change
  useEffect(() => {
    if (usdtNgnRate > 0) {
      calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
    }
  }, [usdtNgnRate, usdMargin, otherCurrenciesMargin]);

  // Handle refresh button click
  const handleRefresh = async () => {
    await loadAllData();
    
    // After loading data, recalculate with current margins
    calculateAllCostPrices(usdMargin, otherCurrenciesMargin);
  };

  // Handle USDT/NGN rate update
  const handleUsdtRateUpdate = async () => {
    if (usdtNgnRate > 0) {
      await updateUsdtRate(usdtNgnRate);
    }
  };

  // Handle margin updates
  const handleMarginUpdate = async (newUsdMargin: number, newOtherMargin: number) => {
    // Update local state
    setUsdMargin(newUsdMargin);
    setOtherCurrenciesMargin(newOtherMargin);
    
    // Save margins to database
    await updateMarginSettings(newUsdMargin, newOtherMargin);
    
    // Recalculate prices with new margins
    calculateAllCostPrices(newUsdMargin, newOtherMargin);
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
