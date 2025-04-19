import { fetchLatestUsdtNgnRate, DEFAULT_RATE } from '@/services/usdt-ngn-service';
import { cacheWithExpiration } from '../cacheUtils';

// Local cache for last successful rate data
let lastSuccessfulUsdtRate: number = 0;

/**
 * Load USDT/NGN rate with fallbacks
 */
export const loadUsdtRate = async (): Promise<number> => {
  try {
    console.log("[usdtRateLoader] Fetching USDT/NGN rate from database");
    const usdtRate = await fetchLatestUsdtNgnRate();
    
    if (usdtRate > 0) {
      lastSuccessfulUsdtRate = usdtRate;
      return usdtRate;
    }
  } catch (error) {
    console.error("[usdtRateLoader] Error fetching USDT/NGN rate:", error);
  }
  
  // Return last successful rate or default
  return lastSuccessfulUsdtRate > 0 ? lastSuccessfulUsdtRate : DEFAULT_RATE;
};

/**
 * Get the last successfully loaded USDT rate
 */
export const getLastSuccessfulUsdtRate = (): number => {
  return lastSuccessfulUsdtRate > 0 ? lastSuccessfulUsdtRate : DEFAULT_RATE;
};

/**
 * Reset the last successful USDT rate
 */
export const resetLastSuccessfulUsdtRate = (): void => {
  lastSuccessfulUsdtRate = 0;
};
