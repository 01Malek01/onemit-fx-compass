
import React from 'react';
import { AlertTriangle, AlertCircle, WifiOff, Clock, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StatusAlertsProps {
  rate: number | null;
  isStale: boolean;
  onRetryClick?: () => Promise<boolean>;
  networkError?: boolean;
}

const StatusAlerts: React.FC<StatusAlertsProps> = ({ 
  rate, 
  isStale, 
  onRetryClick,
  networkError = false 
}) => {
  // Handle network connectivity issues
  if (networkError) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 rounded-md flex items-center gap-1.5">
        <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
        <div className="flex-grow">
          <span className="font-medium">Network connectivity issue</span>
          <p className="mt-0.5">Unable to connect to Bybit. Using last saved rate instead.</p>
        </div>
        {onRetryClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetryClick} 
            className="h-6 text-xs py-0 px-2 ml-auto"
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Missing rate alert
  if (!rate || rate <= 0) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 rounded-md flex items-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <div>
          <span className="font-medium">Rate unavailable</span>
          <p className="mt-0.5">Using last known rate or default value. Try refreshing later.</p>
        </div>
        {onRetryClick && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRetryClick} 
            className="h-6 text-xs py-0 px-2 ml-auto"
          >
            <RefreshCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }
  
  // Stale rate alert
  if (isStale) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 flex-shrink-0" />
        <div>
          <span className="font-medium">Rate may be outdated</span>
          <p className="mt-0.5">This rate hasn't been updated recently. Consider refreshing to get the latest rate.</p>
        </div>
      </div>
    );
  }
  
  return null;
};

export default StatusAlerts;
