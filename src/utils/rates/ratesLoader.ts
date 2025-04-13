
import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { loadUsdtRate } from './usdtRateLoader';
import { loadCurrencyRates } from './currencyRateLoader';
import { loadVertoFxRates } from './vertoRateLoader';
import { browserStorage } from '@/utils/cacheUtils';
import { isLikelySlowDevice } from '@/utils/deviceUtils';

// Cache key for initial load data
const INITIAL_LOAD_CACHE_KEY = 'fx_initial_load_data';

/**
 * Optimized function to load all rates data with aggressive caching
 * and mobile optimizations
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
  // Try to use cached initial data for ultra-fast startup
  const cachedData = browserStorage.getItem(INITIAL_LOAD_CACHE_KEY);
  
  // For mobile, we're more aggressive with cache usage
  const shouldUseCacheOnly = isMobile && isLikelySlowDevice();
  
  if (cachedData) {
    console.log(`[ratesLoader] Using cached initial data ${shouldUseCacheOnly ? '(mobile optimized mode)' : ''}`);
    setFxRates(cachedData.fxRates);
    if (cachedData.vertoRates) {
      setVertoFxRates(cachedData.vertoRates);
    }
    
    // Return cached data immediately
    // For slow mobile connections, we might skip background refresh entirely
    if (!shouldUseCacheOnly) {
      // For regular connections, refresh in background after a short delay
      const refreshDelay = isMobile ? 3000 : 100; // Longer delay for mobile to prioritize UI
      setTimeout(() => loadFreshDataInBackground(setFxRates, setVertoFxRates, isMobile), refreshDelay);
    }
    
    return { 
      usdtRate: cachedData.usdtRate, 
      fxRates: cachedData.fxRates,
      success: true
    };
  }
  
  try {
    // Define default VertoFX rates that we'll use if API fails
    const defaultVertoRates: VertoFXRates = {
      USD: { buy: 1635, sell: 1600 },
      EUR: { buy: 1870, sell: 1805 },
      GBP: { buy: 2150, sell: 2080 },
      CAD: { buy: 1190, sell: 1140 }
    };

    // Set default rates immediately to ensure UI shows something
    setVertoFxRates(defaultVertoRates);
    
    // Adaptive timeouts based on device type
    const timeoutMs = isMobile ? 3500 : 5000;
    
    // Load core data with adaptive timeouts
    const [usdtRate, rates] = await Promise.all([
      Promise.race([
        loadUsdtRate(), 
        new Promise<number>(resolve => setTimeout(() => resolve(1580), isMobile ? 2000 : 3000))
      ]),
      Promise.race([
        loadCurrencyRates(isMobile),
        new Promise<CurrencyRates>(resolve => setTimeout(() => 
          resolve({ USD: 1.0, EUR: 0.88, GBP: 0.76, CAD: 1.38 }), isMobile ? 2000 : 3000))
      ])
    ]);
    
    // Set core data immediately to improve perceived performance
    setFxRates(rates);
    
    // For mobile, we skip some non-essential API calls if connection is slow
    if (isMobile && isLikelySlowDevice()) {
      console.log("[ratesLoader] Using lightweight loading strategy for slow mobile connection");
      
      // Cache this initial data for future fast loads
      browserStorage.setItem(INITIAL_LOAD_CACHE_KEY, {
        usdtRate,
        fxRates: rates,
        vertoRates: defaultVertoRates,
        timestamp: Date.now()
      }, 10 * 60 * 1000); // 10 minute cache for slow connections
      
      return { 
        usdtRate, 
        fxRates: rates,
        success: true
      };
    }
    
    // For desktop or fast mobile connections, load VertoFX rates
    const vertoRates = await loadVertoFxRates(isMobile, setVertoFxRates).catch(error => {
      console.warn("[ratesLoader] Error loading VertoFX rates:", error);
      // Return default rates on error
      return defaultVertoRates;
    });
    
    // Cache this initial data for future fast loads
    browserStorage.setItem(INITIAL_LOAD_CACHE_KEY, {
      usdtRate,
      fxRates: rates,
      vertoRates,
      timestamp: Date.now()
    }, 60 * 60 * 1000); // 1 hour cache for normal connections
    
    return { 
      usdtRate, 
      fxRates: rates,
      success: true
    };
  } catch (error) {
    console.error("[ratesLoader] Error loading rates data:", error);
    
    // Simplified error handling for faster recovery
    const fallbackRates = { USD: 1.0, EUR: 0.88, GBP: 0.76, CAD: 1.38 };
    setFxRates(fallbackRates);
    
    // Make sure we have default verto rates if main loading fails
    const defaultVertoRates = {
      USD: { buy: 1635, sell: 1600 },
      EUR: { buy: 1870, sell: 1805 },
      GBP: { buy: 2150, sell: 2080 },
      CAD: { buy: 1190, sell: 1140 }
    };
    setVertoFxRates(defaultVertoRates);
    
    return { 
      usdtRate: 1580, 
      fxRates: fallbackRates,
      success: false
    };
  } finally {
    setIsLoading(false);
  }
};

// Background refresh function to update data after initial render
// with mobile-specific optimizations
const loadFreshDataInBackground = async (
  setFxRates: (rates: CurrencyRates) => void,
  setVertoFxRates: (rates: VertoFXRates) => void,
  isMobile: boolean = false
) => {
  try {
    // For mobile, we can be more selective about what we refresh
    if (isMobile) {
      // On mobile, prioritize currency rates over VertoFX rates
      const rates = await loadCurrencyRates(true).catch(() => null);
      if (rates) setFxRates(rates);
      
      // Only load VertoFX rates if not on a slow connection
      if (!isLikelySlowDevice()) {
        const vertoRates = await loadVertoFxRates(true, setVertoFxRates).catch(() => null);
      }
    } else {
      // On desktop, load everything in parallel
      const [rates, vertoRates] = await Promise.all([
        loadCurrencyRates(false).catch(() => null),
        loadVertoFxRates(false, setVertoFxRates).catch(() => null)
      ]);
      
      if (rates) setFxRates(rates);
    }
  } catch (error) {
    console.warn("[ratesLoader] Background refresh failed:", error);
  }
};

