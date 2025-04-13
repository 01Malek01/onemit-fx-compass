
import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { loadAndApplyMarginSettings, saveHistoricalRatesData } from '@/utils/index';
import { loadUsdtRate } from './usdtRateLoader';
import { loadCurrencyRates } from './currencyRateLoader';
import { loadVertoFxRates } from './vertoRateLoader';

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
  console.log(`[ratesLoader] Loading rates data... (mobile: ${isMobile})`);
  let loadSuccess = true;
  
  try {
    // Load USDT rate
    const usdtRate = await loadUsdtRate();
    console.log("[ratesLoader] Using USDT/NGN rate:", usdtRate);
    
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
    console.error("[ratesLoader] Critical error loading rates data:", error);
    
    // Simpler toast on mobile
    if (!isMobile) {
      toast.error("Failed to load rates data", {
        description: "Using fallback values - please try refreshing"
      });
    } else {
      toast.error("Failed to load rates");
    }
    
    return { 
      usdtRate: await loadUsdtRate(), 
      fxRates: await loadCurrencyRates(isMobile),
      success: false
    };
  } finally {
    setIsLoading(false);
  }
};
