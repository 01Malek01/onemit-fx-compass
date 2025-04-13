
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
  
  // Improved validation for USDT rate updates
  const updateUsdtRate = async (rate: number | string): Promise<boolean> => {
    // Improved input validation
    const numericRate = typeof rate === 'string' ? parseFloat(rate) : rate;
    
    console.log("[useUsdtRateUpdater] Updating USDT/NGN rate:", numericRate);
    
    // Enhanced validation with detailed errors
    if (isNaN(numericRate)) {
      toast.error("Invalid rate format", {
        description: "Please enter a valid number"
      });
      return false;
    }
    
    if (numericRate <= 0) {
      toast.error("Rate must be greater than zero", {
        description: "Please enter a positive value"
      });
      return false;
    }
    
    setIsLoading(true);
    
    try {
      // First update local state so UI shows the change immediately
      setUsdtNgnRate(numericRate);
      
      // Save the new rate to database
      const success = await saveUsdtNgnRate(numericRate);
      console.log("[useUsdtRateUpdater] USDT/NGN rate saved to database:", success);
      
      if (success) {
        setLastUpdated(new Date());
        
        try {
          // Get margin settings from database with improved error handling
          const marginSettings = await fetchMarginSettings();
          console.log("[useUsdtRateUpdater] Fetched margin settings for recalculation:", marginSettings);
          
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
            console.warn("[useUsdtRateUpdater] Could not fetch margin settings, using defaults");
            calculateAllCostPrices(usdMargin, otherCurrenciesMargin); // Use default values if no settings found
          }
        } catch (marginError) {
          console.error("[useUsdtRateUpdater] Error fetching margin settings:", marginError);
          // Still calculate prices with defaults to ensure UI updates
          calculateAllCostPrices(2.5, 3.0);
        }
        
        // Save historical rates with improved error handling
        setTimeout(async () => {
          try {
            // Get the latest cost prices that were just calculated
            const currentCostPrices = getCurrentCostPrices();
            
            if (currentCostPrices && Object.keys(currentCostPrices).length > 0) {
              // Save historical rate data with source="manual" for manual updates
              await saveHistoricalRates(
                numericRate,
                2.5, // Default if not available
                3.0, // Default if not available
                fxRates,
                currentCostPrices,
                'manual'
              );
              console.log("[useUsdtRateUpdater] Historical data saved after rate update");
            }
          } catch (error) {
            console.error("[useUsdtRateUpdater] Error saving historical data:", error);
          }
        }, 100);
        
        toast.success("Rate updated and prices recalculated");
        return true;
      } else {
        console.error("[useUsdtRateUpdater] Failed to save USDT/NGN rate");
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
      console.error("[useUsdtRateUpdater] Error updating USDT/NGN rate:", error);
      toast.error("Failed to update USDT/NGN rate");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateUsdtRate };
};
