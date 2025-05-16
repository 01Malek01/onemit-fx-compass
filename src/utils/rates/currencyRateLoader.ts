import { toast } from "sonner";
import { CurrencyRates, fetchFxRates } from "@/services/api";
import {
  fetchCurrencyRates,
  saveCurrencyRates,
} from "@/services/currency-rates";
import { cacheWithExpiration } from "../cacheUtils";
import { raceWithTimeout } from "../apiUtils";

// Local cache for last successful rate data
let lastSuccessfulFxRates: CurrencyRates = {};

/**
 * Load currency rates with fallbacks
 */
export const loadCurrencyRates = async (
  isMobile: boolean = false
): Promise<CurrencyRates> => {
  const supportedCurrencies = ["USD", "EUR", "GBP", "CAD"];

  // Check memory cache first for ultra-fast loading on mobile
  if (isMobile) {
    const cachedRates = cacheWithExpiration.get("fxRates");
    if (cachedRates) {
      console.log(
        "[currencyRateLoader] Using in-memory cached FX rates for instant mobile loading"
      );
      return cachedRates;
    }
  }

  try {
    // Use a much shorter timeout for mobile - 2 seconds max wait
    const apiTimeout = isMobile ? 2000 : 5000;

    // Fetch from API with timeout
    const apiRates = await raceWithTimeout(
      fetchFxRates(),
      apiTimeout,
      "Currency rates API request timed out"
    );

    // Process the rates
    const rates = { ...apiRates, USD: 1.0 };

    // Update memory cache
    cacheWithExpiration.set(
      "fxRates",
      rates,
      isMobile ? 600000 : 300000 // 10min mobile, 5min desktop
    );

    // Save to database for persistence - skip on mobile to improve performance
    if (!isMobile) {
      saveCurrencyRates(rates).catch((err) => {
        console.error("[currencyRateLoader] Failed to save rates to DB:", err);
      });
    }

    // Update our last successful rates cache
    lastSuccessfulFxRates = { ...rates };
    return rates;
  } catch (error) {
    console.error("[currencyRateLoader] Error fetching rates from API:", error);

    // Fallback: Get rates from database if API fails
    try {
      const dbRates = await fetchCurrencyRates();
      if (Object.keys(dbRates).length > 0) {
        const rates = { ...dbRates, USD: 1.0 };
        return rates;
      }
    } catch (dbError) {
      console.error(
        "[currencyRateLoader] Failed to fetch rates from DB:",
        dbError
      );
    }

    // Use last successful rates or defaults
    if (Object.keys(lastSuccessfulFxRates).length > 0) {
      return { ...lastSuccessfulFxRates };
    } else {
      return { USD: 1.0, EUR: 0.88, GBP: 0.76, CAD: 1.38 };
    }
  }
};

/**
 * Get the last successfully loaded currency rates
 */
export const getLastSuccessfulFxRates = (): CurrencyRates => {
  return { ...lastSuccessfulFxRates };
};

/**
 * Reset the last successful currency rates
 */
export const resetLastSuccessfulFxRates = (): void => {
  lastSuccessfulFxRates = {};
};
