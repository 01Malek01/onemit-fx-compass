import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { isVertoFxRateLimited, getTimeUntilNextAttempt } from '@/utils/rates/vertoRateLoader';

interface StatusAlertsProps {
  rate: number | null;
  isStale: boolean;
}

const StatusAlerts: React.FC<StatusAlertsProps> = ({ rate, isStale }) => {
  // Check for rate limiting
  const isRateLimited = isVertoFxRateLimited();
  const timeUntilNext = getTimeUntilNextAttempt();
  
  // Format the time until next allowed attempt
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `${minutes}m ${remainingSeconds}s`;
    }
  };
  
  // If rate limited, show that first as it's most important
  if (isRateLimited && timeUntilNext > 0) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>
          Market rate API is temporarily rate limited. Next update available in {formatTimeRemaining(timeUntilNext)}.
        </span>
      </div>
    );
  }
  
  // Next most important - missing rate
  if (!rate) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Unable to fetch current market rates. Using last known rates or default values.</span>
      </div>
    );
  }
  
  // Finally - stale rate
  if (isStale) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>These market rates haven't been updated recently. Consider refreshing to get the latest rates.</span>
      </div>
    );
  }
  
  return null;
};

export default StatusAlerts;
