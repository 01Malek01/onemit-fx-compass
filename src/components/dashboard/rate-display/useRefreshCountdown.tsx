
import { useEffect, useState } from 'react';

interface UseRefreshCountdownProps {
  lastUpdated: Date | null;
}

export const useRefreshCountdown = ({ lastUpdated }: UseRefreshCountdownProps) => {
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(600); // Initialize with 600 seconds
  
  useEffect(() => {
    setNextRefreshIn(600); // Reset to 600 seconds when lastUpdated changes
    
    const timer = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          return 600; // Reset to 600 seconds
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastUpdated]);

  return { nextRefreshIn };
};
