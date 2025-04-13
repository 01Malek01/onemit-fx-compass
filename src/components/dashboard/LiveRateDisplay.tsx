
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, Shield, ShieldAlert } from 'lucide-react';
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

const RATE_UPDATE_EMOJIS = [
  '🚀', // Rapid update
  '💹', // Chart increasing
  '🔥', // Fire (hot update)
  '✨', // Sparkles
  '💡', // Idea
  '🌟', // Glowing star
];

const LiveRateDisplay: React.FC<LiveRateDisplayProps> = ({
  rate,
  lastUpdated,
  onRefresh,
  isLoading
}) => {
  // Track network errors
  const [hasNetworkError, setHasNetworkError] = useState(false);
  
  // Calculate if the rate is stale (more than 1 hour old)
  const isStale = useMemo(() => {
    if (!lastUpdated) return false;
    return (new Date().getTime() - lastUpdated.getTime() > 3600000); // 1 hour
  }, [lastUpdated]);
  
  // Check if the rate is missing entirely
  const isMissingRate = rate === null || rate <= 0;
  
  // Format the timestamp in the user's local timezone
  const formattedTimestamp = useMemo(() => {
    if (!lastUpdated) return 'never';
    
    return lastUpdated.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }, [lastUpdated]);
  
  // Use our custom hooks with memoized dependencies
  const { showUpdateFlash } = useRateAnimation({ 
    rate, 
    formattedTimestamp 
  });
  
  const { nextRefreshIn } = useRefreshCountdown({ lastUpdated });

  // Pick a random emoji when the rate updates - memoized to prevent unnecessary recalculations
  const updateEmoji = useMemo(() => {
    if (!showUpdateFlash) return null;
    
    // Use a secure random generator to avoid predictability
    const randomIndex = Math.floor(Math.random() * RATE_UPDATE_EMOJIS.length);
    return RATE_UPDATE_EMOJIS[randomIndex];
  }, [showUpdateFlash]);

  // Handle refresh with network error tracking
  const handleRefresh = async () => {
    try {
      const result = await onRefresh();
      setHasNetworkError(!result); // Set network error if refresh fails
      return result;
    } catch (error) {
      console.error("Error during refresh:", error);
      setHasNetworkError(true);
      return false;
    }
  };

  // Status icon based on rate state
  const StatusIcon = isMissingRate || hasNetworkError ? ShieldAlert : isStale ? Shield : Wifi;
  const statusTooltip = hasNetworkError 
    ? "Network connectivity issue - using fallback" 
    : isMissingRate 
    ? "Rate unavailable - using fallback" 
    : isStale 
    ? "Rate may be outdated" 
    : "Real-time rate connection";

  return (
    <Card 
      className={`fx-card relative overflow-hidden ${hasNetworkError || isMissingRate ? 'border-red-300 dark:border-red-900' : isStale ? 'border-amber-300 dark:border-amber-900' : ''}`} 
      data-testid="live-rate-display"
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" 
        aria-hidden="true"
      />
      
      {/* Update flash animation */}
      {showUpdateFlash && (
        <div 
          className="absolute inset-0 bg-primary/10 animate-fade-out pointer-events-none z-10" 
          aria-hidden="true"
        />
      )}
      
      {/* Card header */}
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div className="relative">
            <StatusIndicator rate={rate} isStale={isStale} hasNetworkError={hasNetworkError} />
          </div>
          <span id="rate-title">USDT/NGN Rate (Live from Bybit)</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-auto cursor-help" aria-describedby="rate-source-tooltip">
                  <StatusIcon
                    className={`h-3.5 w-3.5 ${
                      hasNetworkError || isMissingRate 
                        ? "text-red-500" 
                        : isStale 
                        ? "text-amber-500" 
                        : "text-muted-foreground opacity-70"
                    }`}
                    aria-label={statusTooltip}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" id="rate-source-tooltip">
                <p className="text-xs">{statusTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      
      {/* Card content */}
      <CardContent className="relative">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <RateValue rate={rate} showUpdateFlash={showUpdateFlash} />
              {updateEmoji && (
                <span 
                  className="text-2xl animate-bounce" 
                  role="img" 
                  aria-label="Rate update indicator"
                >
                  {updateEmoji}
                </span>
              )}
            </div>
            <TimestampDisplay lastUpdated={lastUpdated} rate={rate} isStale={isStale} hasNetworkError={hasNetworkError} />
            <RefreshCountdown nextRefreshIn={nextRefreshIn} />
          </div>
          <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
        </div>
        
        <StatusAlerts 
          rate={rate} 
          isStale={isStale} 
          onRetryClick={handleRefresh}
          networkError={hasNetworkError} 
        />
        <InfoNote />
      </CardContent>
    </Card>
  );
};

export default LiveRateDisplay;
