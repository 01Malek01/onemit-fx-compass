
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Import our sub-components
import RateValue from './rate-display/RateValue';
import TimestampDisplay from './rate-display/TimestampDisplay';
import RefreshCountdown from './rate-display/RefreshCountdown';
import StatusAlerts from './rate-display/StatusAlerts';
import InfoNote from './rate-display/InfoNote';
import RefreshButton from './rate-display/RefreshButton';
import StatusIndicator from './rate-display/StatusIndicator';

// Import our custom hooks
import { useRateAnimation } from './rate-display/useRateAnimation';
import { useRefreshCountdown } from './rate-display/useRefreshCountdown';

interface LiveRateDisplayProps {
  rate: number | null;
  lastUpdated: Date | null;
  onRefresh: () => Promise<boolean>;
  isLoading: boolean;
}

const LiveRateDisplay: React.FC<LiveRateDisplayProps> = ({
  rate,
  lastUpdated,
  onRefresh,
  isLoading
}) => {
  // Calculate if the rate is stale (more than 1 hour old)
  const isStale = useMemo(() => {
    return lastUpdated && 
      (new Date().getTime() - lastUpdated.getTime() > 3600000);
  }, [lastUpdated]);
  
  // Format the timestamp in the user's local timezone
  const formattedTimestamp = useMemo(() => {
    if (!lastUpdated) return 'never';
    
    return lastUpdated.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }, [lastUpdated]);
  
  // Use our custom hooks
  const { showUpdateFlash } = useRateAnimation({ 
    rate, 
    formattedTimestamp 
  });
  
  const { nextRefreshIn } = useRefreshCountdown({ lastUpdated });

  return (
    <Card className="fx-card relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" 
        aria-hidden="true"
      />
      {showUpdateFlash && (
        <div 
          className="absolute inset-0 bg-primary/10 animate-fade-out pointer-events-none z-10" 
          aria-hidden="true"
        />
      )}
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div className="relative">
            <StatusIndicator rate={rate} isStale={isStale} />
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
            <RateValue rate={rate} showUpdateFlash={showUpdateFlash} />
            <TimestampDisplay lastUpdated={lastUpdated} rate={rate} isStale={isStale} />
            <RefreshCountdown nextRefreshIn={nextRefreshIn} />
          </div>
          <RefreshButton onRefresh={onRefresh} isLoading={isLoading} />
        </div>
        
        <StatusAlerts rate={rate} isStale={isStale} />
        <InfoNote />
      </CardContent>
    </Card>
  );
};

export default LiveRateDisplay;
