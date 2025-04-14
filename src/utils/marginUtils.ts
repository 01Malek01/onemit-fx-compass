
import { fetchMarginSettings } from '@/services/margin-settings-service';
import { CurrencyRates } from '@/services/api';
import { logger } from '@/utils/logUtils';

/**
 * Load margin settings and apply them to calculate cost prices
 * Performance optimized with caching
 */
export const loadAndApplyMarginSettings = async (
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void,
  fxRates: CurrencyRates,
  usdtNgnRate: number | null
): Promise<boolean> => {
  try {
    logger.debug("[marginUtils] Loading margin settings");
    
    // Only proceed if we have a valid USDT/NGN rate
    if (!usdtNgnRate || isNaN(Number(usdtNgnRate)) || usdtNgnRate <= 0) {
      logger.warn("[marginUtils] Cannot apply margin settings: Invalid USDT/NGN rate:", usdtNgnRate);
      return false;
    }
    
    // Fetch margin settings from database
    const settings = await fetchMarginSettings();
    
    if (settings) {
      logger.debug("[marginUtils] Margin settings loaded:", settings);
      // Calculate cost prices with the loaded margins
      calculateAllCostPrices(settings.usd_margin, settings.other_currencies_margin);
      return true;
    } else {
      logger.warn("[marginUtils] No margin settings found, using defaults");
      // Use default margins if no settings found
      calculateAllCostPrices(2.5, 3.0);
      return false;
    }
  } catch (error) {
    logger.error("[marginUtils] Error loading margin settings:", error);
    // Use default margins in case of error
    calculateAllCostPrices(2.5, 3.0);
    return false;
  }
};
