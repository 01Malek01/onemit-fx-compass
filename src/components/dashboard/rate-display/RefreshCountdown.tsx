import React from 'react';
import { RefreshCw, Wifi } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RefreshCountdownProps {
  nextRefreshIn: number;
  isRefreshing?: boolean;
}

const RefreshCountdown: React.FC<RefreshCountdownProps> = ({
  nextRefreshIn,
  isRefreshing = false
}) => {
  return (
    <div className="flex items-center gap-2 mt-1">
      <p className="text-xs text-primary/70 flex items-center gap-1.5">
        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span>
          {isRefreshing
            ? 'Refreshing...'
            : `Auto-refresh in ${nextRefreshIn}s`
          }
        </span>
      </p>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <Wifi className="h-3 w-3 text-green-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">Real-time sync active with all users</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default RefreshCountdown;
