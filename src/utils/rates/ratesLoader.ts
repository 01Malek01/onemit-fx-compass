
import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { loadUsdtRate } from './usdtRateLoader';
import { loadCurrencyRates } from './currencyRateLoader';
import { loadVertoFxRates } from './vertoRateLoader';
import { browserStorage } from '@/utils/cacheUtils';

// Cache key for initial load data
const INITIAL_LOAD_CACHE_KEY = 'fx_initial_load_data';

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
  // Try to use cached initial data for ultra-fast startup
  const cachedData = browserStorage.getItem(INITIAL_LOAD_CACHE_KEY);
  if (cachedData) {
    console.log(`[ratesLoader] Using cached initial data`);
    setFxRates(cachedData.fxRates);
    if (cachedData.vertoRates) {
      setVertoFxRates(cachedData.vertoRates);
    }
    
    // Return cached data immediately but still refresh in background
    setTimeout(() => loadFreshDataInBackground(setFxRates, setVertoFxRates), 100);
    return { 
      usdtRate: cachedData.usdtRate, 
      fxRates: cachedData.fxRates,
      success: true
    };
  }
  
  try {
    // Shorter timeout for mobile to avoid blocking UI
    const timeoutMs = isMobile ? 2000 : 4000;
    
    // Load core data with tighter timeout
    const [usdtRate, rates] = await Promise.all([
      Promise.race([
        loadUsdtRate(), 
        new Promise<number>(resolve => setTimeout(() => resolve(1580), 1500))
      ]),
      Promise.race([
        loadCurrencyRates(isMobile),
        new Promise<CurrencyRates>(resolve => setTimeout(() => 
          resolve({ USD: 1.0, EUR: 0.88, GBP: 0.76, CAD: 1.38 }), 1500))
      ])
    ]);
    
    // Set core data immediately to improve perceived performance
    setFxRates(rates);
    
    // Load VertoFX rates immediately to ensure we have them
    const vertoRates = await loadVertoFxRates(isMobile, setVertoFxRates).catch(error => {
      console.warn("[ratesLoader] Error loading VertoFX rates:", error);
      // Return default rates on error
      const defaultRates = {
        USD: { buy: 1635, sell: 1600 },
        EUR: { buy: 1870, sell: 1805 },
        GBP: { buy: 2150, sell: 2080 },
        CAD: { buy: 1190, sell: 1140 }
      };
      setVertoFxRates(defaultRates); // Make sure UI gets updated
      return defaultRates;
    });
    
    // Cache this initial data for future fast loads
    browserStorage.setItem(INITIAL_LOAD_CACHE_KEY, {
      usdtRate,
      fxRates: rates,
      vertoRates,
      timestamp: Date.now()
    }, 60 * 60 * 1000); // 1 hour cache
    
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
const loadFreshDataInBackground = async (
  setFxRates: (rates: CurrencyRates) => void,
  setVertoFxRates: (rates: VertoFXRates) => void
) => {
  try {
    const [rates, vertoRates] = await Promise.all([
      loadCurrencyRates(false).catch(() => null),
      loadVertoFxRates(false, setVertoFxRates).catch(() => null)
    ]);
    
    if (rates) setFxRates(rates);
  } catch (error) {
    console.warn("[ratesLoader] Background refresh failed:", error);
  }
};
