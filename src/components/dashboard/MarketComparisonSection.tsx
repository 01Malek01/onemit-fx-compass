import React from 'react';
import MarketComparisonPanel from '@/components/dashboard/MarketComparisonPanel';
import { VertoFXRates } from '@/services/api';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, TrendingUp, BarChartHorizontal, Activity } from 'lucide-react';
import { loadVertoFxRates, isUsingDefaultVertoFxRates, getLastApiAttemptTime } from '@/utils/rates/vertoRateLoader';
import { useVertoFxRefresher } from '@/hooks/useVertoFxRefresher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RefreshCountdown from './rate-display/RefreshCountdown';
import TimestampDisplay from './rate-display/TimestampDisplay';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MarketComparisonSectionProps {
  currencies: string[];
  oneremitRatesFn: (currency: string) => { buy: number; sell: number };
  vertoFxRates: VertoFXRates;
  isLoading: boolean;
  setVertoFxRates: (rates: VertoFXRates) => void;
}

const MarketComparisonSection: React.FC<MarketComparisonSectionProps> = ({
  currencies,
  oneremitRatesFn,
  vertoFxRates,
  isLoading,
  setVertoFxRates
}) => {
  // State to track retry button loading state
  const [retryLoading, setRetryLoading] = React.useState(false);
  // State to track if we're using default rates
  const [usingDefaults, setUsingDefaults] = React.useState(isUsingDefaultVertoFxRates());
  // State to track the last API attempt time
  const [lastAttemptTime, setLastAttemptTime] = React.useState(getLastApiAttemptTime());
  // State to add refresh animation
  const [isRefreshSuccess, setIsRefreshSuccess] = React.useState(false);
  
  // Use our new VertoFX auto-refresher hook
  const { 
    refreshVertoFxRates, 
    nextRefreshIn, 
    isRefreshing, 
    lastUpdated 
  } = useVertoFxRefresher({
    vertoFxRates,
    setVertoFxRates
  });
  
  // Update states initially and when props change
  React.useEffect(() => {
    setUsingDefaults(isUsingDefaultVertoFxRates());
    setLastAttemptTime(getLastApiAttemptTime());
  }, [vertoFxRates]);
  
  // Calculate cooldown time remaining
  const cooldownRemaining = React.useMemo(() => {
    const now = Date.now();
    const elapsed = now - lastAttemptTime;
    const cooldownPeriod = 30000; // 30 seconds
    return Math.max(0, cooldownPeriod - elapsed);
  }, [lastAttemptTime]);
  
  // Handler for manually refreshing VertoFX rates
  const handleRefreshVertoFxRates = async () => {
    if (retryLoading || isRefreshing) return;
    
    setRetryLoading(true);
    toast("Refreshing Market Comparison", {
      description: "Fetching the latest market rates..."
    });
    
    try {
      // Force update lastApiAttemptTimestamp to bypass the cooldown check in loadVertoFxRates
      // This is necessary to allow manual refreshes to work regardless of the cooldown period
      const now = Date.now() - 40000; // Set to 40 seconds ago to bypass the 30 second cooldown
      window.localStorage.setItem('lastVertoFxApiAttempt', now.toString());
      
      // Make sure to actually call loadVertoFxRates to get fresh data with force=true
      const freshRates = await loadVertoFxRates(true, setVertoFxRates);
      if (freshRates) {
        setVertoFxRates(freshRates);
      }
      
      // Refresh through the hook as well with force=true
      await refreshVertoFxRates(true);
      
      // Update our local tracking states
      setUsingDefaults(isUsingDefaultVertoFxRates());
      setLastAttemptTime(getLastApiAttemptTime());
      
      // Show success animation
      setIsRefreshSuccess(true);
      setTimeout(() => setIsRefreshSuccess(false), 1500);
      
      toast("Market Comparison Refreshed", {
        description: "Successfully updated with the latest rates"
      });
    } catch (error) {
      console.error("Error refreshing VertoFX rates:", error);
      toast("Refresh Failed", {
        description: "Could not fetch the latest rates. Please try again later."
      });
    } finally {
      setRetryLoading(false);
    }
  };
  
  return (
    <div className={cn(
      "rounded-lg border border-gray-800 bg-gradient-to-b from-gray-900/90 to-gray-950 p-5 shadow-xl backdrop-blur-sm",
      "transition-all duration-300 hover:shadow-blue-900/10 relative overflow-hidden"
    )}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-900/40 via-blue-500/60 to-blue-900/40" />
      
      {/* Background subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjkuNSAzMC41aDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1MCw1MCw1MCwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-10" />
      
      {/* Success refresh overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 pointer-events-none",
        "transition-opacity duration-700 ease-out",
        isRefreshSuccess ? "opacity-100" : "opacity-0"
      )} />
      
      {/* Modern deep header */}
      <div className="mb-6 pb-2 border-b border-gray-800/50 relative">
        {/* Background glow effect */}
        <div className="absolute -top-6 -left-6 -right-6 h-24 bg-gradient-to-r from-blue-600/10 via-indigo-600/15 to-blue-600/10 rounded-full blur-2xl opacity-70" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Icon with animated rings */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-1000"></div>
              <div className="relative h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-2xl flex items-center justify-center">
                <div className="absolute inset-0.5 rounded-[10px] bg-gray-950 opacity-80"></div>
                <div className="absolute h-12 w-12 rounded-xl animate-pulse-ring opacity-20"></div>
                <Activity className="h-6 w-6 text-blue-400 relative z-10" />
              </div>
            </div>
            
            {/* Title with gradient text */}
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-100 via-blue-100 to-gray-100 text-transparent bg-clip-text tracking-tight">
                Market Comparison
              </h2>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-blue-500"></span>
                Live exchange rates from multiple providers
              </p>
            </div>
          </div>
          
          {/* Refresh button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleRefreshVertoFxRates} 
                  variant="outline" 
                  size="sm" 
                  className={cn(
                    "gap-2 bg-gray-900 text-gray-200 border-gray-800 hover:bg-gray-800",
                    "transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10",
                    "flex items-center relative overflow-hidden rounded-lg py-2.5 px-4",
                    "after:absolute after:inset-0 after:z-10 after:h-full after:w-full after:bg-gradient-to-r after:from-transparent after:via-blue-500/10 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500",
                    retryLoading || isRefreshing ? "cursor-not-allowed opacity-80" : "hover:border-blue-500/50"
                  )}
                  disabled={retryLoading || isRefreshing}
                >
                  {/* Button background animation */}
                  {(retryLoading || isRefreshing) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-800 via-blue-800/50 to-gray-800 -z-10 animate-gradient-x" />
                  )}
                  
                  <RefreshCw className={cn(
                    "h-4 w-4 text-blue-400",
                    retryLoading || isRefreshing ? "animate-spin" : ""
                  )} />
                  
                  <span>
                    {retryLoading || isRefreshing
                      ? 'Refreshing...' 
                      : 'Refresh rates'
                    }
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-gray-800 text-gray-100 border-gray-700">
                <p>Fetch the latest market exchange rates</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {/* Last updated timestamp and auto-refresh countdown */}
      <div className="flex items-center justify-between mb-4 text-xs text-gray-400 bg-gray-800/30 rounded-md p-2 backdrop-blur-sm">
        <div>
          {lastUpdated && (
            <TimestampDisplay 
              lastUpdated={lastUpdated}
              rate={vertoFxRates && Object.keys(vertoFxRates).length > 0 ? 1 : null}
              isStale={usingDefaults}
            />
          )}
        </div>
        
        <div className="flex items-center gap-1 bg-gray-900/50 px-2 py-1 rounded-md border border-gray-800">
          <RefreshCountdown 
            nextRefreshIn={nextRefreshIn} 
            isRefreshing={isRefreshing || retryLoading} 
          />
        </div>
      </div>
      
      <div className="relative">
        {/* Loading overlay */}
        {(isLoading || retryLoading || isRefreshing) && (
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-10 rounded-md">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-blue-300 border-l-transparent animate-spin" />
              <p className="text-sm text-gray-300">Updating rates...</p>
            </div>
          </div>
        )}
        
        <MarketComparisonPanel 
          currencies={currencies} 
          oneremitRatesFn={oneremitRatesFn}
          vertoFxRates={vertoFxRates}
          isLoading={isLoading || retryLoading || isRefreshing}
        />
      </div>
    </div>
  );
};

export default MarketComparisonSection;
