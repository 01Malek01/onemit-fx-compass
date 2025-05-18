import { toast } from "sonner";
import { CurrencyRateResponse } from "./types";
import { browserStorage } from "@/utils/cacheUtils";
import { fetchWithTimeout } from "@/utils/apiUtils";
import { logger } from "@/utils/logUtils";
import axios from "axios";
import { CurrencyRate } from "./types";

// API configuration
const API_KEY = import.meta.env.VITE_API_KEY || "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Memory cache for ultra-fast responses
const memoryCache: Record<
  string,
  { data: Record<string, number>; timestamp: number }
> = {};
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Type for currency rates object (from external API)
 */
export type CurrencyRates = Record<string, number>;

/**
 * Default API endpoint for currency rates
 */
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Fetch currency rates from the API
 */
export const fetchCurrencyRates = async (): Promise<CurrencyRates> => {
  try {
    const response = await axios.get(API_URL);

    // Type check for the response structure
    if (
      response.data &&
      typeof response.data === "object" &&
      "rates" in response.data &&
      response.data.rates &&
      typeof response.data.rates === "object"
    ) {
      // At this point, we've verified rates exists and is an object
      const rates = response.data.rates as Record<string, number>;
      console.log("Fetched rates:", rates);
      return rates;
    }

    throw new Error("Invalid rates data structure from API");
  } catch (error) {
    console.error("Error fetching currency rates:", error);
    // Return a minimal set of default rates as fallback
    return {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.37,
    };
  }
};

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
    const cacheKey = `currency_rates_${currencies.join("_")}`;

    // Check memory cache first (fastest)
    const now = Date.now();
    if (
      memoryCache[cacheKey] &&
      now - memoryCache[cacheKey].timestamp < CACHE_TTL
    ) {
      return Promise.resolve(memoryCache[cacheKey].data);
    }

    // Then check browser storage cache
    const cachedRates = browserStorage.getItem(cacheKey) as Record<
      string,
      number
    > | null;
    if (cachedRates) {
      // Update memory cache for future requests
      memoryCache[cacheKey] = {
        data: cachedRates,
        timestamp: now,
      };
      return Promise.resolve(cachedRates);
    }

    // Join the currencies with a comma for the API request
    const currenciesParam = currencies.join(",");

    // Make API request with configurable timeout
    return fetchWithTimeout<CurrencyRateResponse>(
      `${API_BASE_URL}?apikey=${API_KEY}&currencies=${currenciesParam}`,
      undefined,
      timeoutMs
    )
      .then((data) => {
        if (!data || !data.data) {
          throw new Error("Invalid API response format");
        }

        // Update both cache layers
        memoryCache[cacheKey] = {
          data: data.data,
          timestamp: now,
        };

        // Cache in browser storage with 30 min TTL
        browserStorage.setItem(cacheKey, data.data, CACHE_TTL);

        return data.data;
      })
      .catch((error) => {
        logger.error(
          "[currency-rates/api] Error fetching exchange rates:",
          error
        );

        // Only show toast for user-initiated requests
        const isBackgroundRefresh = false; // You could pass this as a parameter
        if (!isBackgroundRefresh) {
          toast.warning(
            "Using saved exchange rates - couldn't connect to rate provider"
          );
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
export function fetchSingleExchangeRate(
  currency: string
): Promise<number | null> {
  return fetchExchangeRates([currency])
    .then((rates) => rates[currency] || null)
    .catch((error) => {
      logger.error(
        `[currency-rates/api] Error fetching rate for ${currency}:`,
        error
      );
      return null;
    });
}

/**
 * VertoFX rates interface
 */
export interface VertoFXRates {
  USD: { buy: number; sell: number };
  EUR: { buy: number; sell: number };
  GBP: { buy: number; sell: number };
  CAD: { buy: number; sell: number };
  [key: string]: { buy: number; sell: number };
}

// Default VertoFX rates to use as fallback
export const DEFAULT_VERTOFX_RATES: VertoFXRates = {
  USD: { buy: 1635, sell: 1600 },
  EUR: { buy: 1870, sell: 1805 },
  GBP: { buy: 2150, sell: 2080 },
  CAD: { buy: 1190, sell: 1140 },
};

const VERTO_FX_API_URL = import.meta.env.VITE_VERTO_FX_API_URL;

export const fetchVertoFXRates = async (): Promise<VertoFXRates> => {
  try {
    const response = await axios.get(VERTO_FX_API_URL);

    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      Array.isArray(response.data.data)
    ) {
      const ratesData = response.data.data;
      const rates: VertoFXRates = {
        USD: { buy: 0, sell: 0 },
        EUR: { buy: 0, sell: 0 },
        GBP: { buy: 0, sell: 0 },
        CAD: { buy: 0, sell: 0 },
      };

      // Define the type for API response item
      interface VertoFXRateItem {
        currencyPair: string;
        buy: number;
        sell: number;
        [key: string]: unknown; // Allow other properties with unknown type
      }

      ratesData.forEach((item: VertoFXRateItem) => {
        const { currencyPair, buy, sell } = item;

        if (typeof currencyPair === "string" && currencyPair.endsWith("NGN")) {
          const currency = currencyPair.substring(0, 3);

          if (["USD", "EUR", "GBP", "CAD"].includes(currency)) {
            rates[currency as keyof VertoFXRates] = {
              buy: typeof buy === "number" ? buy : 0,
              sell: typeof sell === "number" ? sell : 0,
            };
          }
        }
      });

      return rates;
    } else if (response.data && response.data.error === "Rate limit exceeded") {
      // Set a flag in local storage to indicate rate limiting
      const resetTime = Date.now() + 60 * 60 * 1000; // 1 hour
      localStorage.setItem("vertofx_rate_limit_reset", resetTime.toString());
      throw new Error("VertoFX API rate limit exceeded");
    } else {
      throw new Error("Invalid VertoFX rates data structure from API");
    }
  } catch (error) {
    console.error("Error fetching VertoFX rates:", error);
    throw error;
  }
};
