
import { VertoFXRates, fetchVertoFXRates } from '@/services/api';
import { cacheWithExpiration } from '../cacheUtils';
import { raceWithTimeout } from '../apiUtils';

// Local cache for last successful rate data
let lastSuccessfulVertoFxRates: VertoFXRates = {};

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
    const hasValidRates = Object.values(vertoRates).some(rate => 
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
    }
  } catch (error) {
    console.error("[vertoRateLoader] Error fetching VertoFX rates:", error);
  }
  
  // Return cached rates if we have them
  return { ...lastSuccessfulVertoFxRates };
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
  lastSuccessfulVertoFxRates = {};
};
