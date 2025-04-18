import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RefreshButtonProps {
  onRefresh: () => Promise<boolean>;
  isLoading: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, isLoading }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="gap-1.5 relative overflow-hidden"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Updating...' : 'Refresh'}
            <Users className="h-3 w-3 ml-1 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">Updates the rate for all connected users</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RefreshButton;
