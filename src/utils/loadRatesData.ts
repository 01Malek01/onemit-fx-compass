
import { toast } from "sonner";
import { 
  CurrencyRates,
  VertoFXRates,
  fetchFxRates, 
  fetchVertoFXRates
} from '@/services/api';
import { 
  fetchLatestUsdtNgnRate,
  DEFAULT_RATE
} from '@/services/usdt-ngn-service';
import { 
  fetchCurrencyRates, 
  saveCurrencyRates
} from '@/services/currency-rates';
import { cacheWithExpiration } from './cacheUtils';
import { raceWithTimeout } from './apiUtils';

// Local cache for last successful rate data
let lastSuccessfulFxRates: CurrencyRates = {};
let lastSuccessfulVertoFxRates: VertoFXRates = {};
let lastSuccessfulUsdtRate: number = 0;

/**
 * Load USDT/NGN rate with fallbacks
 */
export const loadUsdtRate = async (): Promise<number> => {
  try {
    console.log("[loadRatesData] Fetching USDT/NGN rate from database");
    const usdtRate = await fetchLatestUsdtNgnRate();
    
    if (usdtRate > 0) {
      lastSuccessfulUsdtRate = usdtRate;
      return usdtRate;
    }
  } catch (error) {
    console.error("[loadRatesData] Error fetching USDT/NGN rate:", error);
  }
  
  // Return last successful rate or default
  return lastSuccessfulUsdtRate > 0 ? lastSuccessfulUsdtRate : DEFAULT_RATE;
};

/**
 * Load currency rates with fallbacks
 */
export const loadCurrencyRates = async (
  isMobile: boolean = false
): Promise<CurrencyRates> => {
  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD']; 
  
  // Check memory cache first for ultra-fast loading on mobile
  if (isMobile) {
    const cachedRates = cacheWithExpiration.get('fxRates');
    if (cachedRates) {
      console.log("[loadRatesData] Using in-memory cached FX rates for instant mobile loading");
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
      'fxRates', 
      rates, 
      isMobile ? 600000 : 300000 // 10min mobile, 5min desktop
    ); 
    
    // Save to database for persistence - skip on mobile to improve performance
    if (!isMobile) {
      saveCurrencyRates(rates).catch(err => {
        console.error("[loadRatesData] Failed to save rates to DB:", err);
      });
    }
    
    // Update our last successful rates cache
    lastSuccessfulFxRates = { ...rates };
    return rates;
  } catch (error) {
    console.error("[loadRatesData] Error fetching rates from API:", error);
    
    // Fallback: Get rates from database if API fails
    try {
      const dbRates = await fetchCurrencyRates();
      if (Object.keys(dbRates).length > 0) {
        const rates = { ...dbRates, USD: 1.0 };
        return rates;
      }
    } catch (dbError) {
      console.error("[loadRatesData] Failed to fetch rates from DB:", dbError);
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
      console.log("[loadRatesData] Using cached VertoFX rates for immediate display");
      
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
          console.log("[loadRatesData] Background update of VertoFX rates failed:", error);
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
    console.error("[loadRatesData] Error fetching VertoFX rates:", error);
  }
  
  // Return cached rates if we have them
  return { ...lastSuccessfulVertoFxRates };
};

/**
 * Main function to load all rates data
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
  console.log(`[loadRatesData] Loading rates data... (mobile: ${isMobile})`);
  let loadSuccess = true;
  
  try {
    // Load USDT rate
    const usdtRate = await loadUsdtRate();
    console.log("[loadRatesData] Using USDT/NGN rate:", usdtRate);
    
    // Load currency rates
    const rates = await loadCurrencyRates(isMobile);
    setFxRates(rates);
    
    // Load VertoFX rates
    const vertoRates = await loadVertoFxRates(isMobile, setVertoFxRates);
    setVertoFxRates(vertoRates);
    
    return { 
      usdtRate, 
      fxRates: rates,
      success: loadSuccess
    };
  } catch (error) {
    console.error("[loadRatesData] Critical error loading rates data:", error);
    
    // Simpler toast on mobile
    if (!isMobile) {
      toast.error("Failed to load rates data", {
        description: "Using fallback values - please try refreshing"
      });
    } else {
      toast.error("Failed to load rates");
    }
    
    // Use any cached data we have
    setFxRates(lastSuccessfulFxRates);
    setVertoFxRates(lastSuccessfulVertoFxRates);
    
    return { 
      usdtRate: lastSuccessfulUsdtRate > 0 ? lastSuccessfulUsdtRate : DEFAULT_RATE, 
      fxRates: lastSuccessfulFxRates,
      success: false
    };
  } finally {
    setIsLoading(false);
  }
};
