
import { useState } from 'react';
import { saveUsdtNgnRate } from '@/services/usdt-ngn-service';
import { toast } from "sonner";
import { CurrencyRates } from '@/services/api';

interface UsdtRateUpdaterProps {
  setUsdtNgnRate: (rate: number) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fxRates: CurrencyRates;
}

export const useUsdtRateUpdater = ({
  setUsdtNgnRate,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fxRates
}: UsdtRateUpdaterProps) => {
  const [previousRateValue, setPreviousRateValue] = useState<number | null>(null);
  
  const updateUsdtRate = async (rate: number): Promise<boolean> => {
    // Skip if the rate is the same as the previous one
    if (previousRateValue === rate) {
      console.log(`Rate ${rate} is identical to previous rate, skipping update`);
      return true;
    }
    
    setIsLoading(true);
    
    try {
      // Validate the input rate
      if (isNaN(rate) || rate <= 0) {
        toast.error("Please enter a valid rate");
        return false;
      }
      
      // Round to 2 decimal places for consistency
      const roundedRate = Math.round(rate * 100) / 100;
      
      // Update the previous rate tracker
      setPreviousRateValue(roundedRate);
      
      // Update the state with the new rate
      setUsdtNgnRate(roundedRate);
      setLastUpdated(new Date());
      
      // Calculate all cost prices with the updated rate using the current FX rates
      if (fxRates) {
        calculateAllCostPrices(2.5, 3.0); // Use default margins if not yet loaded
      }
      
      // Save to database - use silent=true since we'll handle the toast here
      const success = await saveUsdtNgnRate(roundedRate, 'manual', true);
      
      if (success) {
        // Only show one toast for manual updates
        toast.success("USDT/NGN rate updated successfully");
        return true;
      } else {
        toast.error("Failed to save USDT/NGN rate");
        return false;
      }
    } catch (error) {
      console.error("Error updating USDT/NGN rate:", error);
      toast.error("An error occurred while updating the rate");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return { updateUsdtRate };
};
