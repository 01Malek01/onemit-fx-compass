import React from 'react';
import MarketComparisonPanel from '@/components/dashboard/MarketComparisonPanel';
import { VertoFXRates } from '@/services/api';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock } from 'lucide-react';
import { loadVertoFxRates, isUsingDefaultVertoFxRates, getLastApiAttemptTime } from '@/utils/rates/vertoRateLoader';
import { useVertoFxRefresher } from '@/hooks/useVertoFxRefresher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RefreshCountdown from './rate-display/RefreshCountdown';
import TimestampDisplay from './rate-display/TimestampDisplay';
import { toast } from '@/hooks/use-toast';

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
      global.window.localStorage.setItem('lastVertoFxApiAttempt', now.toString());
      
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
    <div className="animate-fade-in">
      <h2 className="text-xl font-medium mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Market Comparison
        </div>
        
        <Button 
          onClick={handleRefreshVertoFxRates} 
          variant="outline" 
          size="sm" 
          className="gap-1.5 text-gray-300 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:shadow-md"
          disabled={retryLoading || isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${retryLoading || isRefreshing ? 'animate-spin' : ''}`} />
          {retryLoading || isRefreshing
            ? 'Refreshing...' 
            : 'Refresh rates'
          }
        </Button>
      </h2>
      
      {/* Last updated timestamp and auto-refresh countdown */}
      <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
        <div>
          {lastUpdated && (
            <TimestampDisplay 
              lastUpdated={lastUpdated}
              rate={vertoFxRates && Object.keys(vertoFxRates).length > 0 ? 1 : null}
              isStale={usingDefaults}
            />
          )}
        </div>
        
        <RefreshCountdown 
          nextRefreshIn={nextRefreshIn} 
          isRefreshing={isRefreshing || retryLoading} 
        />
      </div>
      
      <MarketComparisonPanel 
        currencies={currencies} 
        oneremitRatesFn={oneremitRatesFn}
        vertoFxRates={vertoFxRates}
        isLoading={isLoading || retryLoading || isRefreshing}
      />
    </div>
  );
};

export default MarketComparisonSection;
