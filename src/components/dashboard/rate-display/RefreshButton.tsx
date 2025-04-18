import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  onRefresh: () => Promise<boolean>;
  isLoading: boolean;
  variant?: 'default' | 'premium';
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ 
  onRefresh, 
  isLoading,
  variant = 'default'
}) => {
  const isPremium = variant === 'premium';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className={cn(
              "gap-1.5 relative overflow-hidden",
              isPremium && "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 hover:border-blue-600/50 shadow-lg"
            )}
          >
            <RefreshCw className={cn(
              "h-4 w-4",
              isLoading ? "animate-spin" : "",
              isPremium && "text-blue-400"
            )} />
            <span>{isLoading ? 'Updating...' : 'Refresh'}</span>
            {!isPremium && <Users className="h-3 w-3 ml-1 text-muted-foreground" />}
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
