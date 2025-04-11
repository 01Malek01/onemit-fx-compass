
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
  saveCurrencyRates 
} from '@/services/currency-rates-service';
import { 
  saveHistoricalRates 
} from '@/services/historical-rates-service';

// Load rates from database or API
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
    
    // First try to get FX rates from database
    let rates = await fetchCurrencyRates();
    console.log("[rateDataUtils] Fetched currency rates from DB:", rates);
    
    // If no rates in DB, fetch from API and save to database
    if (!rates || Object.keys(rates).length === 0) {
      console.log("[rateDataUtils] No rates in DB, fetching from API...");
      rates = await fetchFxRates();
      console.log("[rateDataUtils] Fetched FX rates from API:", rates);
      
      if (Object.keys(rates).length > 0) {
        const saved = await saveCurrencyRates(rates);
        console.log("[rateDataUtils] Saved currency rates to DB:", saved);
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
