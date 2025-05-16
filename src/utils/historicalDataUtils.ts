
import { 
  saveHistoricalRates 
} from '@/services/historical-rates-service';
import { 
  fetchMarginSettings 
} from '@/services/margin-settings-service';
import { getCurrentCostPrices, CurrencyRates } from '@/services/api';

// Save historical rates data
export const saveHistoricalRatesData = async (
  fxRates: CurrencyRates, 
  usdtRate: number
): Promise<boolean> => {
  if (Object.keys(fxRates).length > 0 && usdtRate && usdtRate > 0) {
    try {
      // Get current margin settings
      const marginSettings = await fetchMarginSettings();
      if (!marginSettings) {
        console.warn("[historicalDataUtils] No margin settings found for historical data");
        return false;
      }
      
      // Get current cost prices
      const costPrices = getCurrentCostPrices();
      if (Object.keys(costPrices).length === 0) {
        console.warn("[historicalDataUtils] No cost prices available for historical data");
        return false;
      }
      
      // Save rates to historical table for analytics
      const saved = await saveHistoricalRates(
        usdtRate,
        marginSettings.usd_margin,
        marginSettings.other_currencies_margin,
        fxRates,
        costPrices,
        'refresh'
      );
      
      console.log("[historicalDataUtils] Saved historical rates:", saved);
      return saved;
    } catch (error) {
      console.error("[historicalDataUtils] Error saving historical rates:", error);
      return false;
    }
  }
  return false;
};
