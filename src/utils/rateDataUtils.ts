import { toast } from "sonner";
import { 
  fetchFxRates, 
  fetchVertoFXRates,
  CurrencyRates,
  VertoFXRates 
} from '@/services/api';
import { 
  fetchLatestUsdtNgnRate,
  DEFAULT_RATE
} from '@/services/usdt-ngn-service';
import { 
  fetchMarginSettings 
} from '@/services/margin-settings-service';
import { 
  fetchCurrencyRates, 
  saveCurrencyRates,
  fetchExchangeRates
} from '@/services/currency-rates-service';
import { 
  saveHistoricalRates 
} from '@/services/historical-rates-service';

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
  console.log("[rateDataUtils] Loading rates data...");
  
  try {
    // Fetch USDT/NGN rate from database
    const usdtRate = await fetchLatestUsdtNgnRate();
    console.log("[rateDataUtils] Fetched USDT/NGN rate from database:", usdtRate);
    
    // Define the currencies we need rates for
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'CAD']; 
    
    // Fetch fresh rates from API
    console.log("[rateDataUtils] Fetching rates from API for currencies:", supportedCurrencies);
    const apiRates = await fetchExchangeRates(supportedCurrencies);
    console.log("[rateDataUtils] Fetched rates from API:", apiRates);
    
    // Process the rates - API returns rates against USD, but we need to ensure USD is 1.0
    let rates: CurrencyRates = {};
    if (Object.keys(apiRates).length > 0) {
      // Ensure USD is included with rate 1.0
      rates = { ...apiRates, USD: 1.0 };
      
      // Save to database for persistence
      const saved = await saveCurrencyRates(rates);
      console.log("[rateDataUtils] Saved currency rates to DB:", saved);
    } else {
      // Fallback: Get rates from database if API fails
      console.log("[rateDataUtils] API fetch failed, getting rates from DB");
      rates = await fetchCurrencyRates();
      console.log("[rateDataUtils] Fetched currency rates from DB:", rates);
      
      // Ensure USD exists in rates
      if (!rates.USD) {
        rates.USD = 1.0;
      }
    }
    
    setFxRates(rates);
    
    // Fetch VertoFX rates (these are always from API as they're comparison only)
    const vertoRates = await fetchVertoFXRates();
    console.log("[rateDataUtils] Fetched VertoFX rates:", vertoRates);
    setVertoFxRates(vertoRates);
    
    return { 
      usdtRate: usdtRate || DEFAULT_RATE, 
      fxRates: rates,
      success: true
    };
  } catch (error) {
    console.error("[rateDataUtils] Error loading rates data:", error);
    toast.error("Failed to load rates data");
    return { 
      usdtRate: DEFAULT_RATE, 
      fxRates: {},
      success: false
    };
  }
};

// Load margin settings and apply calculations
export const loadAndApplyMarginSettings = async (
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void,
  fxRates: CurrencyRates,
  usdtRate: number
): Promise<boolean> => {
  console.log("[rateDataUtils] Loading and applying margin settings...");
  
  try {
    // Get margin settings from database
    const marginSettings = await fetchMarginSettings();
    console.log("[rateDataUtils] Fetched margin settings:", marginSettings);
    
    // Check if we have valid data for calculations
    const validRate = usdtRate && usdtRate > 0;
    const validRates = fxRates && Object.keys(fxRates).length > 0;
    
    if (marginSettings && validRate && validRates) {
      console.log("[rateDataUtils] Calculating cost prices with fetched data:", {
        usdMargin: marginSettings.usd_margin,
        otherCurrenciesMargin: marginSettings.other_currencies_margin,
        usdtRate
      });
      
      calculateAllCostPrices(
        marginSettings.usd_margin, 
        marginSettings.other_currencies_margin
      );
      
      // We need to wait a tick for React to update the cost prices
      setTimeout(async () => {
        try {
          // We need to get the cost prices from our state
          // This will be added as a parameter in a future update
          const costPrices = {}; // This will be filled in another PR
          
          // Save historical rate data with source="auto" for automatic updates
          if (Object.keys(fxRates).length > 0) {
            await saveHistoricalRates(
              usdtRate,
              marginSettings.usd_margin,
              marginSettings.other_currencies_margin,
              fxRates,
              {}, // Cost prices will be populated in a future PR
              'auto'
            );
            console.log("[rateDataUtils] Historical data saved after auto refresh");
          }
        } catch (error) {
          console.error("[rateDataUtils] Error saving historical data after auto refresh:", error);
        }
      }, 100);
      
      return true;
    } else {
      console.warn("[rateDataUtils] Missing data for calculations:", { 
        hasMarginSettings: !!marginSettings, 
        validRate, 
        validRates 
      });
      return false;
    }
  } catch (error) {
    console.error("[rateDataUtils] Error loading margin settings:", error);
    return false;
  }
};

// Save historical rates data
export const saveHistoricalRatesData = async (
  fxRates: CurrencyRates, 
  usdtRate: number
): Promise<boolean> => {
  if (Object.keys(fxRates).length > 0 && usdtRate && usdtRate > 0) {
    try {
      // Save rates to historical table for analytics
      const saved = await saveHistoricalRates(fxRates, usdtRate);
      console.log("[rateDataUtils] Saved historical rates:", saved);
      return saved;
    } catch (error) {
      console.error("[rateDataUtils] Error saving historical rates:", error);
      return false;
    }
  }
  return false;
};
