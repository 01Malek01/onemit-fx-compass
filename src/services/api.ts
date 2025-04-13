
import { fetchExchangeRates } from './currency-rates-service';
import { getAllNgnRates, VertoFxRate } from './vertofx';
import { saveVertoFxHistoricalRates } from './vertofx-historical-service';
import { toast } from "sonner";

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

// Default VertoFX rates to use as fallback
const DEFAULT_VERTOFX_RATES: VertoFXRates = {
  USD: { buy: 1635, sell: 1600 },
  EUR: { buy: 1870, sell: 1805 },
  GBP: { buy: 2150, sell: 2080 },
  CAD: { buy: 1190, sell: 1140 }
};

// In-memory cache for VertoFX rates to use if API calls fail
let cachedVertoFxRates: VertoFXRates = { ...DEFAULT_VERTOFX_RATES };

// Fetch VertoFX rates - now with improved error handling and fallbacks
export const fetchVertoFXRates = async (): Promise<VertoFXRates> => {
  try {
    console.log("[API] Fetching live VertoFX rates...");
    
    // Create a promise with a timeout for the VertoFX API call
    const vertoRatesPromise = getAllNgnRates();
    
    // Add a 10 second timeout to the API call
    const timeoutPromise = new Promise<Record<string, VertoFxRate>>((_resolve, reject) => {
      setTimeout(() => reject(new Error("VertoFX API request timed out")), 10000);
    });
    
    // Race between the API call and the timeout
    const vertoRates = await Promise.race([vertoRatesPromise, timeoutPromise]);
    console.log("[API] Live VertoFX rates loaded:", vertoRates);
    
    // Convert the API response format to our app's expected format
    const formattedRates: VertoFXRates = {
      USD: { buy: 0, sell: 0 },
      EUR: { buy: 0, sell: 0 },
      GBP: { buy: 0, sell: 0 },
      CAD: { buy: 0, sell: 0 }
    };
    
    // Process rates
    for (const currency of ['USD', 'EUR', 'GBP', 'CAD']) {
      // Process NGN-XXX rates (NGN to foreign currency - this is our "buy" rate)
      const ngnToForeignKey = `NGN-${currency}`;
      if (vertoRates[ngnToForeignKey]) {
        console.log(`[API] Processing ${ngnToForeignKey} rate:`, vertoRates[ngnToForeignKey]);
        // Convert the inverse rate to the actual rate in NGN
        // If rate is 0.0006113673055, the NGN rate is 1/0.0006113673055 = ~1636.63
        if (vertoRates[ngnToForeignKey].rate > 0) {
          formattedRates[currency].buy = 1 / vertoRates[ngnToForeignKey].rate;
          console.log(`[API] Calculated ${currency} buy rate: ${formattedRates[currency].buy}`);
        }
      }
      
      // Process XXX-NGN rates (foreign currency to NGN - this is our "sell" rate)
      const foreignToNgnKey = `${currency}-NGN`;
      if (vertoRates[foreignToNgnKey]) {
        console.log(`[API] Processing ${foreignToNgnKey} rate:`, vertoRates[foreignToNgnKey]);
        formattedRates[currency].sell = vertoRates[foreignToNgnKey].rate;
        console.log(`[API] Set ${currency} sell rate: ${formattedRates[currency].sell}`);
      }
    }
    
    console.log("[API] Formatted VertoFX rates:", formattedRates);
    
    // Verify we have valid rates before updating the cache
    const hasValidRates = Object.values(formattedRates).some(rate => 
      (rate.buy > 0 || rate.sell > 0)
    );
    
    if (hasValidRates) {
      // Update the cache with new valid rates
      cachedVertoFxRates = { ...formattedRates };
      
      // Save historical VertoFX rates to database
      try {
        await saveVertoFxHistoricalRates(vertoRates);
      } catch (error) {
        console.error("[API] Error saving historical VertoFX rates:", error);
        // Continue execution even if saving fails
      }
      
      return formattedRates;
    } else {
      console.warn("[API] No valid rates found in API response, using cached rates");
      return { ...cachedVertoFxRates };
    }
  } catch (error) {
    console.error("[API] Error fetching VertoFX rates:", error);
    toast.warning("Using cached VertoFX rates - couldn't connect to provider", {
      description: "Will retry on next refresh"
    });
    
    console.log("[API] Returning cached VertoFX rates:", cachedVertoFxRates);
    return { ...cachedVertoFxRates };
  }
};
