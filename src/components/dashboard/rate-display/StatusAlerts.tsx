
import React from 'react';
import { AlertTriangle, AlertCircle, WifiOff, Clock } from 'lucide-react';

interface StatusAlertsProps {
  rate: number | null;
  isStale: boolean;
}

const StatusAlerts: React.FC<StatusAlertsProps> = ({ rate, isStale }) => {
  if (!rate || rate <= 0) {
    return (
      <div className="mt-2 text-xs py-1.5 px-2 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 rounded-md flex items-center gap-1.5">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <div>
          <span className="font-medium">Rate unavailable</span>
          <p className="mt-0.5">Using last known rate or default value. Try refreshing later.</p>
        </div>
      </div>
    );
  }
  
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
