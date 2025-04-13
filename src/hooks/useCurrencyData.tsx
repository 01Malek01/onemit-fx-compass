
import { useEffect, useRef, useState } from 'react';
import { useRateState } from './useRateState';
import { useCostPriceCalculator } from './useCostPriceCalculator';
import { useRateDataLoader } from './useRateDataLoader';
import { toast } from "sonner";

export interface CurrencyDataState {
  usdtNgnRate: number | null;
  fxRates: Record<string, number>;
  vertoFxRates: Record<string, { buy: number; sell: number }>;
  costPrices: Record<string, number>;
  previousCostPrices: Record<string, number>;
  lastUpdated: Date | null;
  isLoading: boolean;
}

export interface CurrencyDataActions {
  loadAllData: () => Promise<void>;
  updateUsdtRate: (rate: number) => Promise<boolean>;
  refreshBybitRate: () => Promise<boolean>;
  setUsdtNgnRate: (rate: number) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
}

const useCurrencyData = (): [CurrencyDataState, CurrencyDataActions] => {
  // Minimal initialization state to improve first render time
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Use our state management hook
  const [
    { usdtNgnRate, fxRates, vertoFxRates, costPrices, previousCostPrices, lastUpdated, isLoading },
    { setUsdtNgnRate, setFxRates, setVertoFxRates, setCostPrices, setPreviousCostPrices, setLastUpdated, setIsLoading }
  ] = useRateState();

  // Track initialization attempts
  const initAttempts = useRef(0);
  const maxInitAttempts = 2; // Reduced from 3 to 2 to speed up initialization
  const initialized = useRef(false);
  const initTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use cost price calculator hook
  const { calculateAllCostPrices } = useCostPriceCalculator({
    usdtNgnRate,
    fxRates,
    setCostPrices,
    setPreviousCostPrices,
    costPrices
  });

  // Use data loading hook
  const { loadAllData, updateUsdtRate, refreshBybitRate } = useRateDataLoader({
    setUsdtNgnRate,
    setFxRates,
    setVertoFxRates,
    setLastUpdated,
    setIsLoading,
    calculateAllCostPrices,
    fxRates,
    usdtNgnRate
  });

  // Initialize data on mount with optimized retry logic
  useEffect(() => {
    const initialize = async () => {
      console.log(`[useCurrencyData] Initialization attempt ${initAttempts.current + 1}/${maxInitAttempts}`);
      
      try {
        await loadAllData();
        initialized.current = true;
        setHasInitialized(true);
        console.log("[useCurrencyData] Initialization successful");
        
        // Clear any existing timer
        if (initTimer.current) {
          clearTimeout(initTimer.current);
          initTimer.current = null;
        }
      } catch (error) {
        console.error(`[useCurrencyData] Initialization attempt ${initAttempts.current + 1} failed:`, error);
        
        initAttempts.current += 1;
        
        if (initAttempts.current < maxInitAttempts) {
          // Retry with shorter backoff (500ms instead of exponential)
          // This helps get data faster even with errors
          const backoffDelay = 500; 
          console.log(`[useCurrencyData] Retrying in ${backoffDelay}ms`);
          
          initTimer.current = setTimeout(initialize, backoffDelay);
        } else {
          console.error(`[useCurrencyData] All ${maxInitAttempts} initialization attempts failed`);
          setHasInitialized(true); // Mark as initialized even with failure to show UI
          toast.error("Failed to initialize all data", {
            description: "Some features may be limited"
          });
        }
      }
    };
    
    if (!initialized.current) {
      initialize();
    }
    
    return () => {
      // Clean up timers
      if (initTimer.current) {
        clearTimeout(initTimer.current);
      }
    };
  }, []);

  return [
    { 
      usdtNgnRate, 
      fxRates, 
      vertoFxRates, 
      costPrices, 
      previousCostPrices, 
      lastUpdated, 
      isLoading 
    },
    { 
      loadAllData, 
      updateUsdtRate, 
      refreshBybitRate,
      setUsdtNgnRate, 
      calculateAllCostPrices 
    }
  ];
};

export default useCurrencyData;
