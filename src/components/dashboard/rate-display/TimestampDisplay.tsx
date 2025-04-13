
import React from 'react';
import { Clock, AlertTriangle, WifiOff } from 'lucide-react';

interface TimestampDisplayProps {
  lastUpdated: Date | null;
  rate: number | null;
  isStale: boolean;
  hasNetworkError?: boolean;
}

const TimestampDisplay: React.FC<TimestampDisplayProps> = ({ 
  lastUpdated, 
  rate, 
  isStale,
  hasNetworkError = false
}) => {
  // Format the timestamp in the user's local timezone
  const formattedTimestamp = !lastUpdated ? 'never' : lastUpdated.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
      <Clock className="h-3 w-3" />
      Last updated: {formattedTimestamp}
      
      {hasNetworkError && 
        <span className="inline-flex items-center gap-0.5 text-red-400">
          <WifiOff className="h-3 w-3" />
          <span>(Network error)</span>
        </span>
      }
      {!hasNetworkError && !rate && lastUpdated && 
        <span className="inline-flex items-center gap-0.5 text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          <span>(Using fallback)</span>
        </span>
      }
      {!hasNetworkError && isStale && rate && 
        <span className="inline-flex items-center gap-0.5 text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          <span>(Rate may be outdated)</span>
        </span>
      }
    </p>
  );
};

export default TimestampDisplay;
