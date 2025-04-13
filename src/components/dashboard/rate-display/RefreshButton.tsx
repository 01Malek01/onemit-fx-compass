import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RefreshButtonProps {
  onRefresh: () => Promise<boolean>;
  isLoading: boolean;
}

const RefreshButton: React.FC<RefreshButtonProps> = ({ onRefresh, isLoading }) => {
  const [hasError, setHasError] = useState(false);
  const [errorCount, setErrorCount] = useState(0);
  
  const handleAnimationEnd = () => {
    if (hasError) {
      setTimeout(() => setHasError(false), 500);
    }
  };

  const handleClick = async () => {
    if (isLoading) return;
    
    try {
      setHasError(false);
      const result = await onRefresh();
      
      if (!result) {
        setHasError(true);
        setErrorCount(prev => prev + 1);
      } else {
        setErrorCount(0);
      }
    } catch (error) {
      console.error("Error during refresh:", error);
      setHasError(true);
      setErrorCount(prev => prev + 1);
    }
  };
  
  const isNetworkIssue = errorCount >= 2;
  const ButtonIcon = isNetworkIssue ? WifiOff : RefreshCw;
  const buttonAnimation = isLoading ? 'animate-spin' : 
                          hasError ? 'animate-shake' : '';

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
            className={`transition-all duration-200 ${
              hasError ? 'text-red-500 hover:text-red-600 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700' : ''
            }`}
            onAnimationEnd={handleAnimationEnd}
          >
            <ButtonIcon 
              className={`h-4 w-4 ${buttonAnimation}`} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          <p>
            {isLoading ? 'Refreshing...' : 
             isNetworkIssue ? 'Network issues detected. Try again?' :
             hasError ? 'Failed to refresh. Try again?' : 
             'Refresh rate data'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RefreshButton;
