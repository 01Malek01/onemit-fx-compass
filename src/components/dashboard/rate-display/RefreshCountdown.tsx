import React from 'react';
import { RefreshCw } from 'lucide-react';

interface RefreshCountdownProps {
  nextRefreshIn: number;
  isRefreshing?: boolean;
}

const RefreshCountdown: React.FC<RefreshCountdownProps> = ({
  nextRefreshIn,
  isRefreshing = false
}) => {
  return (
    <p className="text-xs text-primary/70 mt-1 flex items-center gap-1.5">
      <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span>
        {isRefreshing
          ? 'Refreshing...'
          : `Auto-refresh in ${nextRefreshIn}s`
        }
      </span>
    </p>
  );
};

export default RefreshCountdown;
