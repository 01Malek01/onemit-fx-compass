
import { useEffect, useRef, useCallback } from 'react';
import { useRateState } from './useRateState';
import { useCostPriceCalculator } from './useCostPriceCalculator';
import { useRateDataLoader } from './useRateDataLoader';
import { VertoFXRates as ApiVertoFXRates } from '@/services/api';

// Use the specific type from API instead of the one from vertofx
export interface CurrencyDataState {
  usdtNgnRate: number | null;
  fxRates: Record<string, number>;
  vertoFxRates: ApiVertoFXRates;
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
  setVertoFxRates: (rates: ApiVertoFXRates) => void;
}

const DEFAULT_VERTOFX_RATES: ApiVertoFXRates = {
  USD: { buy: 0, sell: 0 },
  EUR: { buy: 0, sell: 0 },
  GBP: { buy: 0, sell: 0 },
  CAD: { buy: 0, sell: 0 },
};

const useCurrencyData = (): [CurrencyDataState, CurrencyDataActions] => {
  const initialized = useRef(false);
  
  const [
    { usdtNgnRate, fxRates, vertoFxRates, costPrices, previousCostPrices, lastUpdated, isLoading },
    { setUsdtNgnRate, setFxRates, setVertoFxRates: originalSetVertoFxRates, setCostPrices, setPreviousCostPrices, setLastUpdated, setIsLoading }
  ] = useRateState();

  const setVertoFxRates = useCallback((rates: ApiVertoFXRates) => {
    const safeRates: ApiVertoFXRates = {
      USD: rates?.USD || DEFAULT_VERTOFX_RATES.USD,
      EUR: rates?.EUR || DEFAULT_VERTOFX_RATES.EUR,
      GBP: rates?.GBP || DEFAULT_VERTOFX_RATES.GBP,
      CAD: rates?.CAD || DEFAULT_VERTOFX_RATES.CAD,
      ...rates
    };
    originalSetVertoFxRates(safeRates);
  }, [originalSetVertoFxRates]);

  const { calculateAllCostPrices } = useCostPriceCalculator({
    usdtNgnRate,
    fxRates,
    setCostPrices,
    setPreviousCostPrices,
    costPrices
  });

  const { loadAllData, updateUsdtRate: originalUpdateUsdtRate, refreshBybitRate } = useRateDataLoader({
    setUsdtNgnRate,
    setFxRates,
    setVertoFxRates,
    setLastUpdated,
    setIsLoading,
    calculateAllCostPrices,
    fxRates,
    usdtNgnRate
  });

  // Fix the return type to match the expected boolean
  const updateUsdtRate = useCallback(async (rate: number): Promise<boolean> => {
    const result = await originalUpdateUsdtRate(rate);
    // Convert the number result to a boolean
    return !!result;
  }, [originalUpdateUsdtRate]);

  useEffect(() => {
    if (initialized.current) return;
    
    const initialize = async () => {
      try {
        console.log("[useCurrencyData] Initializing data");
        initialized.current = true;
        await loadAllData();
      } catch (error) {
        console.error("[useCurrencyData] Initialization failed:", error);
      }
    };
    
    initialize();
    
    return () => {
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
