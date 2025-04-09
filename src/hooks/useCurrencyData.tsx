
import { useState, useEffect } from 'react';
import { toast } from "sonner";

import { 
  fetchFxRates, 
  fetchVertoFXRates,
  CurrencyRates,
  VertoFXRates 
} from '@/services/api';
import { 
  calculateCostPrice, 
  applyMargin 
} from '@/utils/currencyUtils';
import { 
  fetchLatestUsdtNgnRate, 
  saveUsdtNgnRate 
} from '@/services/usdt-ngn-service';
import { 
  fetchMarginSettings, 
  updateMarginSettings 
} from '@/services/margin-settings-service';
import { 
  fetchCurrencyRates, 
  saveCurrencyRates 
} from '@/services/currency-rates-service';
import { 
  saveHistoricalRates 
} from '@/services/historical-rates-service';

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
  
  // Load all data from APIs and database
  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch USDT/NGN rate from database
      const usdtRate = await fetchLatestUsdtNgnRate();
      if (usdtRate) {
        setUsdtNgnRate(usdtRate);
      }
      
      // First try to get FX rates from database
      let rates = await fetchCurrencyRates();
      
      // If no rates in DB, fetch from API and save to database
      if (Object.keys(rates).length === 0) {
        rates = await fetchFxRates();
        if (Object.keys(rates).length > 0) {
          await saveCurrencyRates(rates);
        }
      }
      setFxRates(rates);
      
      // Fetch VertoFX rates (these are always from API as they're comparison only)
      const vertoRates = await fetchVertoFXRates();
      setVertoFxRates(vertoRates);
      
      // Get margin settings from database
      const marginSettings = await fetchMarginSettings();
      if (marginSettings && usdtRate) {
        // Calculate cost prices using loaded margins
        calculateAllCostPrices(marginSettings.usd_margin, marginSettings.other_currencies_margin);
        
        // Save rates to historical table for analytics
        await saveHistoricalRates(rates, usdtRate);
      }
      
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
    if (!rate || rate <= 0) {
      toast.error("Please enter a valid rate");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save the new rate to database
      const success = await saveUsdtNgnRate(rate);
      if (success) {
        setUsdtNgnRate(rate);
        setLastUpdated(new Date());
        toast.success("USDT/NGN rate updated successfully");
        
        // Fetch current FX rates if needed
        if (Object.keys(fxRates).length === 0) {
          const rates = await fetchFxRates();
          setFxRates(rates);
          await saveCurrencyRates(rates);
        }
        
        // Get margin settings from database
        const marginSettings = await fetchMarginSettings();
        if (marginSettings) {
          // Recalculate cost prices with the updated rate
          calculateAllCostPrices(marginSettings.usd_margin, marginSettings.other_currencies_margin);
        }
        
        // Update historical rates
        await saveHistoricalRates(fxRates, rate);
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
    if (!usdtNgnRate || usdtNgnRate <= 0) return;
    
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
      setUsdtNgnRate, 
      calculateAllCostPrices 
    }
  ];
};

export default useCurrencyData;
