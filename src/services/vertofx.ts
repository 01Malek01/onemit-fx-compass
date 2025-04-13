
import axios from "axios";
import { cacheWithExpiration } from '@/utils/cacheUtils';

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

// Cache key for VertoFX rates
const VERTOFX_CACHE_KEY = 'vertofx_rates_cache';

/**
 * Get the exchange rate between two currencies from VertoFX
 * Optimized with improved caching
 */
export async function getVertoFxRate(fromCurrency: string, toCurrency: string): Promise<VertoFxRate | null> {
  // Check cache first
  const cacheKey = `${VERTOFX_CACHE_KEY}_${fromCurrency}_${toCurrency}`;
  const cachedRate = cacheWithExpiration.get(cacheKey);
  
  if (cachedRate) {
    console.log(`[VertoFX API] Using cached rate for ${fromCurrency}/${toCurrency}`);
    return cachedRate;
  }
  
  console.log(`[VertoFX API] Fetching rate from ${fromCurrency} to ${toCurrency}`);
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

    console.warn(`[VertoFX API] Invalid response for ${fromCurrency}/${toCurrency}`);
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNABORTED') {
      console.error(`[VertoFX API] Request timed out for ${fromCurrency}/${toCurrency}`);
    } else {
      console.error(`[VertoFX API] Error fetching ${fromCurrency}/${toCurrency}`);
    }
    return null;
  }
}

/**
 * Fetch both NGN → XXX and XXX → NGN rates for a predefined set of currencies
 * with improved caching and performance
 */
export async function getAllNgnRates(): Promise<Record<string, VertoFxRate>> {
  // Check for cached full results
  const cachedRates = cacheWithExpiration.get(VERTOFX_CACHE_KEY);
  if (cachedRates) {
    console.log("[VertoFX API] Using cached rates for all currencies");
    return cachedRates;
  }
  
  console.log("[VertoFX API] Fetching all NGN rates");
  const currencies = ["USD", "EUR", "GBP", "CAD"];
  const results: Record<string, VertoFxRate> = {};
  
  // Create all promises first then resolve with Promise.allSettled
  const ratePromises: Array<Promise<void>> = [];
  
  for (const currency of currencies) {
    // NGN to Currency (Buy rate)
    ratePromises.push(
      getVertoFxRate("NGN", currency)
        .then(rate => {
          if (rate) results[`NGN-${currency}`] = rate;
        })
        .catch(() => {}) // Ignore errors in individual currencies
    );
    
    // Currency to NGN (Sell rate)
    ratePromises.push(
      getVertoFxRate(currency, "NGN")
        .then(rate => {
          if (rate) results[`${currency}-NGN`] = rate;
        })
        .catch(() => {}) // Ignore errors in individual currencies
    );
  }
  
  // Wait for all promises to settle (either resolve or reject)
  await Promise.allSettled(ratePromises);
  
  // Cache the full results for 5 minutes
  if (Object.keys(results).length > 0) {
    cacheWithExpiration.set(VERTOFX_CACHE_KEY, results, 5 * 60 * 1000);
  }
  
  return results;
}
