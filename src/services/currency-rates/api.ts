import { toast } from "sonner";
import { CurrencyRateResponse } from "./types";
import { browserStorage } from "@/utils/cacheUtils";
import { fetchWithTimeout } from "@/utils/apiUtils";
import { logger } from "@/utils/logUtils";

// API configuration
const API_KEY = 'fca_live_Go01rIgZxHqhRvqFQ2BLi6o5oZGoovGuZk3sQ8nV';
const API_BASE_URL = 'https://api.freecurrencyapi.com/v1/latest';

// Memory cache for ultra-fast responses
const memoryCache: Record<string, {data: Record<string, number>, timestamp: number}> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches the latest exchange rates for specified currencies against USD
 * Performance optimized with multi-layer caching
 */
export function fetchExchangeRates(
  currencies: string[],
  timeoutMs: number = 5000
): Promise<Record<string, number>> {
  try {
    // Generate a cache key based on the currencies
    const cacheKey = `currency_rates_${currencies.join('_')}`;
    
    // Check memory cache first (fastest)
    const now = Date.now();
    if (memoryCache[cacheKey] && (now - memoryCache[cacheKey].timestamp < CACHE_TTL)) {
      return Promise.resolve(memoryCache[cacheKey].data);
    }
    
    // Then check browser storage cache
    const cachedRates = browserStorage.getItem(cacheKey) as Record<string, number> | null;
    if (cachedRates) {
      // Update memory cache for future requests
      memoryCache[cacheKey] = {
        data: cachedRates,
        timestamp: now
      };
      return Promise.resolve(cachedRates);
    }
    
    // Join the currencies with a comma for the API request
    const currenciesParam = currencies.join(',');
    
    // Make API request with configurable timeout
    return fetchWithTimeout<CurrencyRateResponse>(
      `${API_BASE_URL}?apikey=${API_KEY}&currencies=${currenciesParam}`,
      undefined,
      timeoutMs
    ).then(data => {
      if (!data || !data.data) {
        throw new Error("Invalid API response format");
      }
      
      // Update both cache layers
      memoryCache[cacheKey] = {
        data: data.data,
        timestamp: now
      };
      
      // Cache in browser storage with 30 min TTL
      browserStorage.setItem(cacheKey, data.data, CACHE_TTL);
      
      return data.data;
    }).catch(error => {
      logger.error("[currency-rates/api] Error fetching exchange rates:", error);
      
      // Only show toast for user-initiated requests
      const isBackgroundRefresh = false; // You could pass this as a parameter
      if (!isBackgroundRefresh) {
        toast.warning("Using saved exchange rates - couldn't connect to rate provider");
      }
      
      throw error; // Re-throw to let the storage module handle fallback
    });
  } catch (error) {
    return Promise.reject(error);
  }
}

/**
 * Fetches the exchange rate for a single currency against USD
 * @param currency Currency code (e.g., "EUR")
 * @returns Exchange rate or null if not found
 */
export function fetchSingleExchangeRate(currency: string): Promise<number | null> {
  return fetchExchangeRates([currency])
    .then(rates => rates[currency] || null)
    .catch(error => {
      logger.error(`[currency-rates/api] Error fetching rate for ${currency}:`, error);
      return null;
    });
}
