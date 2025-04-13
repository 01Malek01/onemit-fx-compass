
import { toast } from "sonner";
import { 
  fetchMarginSettings 
} from '@/services/margin-settings-service';
import { 
  saveHistoricalRates 
} from '@/services/historical-rates-service';
import { CurrencyRates } from '@/services/api';
import { getCurrentCostPrices } from '@/services/api';

// Load margin settings and apply calculations
export const loadAndApplyMarginSettings = async (
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void,
  fxRates: CurrencyRates,
  usdtRate: number
): Promise<boolean> => {
  console.log("[marginUtils] Loading and applying margin settings...");
  
  try {
    // Get margin settings from database
    const marginSettings = await fetchMarginSettings();
    console.log("[marginUtils] Fetched margin settings:", marginSettings);
    
    // Check if we have valid data for calculations
    const validRate = usdtRate && usdtRate > 0;
    const validRates = fxRates && Object.keys(fxRates).length > 0;
    
    if (marginSettings && validRate && validRates) {
      console.log("[marginUtils] Calculating cost prices with fetched data:", {
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
          // Get the latest cost prices that were just calculated
          const currentCostPrices = getCurrentCostPrices();
          
          // Save historical rate data with source="auto" for automatic updates
          if (Object.keys(fxRates).length > 0) {
            await saveHistoricalRates(
              usdtRate,
              marginSettings.usd_margin,
              marginSettings.other_currencies_margin,
              fxRates,
              currentCostPrices,
              'auto'
            );
            console.log("[marginUtils] Historical data saved after auto refresh");
          }
        } catch (error) {
          console.error("[marginUtils] Error saving historical data after auto refresh:", error);
        }
      }, 100);
      
      return true;
    } else {
      console.warn("[marginUtils] Missing data for calculations:", { 
        hasMarginSettings: !!marginSettings, 
        validRate, 
        validRates 
      });
      return false;
    }
  } catch (error) {
    console.error("[marginUtils] Error loading margin settings:", error);
    return false;
  }
};
