
import { useEffect, useState } from 'react';

interface UseRefreshCountdownProps {
  lastUpdated: Date | null;
}

export const useRefreshCountdown = ({ lastUpdated }: UseRefreshCountdownProps) => {
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60);
  
  useEffect(() => {
    setNextRefreshIn(60);
    
    const timer = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) {
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastUpdated]);

  return { nextRefreshIn };
};
