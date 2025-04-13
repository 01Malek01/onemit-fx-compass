
import { VertoFXRates, fetchVertoFXRates } from '@/services/api';
import { cacheWithExpiration } from '../cacheUtils';
import { raceWithTimeout } from '../apiUtils';

// Local cache for last successful rate data
let lastSuccessfulVertoFxRates: VertoFXRates = {
  USD: { buy: 1635, sell: 1600 },
  EUR: { buy: 1870, sell: 1805 },
  GBP: { buy: 2150, sell: 2080 },
  CAD: { buy: 1190, sell: 1140 }
};

/**
 * Load VertoFX rates with fallbacks
 */
export const loadVertoFxRates = async (
  isMobile: boolean = false,
  setVertoFxRates: (rates: VertoFXRates) => void
): Promise<VertoFXRates> => {
  // On mobile, use cached values for immediate display
  if (isMobile && Object.keys(lastSuccessfulVertoFxRates).length > 0) {
    const cachedRates = cacheWithExpiration.get('vertoRates');
    
    if (cachedRates) {
      console.log("[vertoRateLoader] Using cached VertoFX rates for immediate display");
      
      // In the background, try to load fresh rates
      setTimeout(async () => {
        try {
          const freshRates = await raceWithTimeout(
            fetchVertoFXRates(),
            3000,
            "VertoFX background update timeout"
          );
          
          if (freshRates && Object.keys(freshRates).length > 0) {
            setVertoFxRates(freshRates);
            lastSuccessfulVertoFxRates = { ...freshRates };
            cacheWithExpiration.set('vertoRates', freshRates, 600000);
          }
        } catch (error) {
          console.log("[vertoRateLoader] Background update of VertoFX rates failed:", error);
          // Ensure we use default rates if fetch fails
          setVertoFxRates({ ...lastSuccessfulVertoFxRates });
        }
      }, 100);
      
      return cachedRates;
    }
  }
  
  // Regular path - fetch directly
  try {
    const timeout = isMobile ? 3000 : 10000;
    const vertoRates = await raceWithTimeout(
      fetchVertoFXRates(),
      timeout,
      "VertoFX rates request timed out"
    );
    
    // Check if we got valid rates
    const hasValidRates = vertoRates && Object.keys(vertoRates).length > 0 && 
      Object.values(vertoRates).some(rate => 
        (rate.buy > 0 || rate.sell > 0)
      );
    
    if (hasValidRates) {
      lastSuccessfulVertoFxRates = { ...vertoRates };
      cacheWithExpiration.set(
        'vertoRates', 
        vertoRates, 
        isMobile ? 600000 : 300000
      );
      return vertoRates;
    } else {
      // If API returned no valid rates, use default values
      console.log("[vertoRateLoader] API returned no valid rates, using defaults");
      return { ...lastSuccessfulVertoFxRates };
    }
  } catch (error) {
    console.error("[vertoRateLoader] Error fetching VertoFX rates:", error);
    // Always return valid default rates on error
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
  // Don't completely empty, just reset to defaults
  lastSuccessfulVertoFxRates = {
    USD: { buy: 1635, sell: 1600 },
    EUR: { buy: 1870, sell: 1805 },
    GBP: { buy: 2150, sell: 2080 },
    CAD: { buy: 1190, sell: 1140 }
  };
};
