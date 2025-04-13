
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface StatusAlertsProps {
  rate: number | null;
  isStale: boolean;
}

const StatusAlerts: React.FC<StatusAlertsProps> = ({ rate, isStale }) => {
  if (!rate) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Unable to fetch current rate from Bybit. Using last known rate or default value.</span>
      </div>
    );
  }
  
  if (isStale) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>This rate hasn't been updated recently. Consider refreshing to get the latest rate.</span>
      </div>
    );
  }
  
  return null;
};

export default StatusAlerts;
