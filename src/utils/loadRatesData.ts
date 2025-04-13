
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
  
  try {
    // Fetch USDT/NGN rate from database
    const usdtRate = await fetchLatestUsdtNgnRate();
    console.log("[loadRatesData] Fetched USDT/NGN rate from database:", usdtRate);
    
    // Define the currencies we need rates for
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD']; 
    
    // Fetch fresh rates from API
    console.log("[loadRatesData] Fetching rates from API for currencies:", supportedCurrencies);
    const apiRates = await fetchExchangeRates(supportedCurrencies);
    console.log("[loadRatesData] Fetched rates from API:", apiRates);
    
    // Process the rates - API returns rates against USD, but we need to ensure USD is 1.0
    let rates: CurrencyRates = {};
    if (Object.keys(apiRates).length > 0) {
      // Ensure USD is included with rate 1.0
      rates = { ...apiRates, USD: 1.0 };
      
      // Save to database for persistence
      const saved = await saveCurrencyRates(rates);
      console.log("[loadRatesData] Saved currency rates to DB:", saved);
    } else {
      // Fallback: Get rates from database if API fails
      console.log("[loadRatesData] API fetch failed, getting rates from DB");
      rates = await fetchCurrencyRates();
      console.log("[loadRatesData] Fetched currency rates from DB:", rates);
      
      // Ensure USD exists in rates
      if (!rates.USD) {
        rates.USD = 1.0;
      }
    }
    
    setFxRates(rates);
    
    // Fetch VertoFX rates (these are always from API as they're comparison only)
    const vertoRates = await fetchVertoFXRates();
    console.log("[loadRatesData] Fetched VertoFX rates:", vertoRates);
    setVertoFxRates(vertoRates);
    
    return { 
      usdtRate: usdtRate || DEFAULT_RATE, 
      fxRates: rates,
      success: true
    };
  } catch (error) {
    console.error("[loadRatesData] Error loading rates data:", error);
    toast.error("Failed to load rates data");
    return { 
      usdtRate: DEFAULT_RATE, 
      fxRates: {},
      success: false
    };
  }
};
