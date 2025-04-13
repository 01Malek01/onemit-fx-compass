
import { toast } from "sonner";
import { CurrencyRateResponse } from "./types";

// API configuration
const API_KEY = 'fca_live_Go01rIgZxHqhRvqFQ2BLi6o5oZGoovGuZk3sQ8nV';
const API_BASE_URL = 'https://api.freecurrencyapi.com/v1/latest';

// Simple browser storage for frequently accessed data
const rateCacheStorage = {
  getItem(key: string) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (e) {
      return null;
    }
  },
  
  setItem(key: string, value: any, ttlMs = 3600000) { // 1 hour default TTL
    try {
      const item = {
        value,
        expiry: Date.now() + ttlMs
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Fetches the latest exchange rates for specified currencies against USD
 * @param currencies Array of currency codes (e.g., ["EUR", "GBP", "CAD"])
 * @param timeoutMs Timeout in milliseconds for the API request
 * @returns Object with currency codes as keys and exchange rates as values
 */
export const fetchExchangeRates = async (
  currencies: string[],
  timeoutMs: number = 5000
): Promise<Record<string, number>> => {
  try {
    console.log("[currency-rates/api] Fetching exchange rates for:", currencies);
    
    // Check browser storage cache first for instant response on mobile
    const cacheKey = `currency_rates_${currencies.join('_')}`;
    const cachedRates = rateCacheStorage.getItem(cacheKey);
    
    if (cachedRates) {
      console.log("[currency-rates/api] Using cached rates from browser storage:", cachedRates);
      return cachedRates;
    }
    
    // Join the currencies with a comma for the API request
    const currenciesParam = currencies.join(',');
    
    // Make API request with a configurable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(`${API_BASE_URL}?apikey=${API_KEY}&currencies=${currenciesParam}`, {
      signal: controller.signal,
      // Set high priority fetch for critical resources
      priority: 'high'
    }).finally(() => clearTimeout(timeoutId));
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data: CurrencyRateResponse = await response.json();
    console.log("[currency-rates/api] API response:", data);
    
    if (!data || !data.data) {
      throw new Error("Invalid API response format");
    }
    
    // Cache the successful response in browser storage
    rateCacheStorage.setItem(cacheKey, data.data, 1800000); // 30 min TTL
    
    return data.data;
  } catch (error) {
    console.error("[currency-rates/api] Error fetching exchange rates:", error);
    toast.warning("Using saved exchange rates - couldn't connect to rate provider", {
      description: "Will retry on next refresh"
    });
    
    throw error; // Re-throw to let the storage module handle fallback
  }
};

/**
 * Fetches the exchange rate for a single currency against USD
 * @param currency Currency code (e.g., "EUR")
 * @returns Exchange rate or null if not found
 */
export const fetchSingleExchangeRate = async (currency: string): Promise<number | null> => {
  try {
    const rates = await fetchExchangeRates([currency]);
    return rates[currency] || null;
  } catch (error) {
    console.error(`[currency-rates/api] Error fetching rate for ${currency}:`, error);
    return null;
  }
};
