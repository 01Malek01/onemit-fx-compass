
import React, { useEffect, useState, lazy, Suspense } from 'react';
import Header from '@/components/Header';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardState } from '@/hooks/useDashboardState';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import RateCalculatorSection from '@/components/dashboard/RateCalculatorSection';
import { BarChart3, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Lazy load non-critical sections for faster initial render
const CostPriceSection = lazy(() => import('@/components/dashboard/CostPriceSection'));
const MarketComparisonSection = lazy(() => import('@/components/dashboard/MarketComparisonSection'));

// Simple placeholder components for lazy-loaded components
const CostPricePlaceholder = () => <div className="animate-pulse h-64 w-full bg-muted/20 rounded-md"></div>;
const MarketPlaceholder = () => <div className="animate-pulse h-80 w-full bg-muted/20 rounded-md"></div>;

// Lazy loaded analytics component
const AnalyticsPlaceholder = () => (
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
);

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
    handleRefresh,
    handleBybitRateRefresh,
    handleMarginUpdate,
    getOneremitRates,
    fxRates,
  } = useDashboardState();
  
  // State for real-time indicator
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  
  // Create a wrapper for handleBybitRateRefresh that returns void
  const handleBybitRateRefreshWrapper = async (): Promise<void> => {
    await handleBybitRateRefresh();
    // Ignoring the boolean return value
  };
  
  // Optimized effect to track changes
  useEffect(() => {
    setIsRealtimeActive(true);
    const timer = setTimeout(() => setIsRealtimeActive(false), 1500);
    return () => clearTimeout(timer);
  }, [usdtNgnRate, usdMargin, otherCurrenciesMargin]);

  // Show simple loading state if no rate is available yet
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
          <div className="px-4 pb-2 flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Wifi className={`h-3 w-3 ${isRealtimeActive ? 'text-green-500 animate-pulse' : 'text-muted-foreground'}`} />
                    <span>Real-time updates {isRealtimeActive ? 'active' : 'enabled'}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Changes made by other users will appear automatically</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-3">
          <RateCalculatorSection 
            usdtNgnRate={usdtNgnRate}
            lastUpdated={lastUpdated}
            usdMargin={usdMargin}
            otherCurrenciesMargin={otherCurrenciesMargin}
            onBybitRateRefresh={handleBybitRateRefresh}
            onMarginUpdate={handleMarginUpdate}
            isLoading={isLoading}
          />
        </div>
      </div>

      <Suspense fallback={<CostPricePlaceholder />}>
        <CostPriceSection 
          costPrices={costPrices}
          previousCostPrices={previousCostPrices}
          isLoading={isLoading}
        />
      </Suspense>
      
      <Separator className="my-8 opacity-30" />
      
      <Suspense fallback={<MarketPlaceholder />}>
        <MarketComparisonSection 
          currencies={['USD', 'EUR', 'GBP', 'CAD']} 
          oneremitRatesFn={getOneremitRates}
          vertoFxRates={vertoFxRates}
          isLoading={isLoading}
        />
      </Suspense>
      
      <Separator className="my-8 opacity-30" />
      
      {/* Only render analytics placeholder after core content is loaded */}
      <Suspense fallback={null}>
        <AnalyticsPlaceholder />
      </Suspense>
    </div>
  );
};

export default DashboardContainer;
