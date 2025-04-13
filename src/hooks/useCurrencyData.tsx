
import { useEffect } from 'react';
import { useRateState } from './useRateState';
import { useCostPriceCalculator } from './useCostPriceCalculator';
import { useRateDataLoader } from './useRateDataLoader';

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
  refreshBybitRate: () => Promise<boolean>; // New function
  setUsdtNgnRate: (rate: number) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
}

const useCurrencyData = (): [CurrencyDataState, CurrencyDataActions] => {
  // Use our state management hook
  const [
    { usdtNgnRate, fxRates, vertoFxRates, costPrices, previousCostPrices, lastUpdated, isLoading },
    { setUsdtNgnRate, setFxRates, setVertoFxRates, setCostPrices, setPreviousCostPrices, setLastUpdated, setIsLoading }
  ] = useRateState();

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

  // Initialize data on mount
  useEffect(() => {
    loadAllData();
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
      refreshBybitRate, // Add the new function
      setUsdtNgnRate, 
      calculateAllCostPrices 
    }
  ];
};

export default useCurrencyData;
