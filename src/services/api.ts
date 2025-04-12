
import { fetchExchangeRates } from './currency-rates-service';

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

// Fetch VertoFX rates - mock data for comparison purposes
export const fetchVertoFXRates = async (): Promise<VertoFXRates> => {
  // This is mock data for demonstration purposes
  return {
    USD: { buy: 1520, sell: 1500 },
    EUR: { buy: 1670, sell: 1650 },
    GBP: { buy: 1980, sell: 1955 },
    CAD: { buy: 1130, sell: 1110 }
  };
};
