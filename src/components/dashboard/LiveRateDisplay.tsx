import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wifi, BarChart4, ArrowUpRight, Activity, LineChart, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
  isRealtimeActive?: boolean; // Add optional real-time status prop
}
const RATE_UPDATE_EMOJIS = ['🚀',
// Rapid update
'💹',
// Chart increasing
'🔥',
// Fire (hot update)
'✨',
// Sparkles
'💡',
// Idea
'🌟' // Glowing star
];
const LiveRateDisplay: React.FC<LiveRateDisplayProps> = ({
  rate,
  lastUpdated,
  onRefresh,
  isLoading,
  isRealtimeActive = false // default to false if not provided
}) => {
  // Calculate if the rate is stale (more than 1 hour old)
  const isStale = useMemo(() => {
    return lastUpdated && new Date().getTime() - lastUpdated.getTime() > 3600000;
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
  const {
    showUpdateFlash
  } = useRateAnimation({
    rate,
    formattedTimestamp
  });
  const {
    nextRefreshIn
  } = useRefreshCountdown({
    lastUpdated
  });

  // Pick a random emoji when the rate updates
  const updateEmoji = useMemo(() => {
    return showUpdateFlash ? RATE_UPDATE_EMOJIS[Math.floor(Math.random() * RATE_UPDATE_EMOJIS.length)] : null;
  }, [showUpdateFlash]);
  return <div className="relative overflow-hidden mb-8">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjkuNSAzMC41aDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg2MCw2MCw2MCwwLjMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-10" />
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-indigo-500/10 via-blue-500/5 to-transparent blur-3xl" />
      </div>

      {/* Header content */}
      <div className="relative z-10 rounded-xl overflow-hidden border border-gray-800/50 shadow-2xl">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600/40 via-indigo-500/60 to-blue-600/40" />
        
        {/* Flash animation for updates */}
        {showUpdateFlash && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 animate-gradient-x pointer-events-none z-10" />}
        
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            {/* Left side with title and icon */}
            <div className="flex items-center gap-4">
              {/* Icon with animation */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-1000"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-2xl">
                  <div className="absolute inset-0.5 rounded-[14px] bg-gray-950 opacity-80"></div>
                  <div className="absolute inset-0 rounded-2xl animate-pulse-ring opacity-20"></div>
                  <Activity className="h-7 w-7 text-blue-400 relative z-10" />
                </div>
              </div>
              
              {/* Title and subtitle */}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-gray-200 bg-clip-text text-transparent">Oneremit Terminal</h1>
                  <Badge className="bg-indigo-900/30 text-indigo-200 border border-indigo-700/30 text-xs px-2 py-0 h-5">
                    LIVE
                  </Badge>
                </div>
                <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                  <span className="inline-block h-1 w-1 rounded-full bg-blue-500 animate-pulse"></span>
                  Real-time currency exchange dashboard
                </p>
              </div>
            </div>
            
            {/* Right side with rate display */}
            <div className="flex items-center gap-4 bg-gray-900/60 backdrop-blur-sm rounded-xl border border-gray-800/50 p-4 shadow-inner">
              <div className="flex-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider flex items-center gap-1.5 bg-gray-800/80 px-2 py-1 rounded-md">
                      <LineChart className="h-3 w-3 text-blue-400" />
                      <span>USDT/NGN</span>
                    </div>
                    
                    {isRealtimeActive && <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-900/20 px-2 py-0.5 rounded-full border border-green-800/30">
                        <Zap className="h-3 w-3" />
                        <span>Syncing</span>
                      </div>}
                  </div>
                  
                  <div className="mt-1.5 flex items-center gap-2">
                    <RateValue rate={rate} showUpdateFlash={showUpdateFlash} customClasses="text-3xl font-bold bg-gradient-to-r from-blue-100 to-white text-transparent bg-clip-text" />
                    {updateEmoji && <span className="text-xl animate-bounce" role="img" aria-label="Rate update emoji">
                        {updateEmoji}
                      </span>}
                  </div>
                  
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <TimestampDisplay lastUpdated={lastUpdated} rate={rate} isStale={isStale} />
                    <RefreshCountdown nextRefreshIn={nextRefreshIn} isRefreshing={isLoading || isRealtimeActive} />
                  </div>
                </div>
              </div>
              
              <RefreshButton onRefresh={onRefresh} isLoading={isLoading} variant="premium" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3">
        <StatusAlerts rate={rate} isStale={isStale} />
        <InfoNote />
      </div>
    </div>;
};
export default LiveRateDisplay;