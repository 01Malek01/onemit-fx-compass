
import React from 'react';
import { Clock, AlertOctagon } from 'lucide-react';
import { isVertoFxRateLimited } from '@/utils/rates/vertoRateLoader';

interface RefreshCountdownProps {
  nextRefreshIn: number;
  isRefreshing: boolean;
}

const RefreshCountdown: React.FC<RefreshCountdownProps> = ({ 
  nextRefreshIn,
  isRefreshing
}) => {
  // Check if we're rate limited
  const isRateLimited = isVertoFxRateLimited();
  
  // Enhanced format countdown for minutes and seconds
  const formatCountdown = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${String(remainingSeconds).padStart(2, '0')}s`;
    }
  };
  
  // Different countdown message based on state
  const getCountdownMessage = () => {
    if (isRefreshing) {
      return 'Refreshing...';
    }
    
    if (isRateLimited) {
      return `Rate limited · ${formatCountdown(nextRefreshIn)}`;
    }
    
    return `Refreshes in ${formatCountdown(nextRefreshIn)}`;
  };
  
  return (
    <div className="text-xs flex items-center text-muted-foreground mt-1.5">
      {isRateLimited ? (
        <AlertOctagon className="h-3 w-3 mr-1.5 text-amber-400" />
      ) : (
        <Clock className="h-3 w-3 mr-1.5" />
      )}
      <span>{getCountdownMessage()}</span>
    </div>
  );
};

export default RefreshCountdown;
