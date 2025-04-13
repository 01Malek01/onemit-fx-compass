
import { fetchExchangeRates } from './currency-rates-service';
import { getAllNgnRates, VertoFxRate } from './vertofx';
import { saveVertoFxHistoricalRates } from './vertofx-historical-service';

// Type for currency rates
export type CurrencyRates = Record<string, number>;

// Type for VertoFX rates
export type VertoFXRates = Record<string, { buy: number; sell: number }>;

// Global variable to store current cost prices for the API endpoint
let currentCostPrices: CurrencyRates = {};

// Update current cost prices (called by the cost price calculator)
export const updateCurrentCostPrices = (costPrices: CurrencyRates) => {
  currentCostPrices = { ...costPrices };
};

// Get current cost prices (used by the API endpoint)
export const getCurrentCostPrices = (): CurrencyRates => {
  return { ...currentCostPrices };
};

// Fetch FX rates from currency-rates-service
export const fetchFxRates = async (): Promise<CurrencyRates> => {
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
  return await fetchExchangeRates(supportedCurrencies);
};

// Fetch VertoFX rates - now using the real API
export const fetchVertoFXRates = async (): Promise<VertoFXRates> => {
  try {
    console.log("Fetching live VertoFX rates...");
    
    const vertoRates = await getAllNgnRates();
    console.log("Live VertoFX rates loaded:", vertoRates);
    
    // Convert the API response format to our app's expected format
    const formattedRates: VertoFXRates = {
      USD: { buy: 0, sell: 0 },
      EUR: { buy: 0, sell: 0 },
      GBP: { buy: 0, sell: 0 },
      CAD: { buy: 0, sell: 0 }
    };
    
    // Process NGN-XXX rates (buy rates from our perspective)
    // This is when our customers buy foreign currency using NGN
    for (const currency of ['USD', 'EUR', 'GBP', 'CAD']) {
      const ngnToForeignKey = `NGN-${currency}`;
      if (vertoRates[ngnToForeignKey]) {
        formattedRates[currency].buy = 1 / vertoRates[ngnToForeignKey].rate;
      }
      
      // Process XXX-NGN rates (sell rates from our perspective)
      // This is when our customers sell foreign currency to get NGN
      const foreignToNgnKey = `${currency}-NGN`;
      if (vertoRates[foreignToNgnKey]) {
        formattedRates[currency].sell = vertoRates[foreignToNgnKey].rate;
      }
    }
    
    // Save historical VertoFX rates to database
    try {
      await saveVertoFxHistoricalRates(vertoRates);
    } catch (error) {
      console.error("Error saving historical VertoFX rates:", error);
      // Continue execution even if saving fails
    }
    
    return formattedRates;
  } catch (error) {
    console.error("Error fetching VertoFX rates:", error);
    // Return fallback rates with placeholder values
    return {
      USD: { buy: 0, sell: 0 },
      EUR: { buy: 0, sell: 0 },
      GBP: { buy: 0, sell: 0 },
      CAD: { buy: 0, sell: 0 }
    };
  }
};
