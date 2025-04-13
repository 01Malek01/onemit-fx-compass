
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Clock, Wifi, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LiveRateDisplayProps {
  rate: number | null;
  lastUpdated: Date | null;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const LiveRateDisplay: React.FC<LiveRateDisplayProps> = ({
  rate,
  lastUpdated,
  onRefresh,
  isLoading
}) => {
  // Format the rate with comma separators - memoized to avoid re-renders
  const formattedRate = useMemo(() => {
    return rate ? 
      new Intl.NumberFormat('en-NG', { 
        style: 'currency', 
        currency: 'NGN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(rate) : '₦0.00';
  }, [rate]);
  
  // Format the timestamp in the user's local timezone
  const formattedTimestamp = useMemo(() => {
    if (!lastUpdated) return 'never';
    
    return lastUpdated.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }, [lastUpdated]);

  // Check if the rate is stale (more than 1 hour old)
  const isStale = useMemo(() => {
    return lastUpdated && 
      (new Date().getTime() - lastUpdated.getTime() > 3600000);
  }, [lastUpdated]);

  return (
    <Card className="fx-card relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" 
        aria-hidden="true"
      />
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div className="relative">
            {rate ? (
              <>
                <div className={`absolute -left-1 -top-1 w-2 h-2 ${isStale ? "bg-amber-500" : "bg-green-500"} rounded-full animate-ping`}></div>
                <div className={`w-2 h-2 ${isStale ? "bg-amber-500" : "bg-green-500"} rounded-full`}></div>
              </>
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
          </div>
          USDT/NGN Rate (Live from Bybit)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto cursor-help">
                  <Wifi className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Live rates via secure server proxy to Bybit P2P exchange</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-2xl font-bold">
              {rate ? formattedRate : 'Unavailable'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Last updated: {formattedTimestamp}
              {!rate && lastUpdated && 
                <span className="inline-flex items-center gap-0.5 text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>(Using fallback)</span>
                </span>
              }
              {isStale && rate && 
                <span className="inline-flex items-center gap-0.5 text-amber-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>(Rate may be outdated)</span>
                </span>
              }
            </p>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="gap-1.5 relative overflow-hidden"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Updating...' : 'Refresh'}
          </Button>
        </div>
        
        {!rate && (
          <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Unable to fetch current rate from Bybit. Using last known rate or default value.</span>
          </div>
        )}
        
        {isStale && rate && (
          <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>This rate hasn't been updated recently. Consider refreshing to get the latest rate.</span>
          </div>
        )}
        
        <div className="mt-2 text-xs flex items-center gap-1.5 text-muted-foreground">
          <Info className="h-3.5 w-3.5" />
          <span>Rates are fetched through a secure server proxy to avoid CORS issues</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveRateDisplay;
