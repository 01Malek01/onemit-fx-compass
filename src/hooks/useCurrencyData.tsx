
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
    console.log("Loading all data...");
    setIsLoading(true);
    
    try {
      // Fetch USDT/NGN rate from database
      const usdtRate = await fetchLatestUsdtNgnRate();
      console.log("Fetched USDT/NGN rate:", usdtRate);
      
      if (usdtRate) {
        setUsdtNgnRate(usdtRate);
      }
      
      // First try to get FX rates from database
      let rates = await fetchCurrencyRates();
      console.log("Fetched currency rates from DB:", rates);
      
      // If no rates in DB, fetch from API and save to database
      if (Object.keys(rates).length === 0) {
        console.log("No rates in DB, fetching from API...");
        rates = await fetchFxRates();
        console.log("Fetched FX rates from API:", rates);
        
        if (Object.keys(rates).length > 0) {
          const saved = await saveCurrencyRates(rates);
          console.log("Saved currency rates to DB:", saved);
        }
      }
      setFxRates(rates);
      
      // Fetch VertoFX rates (these are always from API as they're comparison only)
      const vertoRates = await fetchVertoFXRates();
      console.log("Fetched VertoFX rates:", vertoRates);
      setVertoFxRates(vertoRates);
      
      // Get margin settings from database
      const marginSettings = await fetchMarginSettings();
      console.log("Fetched margin settings:", marginSettings);
      
      if (marginSettings && usdtRate && Object.keys(rates).length > 0) {
        // Calculate cost prices using loaded margins
        calculateAllCostPrices(
          marginSettings.usd_margin, 
          marginSettings.other_currencies_margin
        );
        
        // Save rates to historical table for analytics
        const saved = await saveHistoricalRates(rates, usdtRate);
        console.log("Saved historical rates:", saved);
      } else {
        console.warn("Missing data for calculations:", { 
          hasMarginSettings: !!marginSettings, 
          usdtRate, 
          ratesCount: Object.keys(rates).length 
        });
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
    console.log("Updating USDT/NGN rate:", rate);
    
    if (!rate || rate <= 0) {
      toast.error("Please enter a valid rate");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save the new rate to database
      const success = await saveUsdtNgnRate(rate);
      console.log("USDT/NGN rate saved:", success);
      
      if (success) {
        setUsdtNgnRate(rate);
        setLastUpdated(new Date());
        
        // Fetch current FX rates if needed
        let currentRates = fxRates;
        if (Object.keys(currentRates).length === 0) {
          console.log("No FX rates loaded, fetching...");
          currentRates = await fetchFxRates();
          console.log("Fetched FX rates:", currentRates);
          setFxRates(currentRates);
          
          if (Object.keys(currentRates).length > 0) {
            await saveCurrencyRates(currentRates);
          }
        }
        
        // Get margin settings from database
        const marginSettings = await fetchMarginSettings();
        console.log("Fetched margin settings for recalculation:", marginSettings);
        
        if (marginSettings) {
          // Recalculate cost prices with the updated rate
          calculateAllCostPrices(
            marginSettings.usd_margin, 
            marginSettings.other_currencies_margin
          );
        }
        
        // Update historical rates
        if (Object.keys(currentRates).length > 0) {
          await saveHistoricalRates(currentRates, rate);
        }
      } else {
        console.error("Failed to save USDT/NGN rate");
        toast.error("Failed to update USDT/NGN rate");
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
    console.log("Calculating cost prices with margins:", { usdMargin, otherCurrenciesMargin });
    console.log("Using USDT/NGN rate:", usdtNgnRate);
    console.log("Using FX rates:", fxRates);
    
    if (!usdtNgnRate || usdtNgnRate <= 0) {
      console.warn("Invalid USDT/NGN rate for calculations:", usdtNgnRate);
      return;
    }
    
    if (Object.keys(fxRates).length === 0) {
      console.warn("No FX rates available for calculations");
      return;
    }
    
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
    console.log("USD cost price calculated:", { 
      base: usdCostPrice, 
      withMargin: newCostPrices.USD,
      margin: usdMargin
    });
    
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
      console.log(`${currency} cost price calculated:`, { 
        base: costPrice, 
        withMargin: newCostPrices[currency],
        fxRate: rate,
        margin: otherCurrenciesMargin
      });
    }
    
    console.log("All cost prices calculated:", newCostPrices);
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
