
import { useState, useEffect } from 'react';
import { toast } from "sonner";

import { 
  fetchUsdtNgnRate, 
  fetchFxRates, 
  fetchVertoFXRates,
  updateUsdtNgnRate,
  CurrencyRates,
  VertoFXRates 
} from '@/services/api';
import { 
  calculateCostPrice, 
  applyMargin 
} from '@/utils/currencyUtils';

export interface CurrencyDataState {
  usdtNgnRate: number;
  fxRates: CurrencyRates;
  vertoFxRates: VertoFXRates;
  costPrices: CurrencyRates;
  previousCostPrices: CurrencyRates;
  lastUpdated: Date | null;
  isLoading: boolean;
}

export interface CurrencyDataActions {
  loadAllData: () => Promise<void>;
  updateUsdtRate: (rate: number) => Promise<void>;
  setUsdtNgnRate: (rate: number) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
}

const useCurrencyData = (): [CurrencyDataState, CurrencyDataActions] => {
  // State variables
  const [usdtNgnRate, setUsdtNgnRate] = useState<number>(0);
  const [fxRates, setFxRates] = useState<CurrencyRates>({});
  const [vertoFxRates, setVertoFxRates] = useState<VertoFXRates>({});
  const [costPrices, setCostPrices] = useState<CurrencyRates>({});
  const [previousCostPrices, setPreviousCostPrices] = useState<CurrencyRates>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Updated fee constants with correct values
  const USDT_TO_USD_FEE = 0.0015; // 0.15% as decimal
  const USD_TO_TARGET_FEE = 0.005; // 0.5% as decimal
  
  // Load all data from APIs
  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch USDT/NGN rate
      const usdtRate = await fetchUsdtNgnRate();
      setUsdtNgnRate(usdtRate);
      
      // Fetch FX rates
      const rates = await fetchFxRates();
      setFxRates(rates);
      
      // Fetch VertoFX rates
      const vertoRates = await fetchVertoFXRates();
      setVertoFxRates(vertoRates);
      
      setLastUpdated(new Date());
      toast.success("All rates updated successfully");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load some data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle USDT/NGN rate update
  const updateUsdtRate = async (rate: number) => {
    setIsLoading(true);
    
    try {
      const success = await updateUsdtNgnRate(rate);
      if (success) {
        setLastUpdated(new Date());
        toast.success("USDT/NGN rate updated successfully");
      }
    } catch (error) {
      console.error("Error updating USDT/NGN rate:", error);
      toast.error("Failed to update USDT/NGN rate");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate all cost prices
  const calculateAllCostPrices = (usdMargin: number, otherCurrenciesMargin: number) => {
    if (!usdtNgnRate) return;
    
    // Store previous cost prices for comparison
    setPreviousCostPrices({ ...costPrices });
    
    const newCostPrices: CurrencyRates = {};
    
    // Calculate USD cost price with corrected formula
    const usdCostPrice = calculateCostPrice(
      usdtNgnRate,
      USDT_TO_USD_FEE,
      1, // USD/USD is 1
      USD_TO_TARGET_FEE
    );
    
    // Apply margin to USD
    newCostPrices.USD = applyMargin(usdCostPrice, usdMargin);
    
    // Calculate other currencies
    for (const [currency, rate] of Object.entries(fxRates)) {
      if (currency === "USD") continue;
      
      const costPrice = calculateCostPrice(
        usdtNgnRate,
        USDT_TO_USD_FEE,
        rate,
        USD_TO_TARGET_FEE
      );
      
      // Apply margin to other currencies
      newCostPrices[currency] = applyMargin(costPrice, otherCurrenciesMargin);
    }
    
    setCostPrices(newCostPrices);
  };

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
      setUsdtNgnRate, 
      calculateAllCostPrices 
    }
  ];
};

export default useCurrencyData;
