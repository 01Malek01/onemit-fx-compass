
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
  saveCurrencyRates,
  fetchExchangeRates
} from '@/services/currency-rates';

// Local cache for last successful rate data
let lastSuccessfulFxRates: CurrencyRates = {};
let lastSuccessfulVertoFxRates: VertoFXRates = {};
let lastSuccessfulUsdtRate: number = 0;

// Add a simple in-memory cache with cache expiry
const cacheWithExpiration = {
  data: {} as Record<string, any>,
  timestamps: {} as Record<string, number>,
  
  set(key: string, value: any, expiryMs = 300000) { // Default 5 minute expiry
    this.data[key] = value;
    this.timestamps[key] = Date.now() + expiryMs;
  },
  
  get(key: string) {
    const now = Date.now();
    if (this.timestamps[key] && now < this.timestamps[key]) {
      return this.data[key];
    }
    return null;
  },
  
  isValid(key: string) {
    const now = Date.now();
    return this.timestamps[key] && now < this.timestamps[key];
  }
};

// Load rates from API and database
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
    // Check memory cache first for ultra-fast loading on mobile
    if (isMobile) {
      const cachedRates = cacheWithExpiration.get('fxRates');
      const cachedVertoRates = cacheWithExpiration.get('vertoRates');
      
      if (cachedRates) {
        console.log("[loadRatesData] Using in-memory cached FX rates for instant mobile loading");
        setFxRates(cachedRates);
      }
      
      if (cachedVertoRates) {
        console.log("[loadRatesData] Using in-memory cached Verto rates for instant mobile loading");
        setVertoFxRates(cachedVertoRates);
      }
      
      if (cachedRates && cachedVertoRates) {
        // Don't return yet - continue loading fresh data in background
        // but user gets instant feedback
      }
    }
    
    // Fetch USDT/NGN rate from database
    let usdtRate = await fetchLatestUsdtNgnRate().catch(error => {
      console.error("[loadRatesData] Error fetching USDT/NGN rate:", error);
      loadSuccess = false;
      return lastSuccessfulUsdtRate > 0 ? lastSuccessfulUsdtRate : DEFAULT_RATE;
    });
    
    if (usdtRate > 0) {
      lastSuccessfulUsdtRate = usdtRate;
    } else {
      usdtRate = lastSuccessfulUsdtRate > 0 ? lastSuccessfulUsdtRate : DEFAULT_RATE;
      loadSuccess = false;
    }
    
    console.log("[loadRatesData] Using USDT/NGN rate:", usdtRate);
    
    // Define the currencies we need rates for
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD']; 
    
    // Fetch fresh rates from API
    console.log("[loadRatesData] Fetching rates from API for currencies:", supportedCurrencies);
    let apiRates: CurrencyRates = {};
    
    try {
      // Use a much shorter timeout for mobile - 2 seconds max wait
      const apiTimeout = isMobile ? 2000 : 5000;
      
      apiRates = await fetchExchangeRates(supportedCurrencies, apiTimeout);
      console.log("[loadRatesData] Fetched rates from API:", apiRates);
    } catch (apiError) {
      console.error("[loadRatesData] Error fetching from API:", apiError);
      loadSuccess = false;
    }
    
    // Process the rates - API returns rates against USD, but we need to ensure USD is 1.0
    let rates: CurrencyRates = {};
    if (Object.keys(apiRates).length > 0) {
      // Ensure USD is included with rate 1.0
      rates = { ...apiRates, USD: 1.0 };
      
      // Update memory cache
      cacheWithExpiration.set('fxRates', rates, isMobile ? 600000 : 300000); // 10min mobile, 5min desktop
      
      // Save to database for persistence - skip on mobile to improve performance
      if (!isMobile) {
        try {
          const saved = await saveCurrencyRates(rates);
          console.log("[loadRatesData] Saved currency rates to DB:", saved);
        } catch (saveError) {
          console.error("[loadRatesData] Failed to save rates to DB:", saveError);
          // Continue as we still have the rates in memory
        }
      } else {
        console.log("[loadRatesData] Skipping DB save on mobile for better performance");
      }
      
      // Update our last successful rates cache
      lastSuccessfulFxRates = { ...rates };
    } else {
      // Fallback: Get rates from database if API fails
      console.log("[loadRatesData] API fetch failed or empty, getting rates from DB");
      try {
        rates = await fetchCurrencyRates();
        console.log("[loadRatesData] Fetched currency rates from DB:", rates);
      } catch (dbError) {
        console.error("[loadRatesData] Failed to fetch rates from DB:", dbError);
        loadSuccess = false;
        
        // Use last successful rates if available, or default values
        if (Object.keys(lastSuccessfulFxRates).length > 0) {
          rates = { ...lastSuccessfulFxRates };
          console.log("[loadRatesData] Using cached rates:", rates);
        } else {
          rates = { USD: 1.0, EUR: 0.88, GBP: 0.76, CAD: 1.38 };
          console.log("[loadRatesData] Using default hardcoded rates:", rates);
        }
      }
      
      // Ensure USD exists in rates
      if (!rates.USD) {
        rates.USD = 1.0;
      }
    }
    
    setFxRates(rates);
    
    // Fetch VertoFX rates - use a simplified approach on mobile
    let vertoRates: VertoFXRates = {};
    try {
      // On mobile, use cached values for immediate display, then update in background
      if (isMobile && Object.keys(lastSuccessfulVertoFxRates).length > 0) {
        console.log("[loadRatesData] Mobile detected, using cached VertoFX rates for faster load");
        vertoRates = { ...lastSuccessfulVertoFxRates };
        setVertoFxRates(vertoRates);
        
        // In the background, try to load fresh rates with a timeout
        setTimeout(async () => {
          try {
            const freshRates = await Promise.race([
              fetchVertoFXRates(),
              new Promise<VertoFXRates>((_, reject) => 
                setTimeout(() => reject(new Error('VertoFX timeout')), 3000)
              ) as Promise<VertoFXRates>
            ]);
            
            // If successful, update the display with fresh rates
            if (freshRates && Object.keys(freshRates).length > 0) {
              console.log("[loadRatesData] Background update of VertoFX rates successful");
              setVertoFxRates(freshRates);
              lastSuccessfulVertoFxRates = { ...freshRates };
              cacheWithExpiration.set('vertoRates', freshRates, 600000); // 10min cache
            }
          } catch (error) {
            console.log("[loadRatesData] Background update of VertoFX rates failed:", error);
            // No need to do anything - we're already showing cached rates
          }
        }, 100);
      } else {
        // Non-mobile or no cached rates available - fetch directly
        vertoRates = await fetchVertoFXRates();
        console.log("[loadRatesData] Fetched VertoFX rates:", vertoRates);
      
        // Check if we got valid rates
        const hasValidRates = Object.values(vertoRates).some(rate => 
          (rate.buy > 0 || rate.sell > 0)
        );
        
        if (hasValidRates) {
          lastSuccessfulVertoFxRates = { ...vertoRates };
          cacheWithExpiration.set('vertoRates', vertoRates, isMobile ? 600000 : 300000);
        } else {
          console.warn("[loadRatesData] Invalid VertoFX rates, using cached rates");
          vertoRates = { ...lastSuccessfulVertoFxRates };
          loadSuccess = false;
        }
        
        setVertoFxRates(vertoRates);
      }
    } catch (vertoError) {
      console.error("[loadRatesData] Error fetching VertoFX rates:", vertoError);
      vertoRates = { ...lastSuccessfulVertoFxRates };
      setVertoFxRates(vertoRates);
      loadSuccess = false;
    }
    
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
