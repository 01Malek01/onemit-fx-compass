
import { fetchExchangeRates } from './currency-rates-service';
import { getAllNgnRates, VertoFxRate } from './vertofx';
import { saveVertoFxHistoricalRates } from './vertofx-historical-service';
import { cacheWithExpiration } from '@/utils/cacheUtils';
import { logger } from '@/utils/logUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Type for currency rates
export type CurrencyRates = Record<string, number>;

// Type for VertoFX rates
export interface VertoFXRates {
  USD: { buy: number; sell: number };
  EUR: { buy: number; sell: number };
  GBP: { buy: number; sell: number };
  CAD: { buy: number; sell: number };
  [key: string]: { buy: number; sell: number };
}

// Global variable to store current cost prices for fast access
let currentCostPrices: CurrencyRates = {};

// Cache keys
const FX_RATES_CACHE_KEY = 'fx_rates_cache';
const VERTOFX_RATES_CACHE_KEY = 'formatted_vertofx_rates';

// Update current cost prices and persist to Supabase
export const updateCurrentCostPrices = async (costPrices: CurrencyRates) => {
  try {
    // Update in-memory prices
    currentCostPrices = { ...costPrices };
    
    // Persist to Supabase
    const { error } = await supabase
      .from('cost_prices')
      .upsert({ 
        id: 1,
        prices: costPrices,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (error) {
      logger.error("[API] Error saving cost prices to Supabase:", error);
      toast.error("Failed to save cost prices");
    }
  } catch (err) {
    logger.error("[API] Failed to save cost prices to Supabase:", err);
  }
};

// Get current cost prices
export const getCurrentCostPrices = (): CurrencyRates => {
  return { ...currentCostPrices };
};

// Fetch FX rates from currency-rates-service with improved caching
export const fetchFxRates = async (): Promise<CurrencyRates> => {
  // Check cache first
  const cachedRates = cacheWithExpiration.get(FX_RATES_CACHE_KEY);
  if (cachedRates) {
    logger.debug("[API] Using cached FX rates");
    return cachedRates;
  }

  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD'];
  try {
    const rates = await fetchExchangeRates(supportedCurrencies);
    // Cache for 10 minutes
    cacheWithExpiration.set(FX_RATES_CACHE_KEY, rates, 10 * 60 * 1000);
    return rates;
  } catch (error) {
    logger.error("[API] Error fetching FX rates:", error);
    throw error;
  }
};

// Fetch VertoFX rates - optimized with smarter caching
export const fetchVertoFXRates = async (): Promise<VertoFXRates> => {
  try {
    logger.debug("[API] Fetching live VertoFX rates...");

    const vertoRates = await getAllNgnRates();

    // Initialize with empty rates
    const formattedRates: VertoFXRates = {
      USD: { buy: 0, sell: 0 },
      EUR: { buy: 0, sell: 0 },
      GBP: { buy: 0, sell: 0 },
      CAD: { buy: 0, sell: 0 }
    };

    // Process rates
    for (const currency of ['USD', 'EUR', 'GBP', 'CAD']) {
      const ngnToForeignKey = `NGN-${currency}`;
      const foreignToNgnKey = `${currency}-NGN`;

      if (vertoRates[ngnToForeignKey] && vertoRates[ngnToForeignKey].rate > 0) {
        formattedRates[currency].buy = 1 / vertoRates[ngnToForeignKey].rate;
      }

      if (vertoRates[foreignToNgnKey]) {
        formattedRates[currency].sell = vertoRates[foreignToNgnKey].rate;
      }
    }

    if (Object.values(formattedRates).some(rate => rate.buy > 0 || rate.sell > 0)) {
      cacheWithExpiration.set(VERTOFX_RATES_CACHE_KEY, formattedRates, 5 * 60 * 1000);
      await saveVertoFxHistoricalRates(vertoRates);
      return formattedRates;
    }

    throw new Error('No valid rates received from API');
  } catch (error) {
    logger.error("[API] Error fetching VertoFX rates:", error);
    throw error;
  }
};
