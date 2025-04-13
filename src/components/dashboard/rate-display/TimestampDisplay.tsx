
import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface TimestampDisplayProps {
  lastUpdated: Date | null;
  rate: number | null;
  isStale: boolean;
}

const TimestampDisplay: React.FC<TimestampDisplayProps> = ({ lastUpdated, rate, isStale }) => {
  // Format the timestamp in the user's local timezone
  const formattedTimestamp = !lastUpdated ? 'never' : lastUpdated.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
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
  );
};

export default TimestampDisplay;
