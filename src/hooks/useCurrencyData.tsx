import { useEffect, useRef, useCallback } from 'react';
import { useRateState } from './useRateState';
import { useCostPriceCalculator } from './useCostPriceCalculator';
import { useRateDataLoader } from './useRateDataLoader';
import { VertoFXRates } from '@/services/api';

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

  // Wrap setVertoFxRates to ensure required properties
  const setVertoFxRates = useCallback((rates: VertoFXRates | Record<string, { buy: number; sell: number }>) => {
    // Ensure the rates object has the required properties
    const safeRates: VertoFXRates = {
      USD: rates?.USD || { buy: 0, sell: 0 },
      EUR: rates?.EUR || { buy: 0, sell: 0 },
      GBP: rates?.GBP || { buy: 0, sell: 0 },
      CAD: rates?.CAD || { buy: 0, sell: 0 },
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

  // Use data loading hook with our wrapped setVertoFxRates
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
        initialized.current = true;
        await loadAllData();
      } catch (error) {
        console.error("[useCurrencyData] Initialization failed:", error);
      }
    };

    initialize();
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
