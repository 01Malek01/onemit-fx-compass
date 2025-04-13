
import { useEffect, useRef } from 'react';
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
  // Use our state management hook
  const [
    { usdtNgnRate, fxRates, vertoFxRates, costPrices, previousCostPrices, lastUpdated, isLoading },
    { setUsdtNgnRate, setFxRates, setVertoFxRates, setCostPrices, setPreviousCostPrices, setLastUpdated, setIsLoading }
  ] = useRateState();

  // Track initialization attempts
  const initAttempts = useRef(0);
  const maxInitAttempts = 3;
  const initialized = useRef(false);

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

  // Debug log for tracking usdtNgnRate changes
  useEffect(() => {
    console.log("👀 useCurrencyData: usdtNgnRate value in state:", usdtNgnRate);
  }, [usdtNgnRate]);

  // Initialize data on mount with retry logic
  useEffect(() => {
    const initialize = async () => {
      console.log(`[useCurrencyData] Initialization attempt ${initAttempts.current + 1}/${maxInitAttempts}`);
      
      try {
        await loadAllData();
        initialized.current = true;
        console.log("[useCurrencyData] Initialization successful");
      } catch (error) {
        console.error(`[useCurrencyData] Initialization attempt ${initAttempts.current + 1} failed:`, error);
        
        initAttempts.current += 1;
        
        if (initAttempts.current < maxInitAttempts) {
          // Retry with exponential backoff
          const backoffDelay = Math.pow(2, initAttempts.current) * 1000;
          console.log(`[useCurrencyData] Retrying in ${backoffDelay}ms`);
          
          setTimeout(initialize, backoffDelay);
        } else {
          console.error(`[useCurrencyData] All ${maxInitAttempts} initialization attempts failed`);
          toast.error("Failed to initialize application data", {
            description: "Try refreshing the page"
          });
        }
      }
    };
    
    if (!initialized.current) {
      initialize();
    }
    
    return () => {
      // Clean up logic if needed
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
