import { useEffect, useRef, useState, useCallback } from 'react';
import { useRateState } from './useRateState';
import { useCostPriceCalculator } from './useCostPriceCalculator';
import { useRateDataLoader } from './useRateDataLoader';
import { fetchFxRates, CurrencyRates, VertoFXRates, updateCurrentCostPrices, DEFAULT_VERTOFX_RATES } from '@/services/api';
import { loadBybitRate } from '@/utils/rates/bybitRateLoader';
import { loadVertoFxRates } from '@/utils/rates/vertoRateLoader';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currencyUtils';
import { logger } from '@/utils/logUtils';

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
  }, []);

  // Ensure vertoFxRates always has required properties 
  const setVertoFxRates = useCallback((rates: VertoFXRates | Record<string, { buy: number; sell: number }>) => {
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

  // Load all data
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch Bybit price in parallel with FX rates
      const [bybitRate, fxRatesData, vertoRates] = await Promise.all([
        loadBybitRate(),
        fetchFxRates(),
        loadVertoFxRates()
      ]);
      
      if (bybitRate !== null) {
        setUsdtNgnRate(bybitRate);
      }
      
      if (fxRatesData && Object.keys(fxRatesData).length > 0) {
        setFxRates(fxRatesData);
      }
      
      // Set VertoFX rates safely
      setVertoFxRates(vertoRates); 
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading currency data:", error);
      toast.error("Unable to load some currency data");
    } finally {
      setIsLoading(false);
    }
  }, [setVertoFxRates]);

  // Calculate all cost prices 
  const calculateAllCostPrices = useCallback((usdMargin: number, otherCurrenciesMargin: number) => {
    if (!usdtNgnRate || usdtNgnRate <= 0 || Object.keys(fxRates).length === 0) {
      // Can't calculate if we don't have rates
      return;
    }
    
    try {
      // Save previous prices to detect changes
      setPreviousCostPrices({...costPrices});
      
      // Calculate new cost prices
      const newCostPrices: CurrencyRates = {
        USD: calculateCostPrice('USD', usdtNgnRate, 1, usdMargin)
      };
      
      // Calculate for other currencies
      for (const currency of ['EUR', 'GBP', 'CAD']) {
        if (fxRates[currency]) {
          newCostPrices[currency] = calculateCostPrice(
            currency, 
            usdtNgnRate, 
            fxRates[currency], 
            otherCurrenciesMargin
          );
        }
      }
      
      // Update cost prices and also update for the API
      setCostPrices(newCostPrices);
      updateCurrentCostPrices(newCostPrices);
      
      // Log the new cost prices
      logger.info("Cost prices calculated:", newCostPrices);
    } catch (error) {
      logger.error("Error calculating cost prices:", error);
    }
  }, [usdtNgnRate, fxRates, costPrices]);

  // Helper function to calculate cost price for a specific currency
  const calculateCostPrice = (currency: string, usdtNgnRate: number, fxRate: number, margin: number): number => {
    const baseRate = usdtNgnRate / fxRate;
    const marginMultiplier = 1 + (margin / 100);
    return baseRate * marginMultiplier;
  };

  // Refresh Bybit rate only
  const refreshBybitRate = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const rate = await loadBybitRate(true); // force refresh
      if (rate !== null) {
        setUsdtNgnRate(rate);
        setLastUpdated(new Date());
        return true;
      }
      return false;
    } catch (error) {
      logger.error("Error refreshing Bybit rate:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
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
      calculateAllCostPrices,
      setVertoFxRates
    }
  ];
};

export default useCurrencyData;
