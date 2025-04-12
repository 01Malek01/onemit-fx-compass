
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

interface UsdtRateUpdaterProps {
  setUsdtNgnRate: (rate: number) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fxRates: Record<string, number>;
}

export const useUsdtRateUpdater = ({
  setUsdtNgnRate,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fxRates
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
        
        if (marginSettings) {
          // Recalculate cost prices with the updated rate
          calculateAllCostPrices(
            marginSettings.usd_margin, 
            marginSettings.other_currencies_margin
          );
        } else {
          console.warn("[useUsdtRateUpdater] Could not fetch margin settings, using defaults");
          calculateAllCostPrices(2.5, 3.0); // Use default values if no settings found
        }
        
        // Update historical rates
        if (Object.keys(fxRates).length > 0) {
          await saveHistoricalRates(fxRates, rate);
        }

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
