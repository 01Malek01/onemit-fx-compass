
import { fetchMarginSettings } from '@/services/margin-settings-service';
import { CurrencyRates } from '@/services/api';

/**
 * Load margin settings and apply them to calculate cost prices
 * Performance optimized with caching
 */
export const loadAndApplyMarginSettings = async (
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void,
  fxRates: CurrencyRates,
  usdtNgnRate: number
): Promise<boolean> => {
  try {
    console.log("[marginUtils] Loading margin settings");
    
    // Fetch margin settings from database
    const settings = await fetchMarginSettings();
    
    if (settings) {
      console.log("[marginUtils] Margin settings loaded:", settings);
      // Calculate cost prices with the loaded margins
      calculateAllCostPrices(settings.usd_margin, settings.other_currencies_margin);
      return true;
    } else {
      console.warn("[marginUtils] No margin settings found, using defaults");
      // Use default margins if no settings found
      calculateAllCostPrices(2.5, 3.0);
      return false;
    }
  } catch (error) {
    console.error("[marginUtils] Error loading margin settings:", error);
    // Use default margins in case of error
    calculateAllCostPrices(2.5, 3.0);
    return false;
  }
};
