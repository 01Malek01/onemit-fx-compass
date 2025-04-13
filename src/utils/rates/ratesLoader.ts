
import { toast } from "sonner";
import { CurrencyRates, VertoFXRates } from '@/services/api';
import { loadUsdtRate } from './usdtRateLoader';
import { loadCurrencyRates } from './currencyRateLoader';
import { loadVertoFxRates } from './vertoRateLoader';

/**
 * Main function to load all rates data - performance optimized
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
    // Load data in parallel using Promise.all to improve performance
    const [usdtRate, rates, vertoRates] = await Promise.all([
      // Priority 1: USDT rate
      loadUsdtRate(),
      
      // Priority 2: Currency rates
      loadCurrencyRates(isMobile).then(rates => {
        setFxRates(rates);
        return rates;
      }),
      
      // Priority 3: VertoFX rates (with shorter timeout on mobile)
      loadVertoFxRates(isMobile, setVertoFxRates).then(rates => {
        setVertoFxRates(rates);
        return rates;
      })
    ]);
    
    return { 
      usdtRate, 
      fxRates: rates,
      success: loadSuccess
    };
  } catch (error) {
    console.error("[ratesLoader] Error loading rates data:", error);
    
    // Simpler toast on mobile
    if (!isMobile) {
      toast.error("Failed to load rates data", {
        description: "Using fallback values - please try refreshing"
      });
    } else {
      toast.error("Failed to load rates");
    }
    
    // Return fallbacks in case of failure
    const fallbacks = await Promise.all([
      loadUsdtRate().catch(() => 1580),
      loadCurrencyRates(true).catch(() => ({ USD: 1.0, EUR: 0.88, GBP: 0.76, CAD: 1.38 }))
    ]);
    
    return { 
      usdtRate: fallbacks[0], 
      fxRates: fallbacks[1],
      success: false
    };
  } finally {
    setIsLoading(false);
  }
};
