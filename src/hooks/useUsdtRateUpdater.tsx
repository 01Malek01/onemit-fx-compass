
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
import { getCurrentCostPrices } from '@/services/api';

interface UsdtRateUpdaterProps {
  setUsdtNgnRate: (rate: number) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fxRates: Record<string, number>;
  costPrices: Record<string, number>;
}

export const useUsdtRateUpdater = ({
  setUsdtNgnRate,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fxRates,
  costPrices
}: UsdtRateUpdaterProps) => {
  
  // Handle USDT/NGN rate update - now uses the passed rate parameter
  const updateUsdtRate = async (rate: number): Promise<boolean> => {
    console.log("[useUsdtRateUpdater] Updating USDT/NGN rate with explicitly passed value:", rate);
    
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
      console.log("[useUsdtRateUpdater] USDT/NGN rate saved to database:", success);
      
      if (success) {
        setLastUpdated(new Date());
        
        // Get margin settings from database
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
        
        // Save historical rates
        // Wait a brief moment for cost prices to be calculated
        setTimeout(async () => {
          try {
            // Save historical rate data with source="manual" for manual updates
            await saveHistoricalRates(
              rate,
              usdMargin,
              otherCurrenciesMargin,
              fxRates,
              costPrices,
              'manual'
            );
            console.log("[useUsdtRateUpdater] Historical data saved after rate update");
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
