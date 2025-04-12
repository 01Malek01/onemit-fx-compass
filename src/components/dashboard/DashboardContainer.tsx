
import React, { useEffect } from 'react';
import Header from '@/components/Header';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardState } from '@/hooks/useDashboardState';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import RateCalculatorSection from '@/components/dashboard/RateCalculatorSection';
import CostPriceSection from '@/components/dashboard/CostPriceSection';
import MarketComparisonSection from '@/components/dashboard/MarketComparisonSection';
import { BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Debug logging to track usdtNgnRate changes
  useEffect(() => {
    console.log("👀 usdtNgnRate value in DashboardContainer:", usdtNgnRate);
  }, [usdtNgnRate]);

  // Show loading state if usdtNgnRate is null
  if (usdtNgnRate === null) {
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
      
      <Separator className="my-8 opacity-30" />
      
      {/* Analytics placeholder section */}
      <Card className="fx-card relative overflow-hidden mt-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" aria-hidden="true" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Rate Analytics</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-lg text-muted-foreground mb-4">
              Historical data will appear here soon
            </p>
            <Button disabled className="opacity-70">
              View Trends
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardContainer;
