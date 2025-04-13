
import { toast } from "sonner";
import { 
  saveUsdtNgnRate,
  fetchLatestUsdtNgnRate,
  DEFAULT_RATE
} from '@/services/usdt-ngn-service';
import { 
  fetchMarginSettings 
} from '@/services/margin-settings-service';
import { 
  saveHistoricalRates 
} from '@/services/historical-rates-service';
import { getCurrentCostPrices, CurrencyRates } from '@/services/api';
import { logger } from '@/utils/logUtils';

interface UsdtRateUpdaterProps {
  setUsdtNgnRate: (rate: number) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fxRates: Record<string, number>;
  // Make costPrices optional to prevent the type error
  costPrices?: Record<string, number>;
}

export const useUsdtRateUpdater = ({
  setUsdtNgnRate,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fxRates,
  costPrices = {} // Default to empty object if not provided
}: UsdtRateUpdaterProps) => {
  
  // Handle USDT/NGN rate update - now uses the passed rate parameter
  const updateUsdtRate = async (rate: number): Promise<boolean> => {
    logger.debug("Updating USDT/NGN rate:", rate);
    
    if (!rate || isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid rate");
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // First update local state so UI shows the change immediately
      setUsdtNgnRate(rate);
      
      // Save the new rate to database
      const success = await saveUsdtNgnRate(rate);
      
      if (success) {
        setLastUpdated(new Date());
        
        // Get margin settings from database
        const marginSettings = await fetchMarginSettings();
        logger.debug("Fetched margin settings for recalculation:", marginSettings);
        
        let usdMargin = 2.5;
        let otherCurrenciesMargin = 3.0;
        
        if (marginSettings) {
          usdMargin = marginSettings.usd_margin;
          otherCurrenciesMargin = marginSettings.other_currencies_margin;
          
          // Recalculate cost prices with the updated rate
          calculateAllCostPrices(
            usdMargin, 
            otherCurrenciesMargin
          );
        } else {
          logger.warn("Could not fetch margin settings, using defaults");
          calculateAllCostPrices(usdMargin, otherCurrenciesMargin); // Use default values if no settings found
        }
        
        // Save historical rates
        // Wait a brief moment for cost prices to be calculated
        setTimeout(async () => {
          try {
            // Get the latest cost prices that were just calculated
            const currentCostPrices = getCurrentCostPrices();
            
            // Save historical rate data with source="manual" for manual updates
            await saveHistoricalRates(
              rate,
              usdMargin,
              otherCurrenciesMargin,
              fxRates,
              currentCostPrices || {},
              'manual'
            );
            logger.debug("Historical data saved after rate update");
          } catch (error) {
            logger.error("Error saving historical data:", error);
          }
        }, 100);
        
        toast.success("Rate updated and prices recalculated");
        return true;
      } else {
        logger.error("Failed to save USDT/NGN rate");
        toast.error("Failed to update USDT/NGN rate");
        
        // Revert the local state if save failed
        const originalRate = await fetchLatestUsdtNgnRate();
        if (originalRate && originalRate > 0) {
          setUsdtNgnRate(originalRate);
        } else {
          setUsdtNgnRate(DEFAULT_RATE);
        }
        return false;
      }
    } catch (error) {
      logger.error("Error updating USDT/NGN rate:", error);
      toast.error("Failed to update USDT/NGN rate");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateUsdtRate };
};
