
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RefreshButtonProps {
  onRefresh: () => Promise<boolean>;
  isLoading: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, isLoading }) => {
  const [hasError, setHasError] = React.useState(false);

  const handleClick = async () => {
    try {
      const result = await onRefresh();
      setHasError(!result);
    } catch (error) {
      console.error("Error during refresh:", error);
      setHasError(true);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleClick}
            disabled={isLoading}
            aria-label="Refresh rate data"
            className={`transition-all duration-200 ${hasError ? 'text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700' : ''}`}
            onAnimationEnd={() => setHasError(false)}
          >
            <RefreshCw 
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : hasError ? 'animate-shake' : ''}`} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p>{hasError ? 'Failed to refresh. Try again?' : 'Refresh rate data'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Add shake animation for error feedback
export default RefreshButton;
