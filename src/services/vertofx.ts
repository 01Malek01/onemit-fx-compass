import axios from "axios";
import { cacheWithExpiration } from '@/utils/cacheUtils';
import { logger } from '@/utils/logUtils';

export interface VertoFxRate {
  rate: number;
  inverse_rate: number;
  raw_rate: number;
  raw_inverse: number;
  rate_after_spread: number;
  unit_spread?: number;
  provider?: string;
  rate_type?: string;
  percent_change?: number;
}

// Define and export VertoFXRates to match the API service definition
export type VertoFXRates = {
  USD: { buy: number; sell: number };
  EUR: { buy: number; sell: number };
  GBP: { buy: number; sell: number };
  CAD: { buy: number; sell: number };
  [key: string]: { buy: number; sell: number };
};

// Cache key for VertoFX rates
const VERTOFX_CACHE_KEY = 'vertofx_rates_cache';

// Rate limiting keys
const RATE_LIMIT_STORAGE_KEY = 'vertofx_rate_limit';
const RATE_LIMIT_RESET_KEY = 'vertofx_rate_limit_reset';
const RATE_LIMIT_RETRIES_KEY = 'vertofx_rate_limit_retries';

// Check if we're being rate limited
function isRateLimited(): boolean {
  const rateLimitedUntil = localStorage.getItem(RATE_LIMIT_RESET_KEY);
  if (rateLimitedUntil) {
    const resetTime = parseInt(rateLimitedUntil, 10);
    if (!isNaN(resetTime) && resetTime > Date.now()) {
      // We're still in the rate limit window
      return true;
    } else {
      // Rate limit has expired, remove it
      localStorage.removeItem(RATE_LIMIT_RESET_KEY);
      return false;
    }
  }
  return false;
}

// Update rate limit information
function handleRateLimit(retryAfterHeader?: string) {
  // Get current number of retries
  let retriesCount = 0;
  const storedRetries = localStorage.getItem(RATE_LIMIT_RETRIES_KEY);
  if (storedRetries) {
    retriesCount = parseInt(storedRetries, 10) || 0;
  }
  
  // Increment retries
  retriesCount++;
  localStorage.setItem(RATE_LIMIT_RETRIES_KEY, retriesCount.toString());
  
  // Calculate backoff time (exponential backoff with a cap)
  let backoffTimeMs = 60000; // Start with 1 minute
  
  if (retryAfterHeader) {
    // Use the Retry-After header if available (in seconds)
    const retryAfterSeconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(retryAfterSeconds)) {
      backoffTimeMs = retryAfterSeconds * 1000;
    }
  } else {
    // Exponential backoff based on number of retries
    // 1st retry: 1 min, 2nd: 2 min, 3rd: 4 min, 4th: 8 min, 5th+: 15 min
    if (retriesCount > 1) {
      backoffTimeMs = Math.min(Math.pow(2, retriesCount - 1) * 60000, 15 * 60000);
    }
  }
  
  // Set rate limit until timestamp
  const resetTime = Date.now() + backoffTimeMs;
  localStorage.setItem(RATE_LIMIT_RESET_KEY, resetTime.toString());
  localStorage.setItem(RATE_LIMIT_STORAGE_KEY, 'true');
  
  logger.warn(`VertoFX API rate limited. Backing off for ${backoffTimeMs/1000} seconds until ${new Date(resetTime).toLocaleTimeString()}`);
  
  return resetTime;
}

// Reset rate limit retries counter on success
function resetRateLimitRetries() {
  localStorage.removeItem(RATE_LIMIT_RETRIES_KEY);
}

/**
 * Get the exchange rate between two currencies from VertoFX
 * Optimized with improved caching and rate limit handling
 */
export async function getVertoFxRate(fromCurrency: string, toCurrency: string): Promise<VertoFxRate | null> {
  // Check if we're currently rate limited
  if (isRateLimited()) {
    logger.debug(`[VertoFX API] Currently rate limited for ${fromCurrency}/${toCurrency}`);
    return null;
  }

  // Check cache first
  const cacheKey = `${VERTOFX_CACHE_KEY}_${fromCurrency}_${toCurrency}`;
  const cachedRate = cacheWithExpiration.get(cacheKey);
  
  if (cachedRate) {
    logger.debug(`[VertoFX API] Using cached rate for ${fromCurrency}/${toCurrency}`);
    return cachedRate;
  }
  
  logger.debug(`[VertoFX API] Fetching rate from ${fromCurrency} to ${toCurrency}`);
  const url = "https://api-currency-beta.vertofx.com/p/currencies/exchange-rate";

  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json",
    "Origin": "https://www.vertofx.com",
    "Referer": "https://www.vertofx.com/",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-site",
  };

  const payload = {
    currencyFrom: { label: fromCurrency },
    currencyTo: { label: toCurrency },
  };

  try {
    // Set a shorter 5-second timeout to avoid hanging requests
    const response = await axios.post(url, payload, { 
      headers,
      timeout: 5000 // Reduced from 10s to 5s
    });
    
    // Check for rate limit headers
    const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
    if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) === 0) {
      // We've hit our rate limit, store the reset time
      handleRateLimit(response.headers['retry-after']);
    } else {
      // Reset retries counter on successful API call
      resetRateLimitRetries();
    }
    
    const data = response.data;

    if (data?.success) {
      const rawRate = data.rate;
      const spreadRate = data.rateAfterSpread ?? rawRate;

      const result: VertoFxRate = {
        rate: spreadRate,
        inverse_rate: data.reversedRate,
        raw_rate: rawRate,
        raw_inverse: data.reversedRate,
        rate_after_spread: spreadRate,
        unit_spread: data.unitSpread,
        provider: data.provider,
        rate_type: data.rateType,
        percent_change: data.overnightPercentChange,
      };
      
      // Cache the result for 5 minutes
      cacheWithExpiration.set(cacheKey, result, 5 * 60 * 1000);
      
      return result;
    }

    logger.warn(`[VertoFX API] Invalid response for ${fromCurrency}/${toCurrency}`);
    return null;
  } catch (error) {
    // Check for rate limit status codes (429 Too Many Requests)
    if (axios.isAxiosError(error) && error.response?.status === 429) {
      // Handle rate limiting
      handleRateLimit(error.response.headers['retry-after']);
      logger.warn(`[VertoFX API] Rate limited when fetching ${fromCurrency}/${toCurrency}`);
      return null;
    }
    
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      logger.error(`[VertoFX API] Request timed out for ${fromCurrency}/${toCurrency}`);
    } else {
      logger.error(`[VertoFX API] Error fetching ${fromCurrency}/${toCurrency}`, error);
      
      // If we have connection errors multiple times, implement a temporary rate limit
      // to avoid hammering a potentially down API
      const retriesCount = localStorage.getItem(RATE_LIMIT_RETRIES_KEY);
      if (!retriesCount || parseInt(retriesCount, 10) > 2) {
        handleRateLimit();
      }
    }
    return null;
  }
}

/**
 * Fetch both NGN → XXX and XXX → NGN rates for a predefined set of currencies
 * with improved caching, performance, and rate limit handling
 */
export async function getAllNgnRates(): Promise<Record<string, VertoFxRate>> {
  // Check if we're currently rate limited
  if (isRateLimited()) {
    const resetTime = parseInt(localStorage.getItem(RATE_LIMIT_RESET_KEY) || '0', 10);
    logger.warn(`[VertoFX API] Currently rate limited until ${new Date(resetTime).toLocaleTimeString()}`);
    return {};
  }

  // Check for cached full results
  const cachedRates = cacheWithExpiration.get(VERTOFX_CACHE_KEY);
  if (cachedRates) {
    logger.debug("[VertoFX API] Using cached rates for all currencies");
    return cachedRates;
  }
  
  logger.debug("[VertoFX API] Fetching all NGN rates");
  const currencies = ["USD", "EUR", "GBP", "CAD"];
  const results: Record<string, VertoFxRate> = {};
  
  // Add a small delay between requests to avoid rate limiting
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Process currencies one by one to avoid overwhelming the API
  for (const currency of currencies) {
    // We'll fetch one direction and wait a bit before the second direction
    // This gives the API some breathing room
    try {
      // NGN to Currency (Buy rate)
      const ngnToCurrency = await getVertoFxRate("NGN", currency);
      if (ngnToCurrency) {
        results[`NGN-${currency}`] = ngnToCurrency;
        
        // If we successfully get one rate, wait 250ms before the next
        await delay(250);
      }
      
      // Check if we've been rate limited after the first request
      if (isRateLimited()) {
        logger.warn(`[VertoFX API] Rate limited after fetching NGN-${currency}`);
        break;
      }
      
      // Currency to NGN (Sell rate)
      const currencyToNgn = await getVertoFxRate(currency, "NGN");
      if (currencyToNgn) {
        results[`${currency}-NGN`] = currencyToNgn;
      }
      
      // Add a short delay between currency pairs
      await delay(250);
    } catch (error) {
      logger.error(`[VertoFX API] Error processing ${currency}`, error);
      // Continue with next currency
    }
    
    // Exit early if we've been rate limited
    if (isRateLimited()) {
      break;
    }
  }
  
  // Cache the partial or full results for 5 minutes
  if (Object.keys(results).length > 0) {
    const cacheDuration = Object.keys(results).length >= currencies.length * 2 
      ? 5 * 60 * 1000  // Full results - cache for 5 minutes
      : 3 * 60 * 1000; // Partial results - cache for 3 minutes
      
    cacheWithExpiration.set(VERTOFX_CACHE_KEY, results, cacheDuration);
  }
  
  return results;
}
