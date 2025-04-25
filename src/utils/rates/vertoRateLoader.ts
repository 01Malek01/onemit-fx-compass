
import { VertoFXRates, fetchVertoFXRates } from '@/services/api';
import { cacheWithExpiration } from '../cacheUtils';
import { raceWithTimeout } from '../apiUtils';
import { toast } from 'sonner';
import { logger } from '../logUtils';

// Storage key for the last API attempt timestamp
const LAST_API_ATTEMPT_STORAGE_KEY = 'lastVertoFxApiAttempt';
const VERTOFX_RATE_LIMIT_KEY = 'vertofx_rate_limit_reset';

// Local cache for last successful rate data
let lastSuccessfulVertoFxRates: VertoFXRates = {
  USD: { buy: 0, sell: 0 },
  EUR: { buy: 0, sell: 0 },
  GBP: { buy: 0, sell: 0 },
  CAD: { buy: 0, sell: 0 }
};
let lastApiAttemptTimestamp: number = 0;
let lastApiSuccess: boolean = false;

// Change the cooldown time from 30 seconds to 10 minutes (600 seconds)
const REFRESH_COOLDOWN_TIME = 600; // 10 minutes in seconds

/**
 * Check if the VertoFX API is currently rate limited
 */
export const isVertoFxRateLimited = (): boolean => {
  const rateLimitedUntil = localStorage.getItem(VERTOFX_RATE_LIMIT_KEY);
  if (rateLimitedUntil) {
    const resetTime = parseInt(rateLimitedUntil, 10);
    if (!isNaN(resetTime) && resetTime > Date.now()) {
      // We're still in the rate limit window
      return true;
    } else {
      // Rate limit has expired, remove it
      localStorage.removeItem(VERTOFX_RATE_LIMIT_KEY);
      return false;
    }
  }
  return false;
};

/**
 * Get the last API attempt timestamp, checking both memory and localStorage
 */
export const getLastApiAttemptTimestamp = (): number => {
  // First check localStorage
  const storedTimestamp = window.localStorage.getItem(LAST_API_ATTEMPT_STORAGE_KEY);
  if (storedTimestamp) {
    const parsedTimestamp = parseInt(storedTimestamp, 10);
    if (!isNaN(parsedTimestamp)) {
      // Use the most recent timestamp (either in-memory or localStorage)
      lastApiAttemptTimestamp = Math.max(lastApiAttemptTimestamp, parsedTimestamp);
      return lastApiAttemptTimestamp;
    }
  }

  return lastApiAttemptTimestamp;
};

/**
 * Set the last API attempt timestamp in both memory and localStorage
 */
export const setLastApiAttemptTimestamp = (timestamp: number): void => {
  // Update both in-memory and localStorage values
  lastApiAttemptTimestamp = timestamp;
  window.localStorage.setItem(LAST_API_ATTEMPT_STORAGE_KEY, timestamp.toString());
};

/**
 * Force bypass the rate limiting cooldown
 */
export const bypassRateLimitingCooldown = (): void => {
  // Set timestamp to 1 minute ago to force a new API call
  const bypassTimestamp = Date.now() - 60000;
  setLastApiAttemptTimestamp(bypassTimestamp);
  logger.debug("[vertoRateLoader] Bypassing rate limiting cooldown");
};

/**
 * Get time remaining until next allowed API call (in seconds)
 */
export const getTimeUntilNextAttempt = (): number => {
  // Check rate limiting first, which takes precedence
  if (isVertoFxRateLimited()) {
    const rateLimitReset = localStorage.getItem(VERTOFX_RATE_LIMIT_KEY);
    if (rateLimitReset) {
      const resetTime = parseInt(rateLimitReset, 10);
      if (!isNaN(resetTime)) {
        const secondsUntilReset = Math.ceil((resetTime - Date.now()) / 1000);
        return Math.max(secondsUntilReset, 0);
      }
    }
  }

  // Then check cooldown - changed from 30 to 600 seconds
  const lastAttempt = getLastApiAttemptTimestamp();
  const timeSinceLastAttempt = Math.floor((Date.now() - lastAttempt) / 1000);
  const timeUntilNextAttempt = REFRESH_COOLDOWN_TIME - timeSinceLastAttempt;

  return Math.max(timeUntilNextAttempt, 0);
};

/**
 * Load VertoFX rates with fallbacks
 */
export const loadVertoFxRates = async (
  isMobile: boolean = false,
  setVertoFxRates: (rates: VertoFXRates) => void,
  forceRefresh: boolean = false
): Promise<VertoFXRates> => {
  try {
    // On first load, bypass the cooldown check
    const isFirstLoad = lastApiAttemptTimestamp === 0;
    const lastAttemptTime = getLastApiAttemptTimestamp();
    const shouldCallApi = isFirstLoad || forceRefresh || (Date.now() - lastAttemptTime > REFRESH_COOLDOWN_TIME * 1000);

    if (!shouldCallApi && !isFirstLoad) {
      const timeUntilNextAttempt = Math.ceil((REFRESH_COOLDOWN_TIME * 1000 - (Date.now() - lastAttemptTime)) / 1000);
      logger.debug(`[vertoRateLoader] Rate limiting active, next attempt in ${timeUntilNextAttempt}s`);
      // Return last successful rates instead of throwing an error
      return { ...lastSuccessfulVertoFxRates };
    }

    if (isVertoFxRateLimited() && !forceRefresh && !isFirstLoad) {
      // Return last successful rates instead of throwing an error
      return { ...lastSuccessfulVertoFxRates };
    }

    logger.debug("[vertoRateLoader] Fetching fresh VertoFX rates");
    const vertoRates = await raceWithTimeout(
      fetchVertoFXRates(),
      isMobile ? 3000 : 10000,
      "VertoFX rates request timed out"
    );

    // Ensure we have default values for required properties
    const safeRates: VertoFXRates = {
      USD: { buy: 0, sell: 0 },
      EUR: { buy: 0, sell: 0 },
      GBP: { buy: 0, sell: 0 },
      CAD: { buy: 0, sell: 0 },
      ...vertoRates
    };

    if (safeRates && Object.values(safeRates).some(rate => rate.buy > 0 || rate.sell > 0)) {
      lastSuccessfulVertoFxRates = safeRates; // Update last successful rates
      lastApiSuccess = true;
      setVertoFxRates(safeRates);
      setLastApiAttemptTimestamp(Date.now());
      return safeRates;
    }

    // If we get here, we didn't get valid rates, return last successful rates
    return { ...lastSuccessfulVertoFxRates };
  } catch (error) {
    logger.error("[vertoRateLoader] Error fetching market comparison rates:", error);
    // Return last successful rates on error, instead of throwing
    return { ...lastSuccessfulVertoFxRates };
  }
};

/**
 * Get the last successfully loaded VertoFX rates
 */
export const getLastSuccessfulVertoFxRates = (): VertoFXRates => {
  return { ...lastSuccessfulVertoFxRates };
};

/**
 * Reset the last successful VertoFX rates
 */
export const resetLastSuccessfulVertoFxRates = (): void => {
  lastSuccessfulVertoFxRates = {
    USD: { buy: 0, sell: 0 },
    EUR: { buy: 0, sell: 0 },
    GBP: { buy: 0, sell: 0 },
    CAD: { buy: 0, sell: 0 }
  };
};

/**
 * Check if we are currently using default rates
 */
export const isUsingDefaultVertoFxRates = (): boolean => {
  return JSON.stringify(lastSuccessfulVertoFxRates) === JSON.stringify({
    USD: { buy: 1635, sell: 1600 },
    EUR: { buy: 1870, sell: 1805 },
    GBP: { buy: 2150, sell: 2080 },
    CAD: { buy: 1190, sell: 1140 }
  }) || !lastApiSuccess;
};

/**
 * Get the time since the last API attempt
 */
export const getLastApiAttemptTime = (): number => {
  return getLastApiAttemptTimestamp();
};
