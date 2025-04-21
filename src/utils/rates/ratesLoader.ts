import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { loadUsdtRate } from './usdtRateLoader';
import { loadCurrencyRates } from './currencyRateLoader';
import { loadVertoFxRates } from './vertoRateLoader';
import { browserStorage } from '@/utils/cacheUtils';
import { logger } from '@/utils/logUtils';

// Cache key for initial load data
const INITIAL_LOAD_CACHE_KEY = 'fx_initial_load_data';

// Define interface for cached data structure
interface CachedRatesData {
  usdtRate: number;
  fxRates: CurrencyRates;
  vertoRates?: VertoFXRates;
  timestamp: number;
}

/**
 * Optimized function to load all rates data with aggressive caching
 */
export const loadRatesData = async (
  setFxRates: (rates: CurrencyRates) => void,
  setVertoFxRates: (rates: VertoFXRates) => void,
  setIsLoading: (loading: boolean) => void,
  isMobile: boolean = false
): Promise<{
  usdtRate: number,
  fxRates: CurrencyRates,
  success: boolean
}> => {
  setIsLoading(true);

  try {
    // Initialize with empty rates
    setVertoFxRates({
      USD: { buy: 0, sell: 0 },
      EUR: { buy: 0, sell: 0 },
      GBP: { buy: 0, sell: 0 },
      CAD: { buy: 0, sell: 0 }
    });

    // Load rates concurrently
    const [usdtRate, rates, vertoRates] = await Promise.all([
      loadUsdtRate(),
      loadCurrencyRates(isMobile),
      loadVertoFxRates(isMobile, setVertoFxRates).catch(error => {
        logger.error("[ratesLoader] VertoFX rates loading failed:", error);
        return null;
      })
    ]);

    setFxRates(rates);

    return {
      usdtRate,
      fxRates: rates,
      success: true
    };
  } catch (error) {
    logger.error("[ratesLoader] Error loading rates data:", error);
    throw error;
  } finally {
    setIsLoading(false);
  }
};

// Background refresh function to update data after initial render
export const loadFreshDataInBackground = async (
  setFxRates: (rates: CurrencyRates) => void,
  setVertoFxRates: (rates: VertoFXRates) => void
) => {
  try {
    logger.debug("[ratesLoader] Starting background refresh");
    const [rates, vertoRates] = await Promise.all([
      loadCurrencyRates(false).catch(() => null),
      loadVertoFxRates(false, setVertoFxRates).catch(() => null)
    ]);

    if (rates) setFxRates(rates);
  } catch (error) {
    logger.warn("[ratesLoader] Background refresh failed:", error);
  }
};
