
import { useEffect, useRef, useCallback } from 'react';
import { useRateState } from './useRateState';
import { useCostPriceCalculator } from './useCostPriceCalculator';
import { useRateDataLoader } from './useRateDataLoader';
import { VertoFXRates, DEFAULT_VERTOFX_RATES } from '@/services/api';

export interface CurrencyDataState {
  usdtNgnRate: number | null;
  fxRates: Record<string, number>;
  vertoFxRates: VertoFXRates;
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
  setVertoFxRates: (rates: VertoFXRates) => void;
}

const useCurrencyData = (): [CurrencyDataState, CurrencyDataActions] => {
  // Use a single initialization flag for better performance
  const initialized = useRef(false);
  
  // Use our state management hook with default initial values
  const [
    { usdtNgnRate, fxRates, vertoFxRates, costPrices, previousCostPrices, lastUpdated, isLoading },
    { setUsdtNgnRate, setFxRates, setVertoFxRates: originalSetVertoFxRates, setCostPrices, setPreviousCostPrices, setLastUpdated, setIsLoading }
  ] = useRateState();

  // Ensure vertoFxRates always has required properties 
  const setVertoFxRates = useCallback((rates: VertoFXRates) => {
    // Ensure the rates object has the required properties
    const safeRates: VertoFXRates = {
      USD: rates?.USD || DEFAULT_VERTOFX_RATES.USD,
      EUR: rates?.EUR || DEFAULT_VERTOFX_RATES.EUR,
      GBP: rates?.GBP || DEFAULT_VERTOFX_RATES.GBP,
      CAD: rates?.CAD || DEFAULT_VERTOFX_RATES.CAD,
      ...rates
    };
    originalSetVertoFxRates(safeRates);
  }, [originalSetVertoFxRates]);

  // Use cost price calculator hook
  const { calculateAllCostPrices } = useCostPriceCalculator({
    usdtNgnRate,
    fxRates,
    setCostPrices,
    setPreviousCostPrices,
    costPrices
  });

  // Use data loading hook - modified to use our wrapped setVertoFxRates
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

  // Initialize data on mount with optimized single attempt
  useEffect(() => {
    if (initialized.current) return;
    
    const initialize = async () => {
      try {
        console.log("[useCurrencyData] Initializing data");
        initialized.current = true; // Set flag immediately to prevent double initialization
        await loadAllData();
      } catch (error) {
        console.error("[useCurrencyData] Initialization failed:", error);
      }
    };
    
    // Start initialization without waiting
    initialize();
    
    return () => {
      // No cleanup needed
    };
  }, [loadAllData]);

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
      calculateAllCostPrices,
      setVertoFxRates
    }
  ];
};

export default useCurrencyData;
