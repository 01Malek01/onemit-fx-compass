
import { 
  saveHistoricalRates,
  runDailyAggregation 
} from '@/services/historical-rates-service';
import { 
  fetchMarginSettings 
} from '@/services/margin-settings-service';
import { getCurrentCostPrices, CurrencyRates } from '@/services/api';
import { logger } from '@/utils/logUtils';

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
        logger.warn("[historicalDataUtils] No margin settings found for historical data");
        return false;
      }
      
      // Get current cost prices
      const costPrices = getCurrentCostPrices();
      if (Object.keys(costPrices).length === 0) {
        logger.warn("[historicalDataUtils] No cost prices available for historical data");
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
      
      logger.debug("[historicalDataUtils] Saved historical rates:", saved);
      return saved;
    } catch (error) {
      logger.error("[historicalDataUtils] Error saving historical rates:", error);
      return false;
    }
  }
  return false;
};

/**
 * Trigger daily aggregation of historical rates manually
 * This can be used when an admin wants to clean up historical data
 */
export const aggregateHistoricalRates = async (): Promise<boolean> => {
  try {
    const success = await runDailyAggregation();
    if (success) {
      logger.info("[historicalDataUtils] Historical rates aggregation completed");
      return true;
    } else {
      logger.warn("[historicalDataUtils] Historical rates aggregation failed");
      return false;
    }
  } catch (error) {
    logger.error("[historicalDataUtils] Error aggregating historical rates:", error);
    return false;
  }
};
