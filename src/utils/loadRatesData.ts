
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
} from '@/services/currency-rates-service';

// Local cache for last successful rate data
let lastSuccessfulFxRates: CurrencyRates = {};
let lastSuccessfulVertoFxRates: VertoFXRates = {};
let lastSuccessfulUsdtRate: number = 0;

// Load rates from API and database
export const loadRatesData = async (
  setFxRates: (rates: CurrencyRates) => void,
  setVertoFxRates: (rates: VertoFXRates) => void,
  setIsLoading: (loading: boolean) => void
): Promise<{ 
  usdtRate: number, 
  fxRates: CurrencyRates, 
  success: boolean 
}> => {
  console.log("[loadRatesData] Loading rates data...");
  let loadSuccess = true;
  
  try {
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
      apiRates = await fetchExchangeRates(supportedCurrencies);
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
      
      // Save to database for persistence
      try {
        const saved = await saveCurrencyRates(rates);
        console.log("[loadRatesData] Saved currency rates to DB:", saved);
      } catch (saveError) {
        console.error("[loadRatesData] Failed to save rates to DB:", saveError);
        // Continue as we still have the rates in memory
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
    
    // Fetch VertoFX rates (these are always from API as they're comparison only)
    let vertoRates: VertoFXRates = {};
    try {
      vertoRates = await fetchVertoFXRates();
      console.log("[loadRatesData] Fetched VertoFX rates:", vertoRates);
      
      // Check if we got valid rates
      const hasValidRates = Object.values(vertoRates).some(rate => 
        (rate.buy > 0 || rate.sell > 0)
      );
      
      if (hasValidRates) {
        lastSuccessfulVertoFxRates = { ...vertoRates };
      } else {
        console.warn("[loadRatesData] Invalid VertoFX rates, using cached rates");
        vertoRates = { ...lastSuccessfulVertoFxRates };
        loadSuccess = false;
      }
    } catch (vertoError) {
      console.error("[loadRatesData] Error fetching VertoFX rates:", vertoError);
      vertoRates = { ...lastSuccessfulVertoFxRates };
      loadSuccess = false;
    }
    
    setVertoFxRates(vertoRates);
    
    return { 
      usdtRate, 
      fxRates: rates,
      success: loadSuccess
    };
  } catch (error) {
    console.error("[loadRatesData] Critical error loading rates data:", error);
    toast.error("Failed to load rates data", {
      description: "Using fallback values - please try refreshing"
    });
    
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
