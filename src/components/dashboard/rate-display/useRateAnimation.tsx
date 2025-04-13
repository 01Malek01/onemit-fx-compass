
import { useEffect, useRef, useState } from 'react';

interface UseRateAnimationProps {
  rate: number | null;
  formattedTimestamp: string;
}

export const useRateAnimation = ({ rate, formattedTimestamp }: UseRateAnimationProps) => {
  const lastTimestampRef = useRef<string | null>(null);
  const lastRateRef = useRef<number | null>(null);
  const [showUpdateFlash, setShowUpdateFlash] = useState(false);
  
  useEffect(() => {
    if (!formattedTimestamp || formattedTimestamp === 'never') return;
    
    const isTimestampChanged = lastTimestampRef.current && lastTimestampRef.current !== formattedTimestamp;
    const isRateChanged = lastRateRef.current !== null && lastRateRef.current !== rate;
    
    if (isTimestampChanged || isRateChanged) {
      console.log("LiveRateDisplay: Rate or timestamp changed, triggering animation");
      setShowUpdateFlash(true);
      
      const timer = setTimeout(() => {
        setShowUpdateFlash(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    lastTimestampRef.current = formattedTimestamp;
    lastRateRef.current = rate;
  }, [formattedTimestamp, rate]);

  return { showUpdateFlash };
};
