
import React from 'react';
import Header from '@/components/Header';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useDashboardState } from '@/hooks/useDashboardState';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import RateCalculatorSection from '@/components/dashboard/RateCalculatorSection';
import CostPriceSection from '@/components/dashboard/CostPriceSection';
import MarketComparisonSection from '@/components/dashboard/MarketComparisonSection';

const DashboardContainer = () => {
  const {
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
  } = useDashboardState();

  // Show loading state if usdtNgnRate is null or if isLoading is true
  if (usdtNgnRate === null || isLoading) {
    return <DashboardSkeleton />;
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
          <RateCalculatorSection 
            usdtNgnRate={usdtNgnRate}
            setUsdtNgnRate={setUsdtNgnRate}
            usdMargin={usdMargin}
            otherCurrenciesMargin={otherCurrenciesMargin}
            onUsdtRateUpdate={handleUsdtRateUpdate}
            onMarginUpdate={handleMarginUpdate}
            isLoading={isLoading}
          />
        </div>
      </div>

      <CostPriceSection 
        costPrices={costPrices}
        previousCostPrices={previousCostPrices}
        isLoading={isLoading}
      />
      
      <Separator className="my-8 opacity-30" />
      
      <MarketComparisonSection 
        currencies={['USD', 'EUR', 'GBP', 'CAD']} 
        oneremitRatesFn={getOneremitRates}
        vertoFxRates={vertoFxRates}
        isLoading={isLoading}
      />
    </div>
  );
};

export default DashboardContainer;
