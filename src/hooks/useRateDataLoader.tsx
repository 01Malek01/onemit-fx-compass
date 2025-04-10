
import { toast } from "sonner";
import { 
  fetchFxRates, 
  fetchVertoFXRates,
  CurrencyRates,
  VertoFXRates 
} from '@/services/api';
import { 
  fetchLatestUsdtNgnRate,
  saveUsdtNgnRate 
} from '@/services/usdt-ngn-service';
import { 
  fetchMarginSettings 
} from '@/services/margin-settings-service';
import { 
  fetchCurrencyRates, 
  saveCurrencyRates 
} from '@/services/currency-rates-service';
import { 
  saveHistoricalRates 
} from '@/services/historical-rates-service';

export interface RateDataLoaderProps {
  setUsdtNgnRate: (rate: number) => void;
  setFxRates: (rates: CurrencyRates) => void;
  setVertoFxRates: (rates: VertoFXRates) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  fxRates: CurrencyRates;
  usdtNgnRate: number;
}

export const useRateDataLoader = ({
  setUsdtNgnRate,
  setFxRates,
  setVertoFxRates,
  setLastUpdated,
  setIsLoading,
  calculateAllCostPrices,
  fxRates,
  usdtNgnRate
}: RateDataLoaderProps) => {
  
  // Load all data from APIs and database
  const loadAllData = async () => {
    console.log("[useRateDataLoader] Loading all data...");
    setIsLoading(true);
    
    try {
      // Fetch USDT/NGN rate from database
      const usdtRate = await fetchLatestUsdtNgnRate();
      console.log("[useRateDataLoader] Fetched USDT/NGN rate from database:", usdtRate);
      
      // Important: Only update the state if we get a valid rate
      if (usdtRate && usdtRate > 0) {
        console.log("[useRateDataLoader] Setting USDT/NGN rate from database:", usdtRate);
        setUsdtNgnRate(usdtRate);
      } else {
        console.warn("[useRateDataLoader] Received invalid or no USDT/NGN rate from database:", usdtRate);
      }
      
      // First try to get FX rates from database
      let rates = await fetchCurrencyRates();
      console.log("[useRateDataLoader] Fetched currency rates from DB:", rates);
      
      // If no rates in DB, fetch from API and save to database
      if (!rates || Object.keys(rates).length === 0) {
        console.log("[useRateDataLoader] No rates in DB, fetching from API...");
        rates = await fetchFxRates();
        console.log("[useRateDataLoader] Fetched FX rates from API:", rates);
        
        if (Object.keys(rates).length > 0) {
          const saved = await saveCurrencyRates(rates);
          console.log("[useRateDataLoader] Saved currency rates to DB:", saved);
        }
      }
      setFxRates(rates);
      
      // Fetch VertoFX rates (these are always from API as they're comparison only)
      const vertoRates = await fetchVertoFXRates();
      console.log("[useRateDataLoader] Fetched VertoFX rates:", vertoRates);
      setVertoFxRates(vertoRates);
      
      // Get margin settings from database
      const marginSettings = await fetchMarginSettings();
      console.log("[useRateDataLoader] Fetched margin settings:", marginSettings);
      
      // Always use the fetched USDT/NGN rate for calculations, not the state which might be stale
      const validRate = usdtRate && usdtRate > 0;
      const validRates = rates && Object.keys(rates).length > 0;
      
      if (marginSettings && validRate && validRates) {
        console.log("[useRateDataLoader] Calculating cost prices with fetched data:", {
          usdMargin: marginSettings.usd_margin,
          otherCurrenciesMargin: marginSettings.other_currencies_margin,
          usdtRate
        });
        
        calculateAllCostPrices(
          marginSettings.usd_margin, 
          marginSettings.other_currencies_margin
        );
        
        // Save rates to historical table for analytics
        const saved = await saveHistoricalRates(rates, usdtRate);
        console.log("[useRateDataLoader] Saved historical rates:", saved);
      } else {
        console.warn("[useRateDataLoader] Missing data for calculations:", { 
          hasMarginSettings: !!marginSettings, 
          validRate, 
          validRates 
        });
      }
      
      setLastUpdated(new Date());
      console.log("[useRateDataLoader] All rates loaded and updated successfully");
    } catch (error) {
      console.error("[useRateDataLoader] Error loading data:", error);
      toast.error("Failed to load some data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle USDT/NGN rate update
  const updateUsdtRate = async (rate: number) => {
    console.log("[useRateDataLoader] Updating USDT/NGN rate:", rate);
    
    if (!rate || isNaN(rate) || rate <= 0) {
      toast.error("Please enter a valid rate");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // First update local state so UI shows the change immediately
      setUsdtNgnRate(rate);
      
      // Save the new rate to database
      const success = await saveUsdtNgnRate(rate);
      console.log("[useRateDataLoader] USDT/NGN rate saved to database:", success);
      
      if (success) {
        setLastUpdated(new Date());
        
        // Fetch current FX rates if needed
        let currentRates = fxRates;
        if (Object.keys(currentRates).length === 0) {
          console.log("[useRateDataLoader] No FX rates loaded, fetching...");
          currentRates = await fetchFxRates();
          console.log("[useRateDataLoader] Fetched FX rates:", currentRates);
          setFxRates(currentRates);
          
          if (Object.keys(currentRates).length > 0) {
            await saveCurrencyRates(currentRates);
          }
        }
        
        // Get margin settings from database
        const marginSettings = await fetchMarginSettings();
        console.log("[useRateDataLoader] Fetched margin settings for recalculation:", marginSettings);
        
        if (marginSettings) {
          // Recalculate cost prices with the updated rate
          calculateAllCostPrices(
            marginSettings.usd_margin, 
            marginSettings.other_currencies_margin
          );
        } else {
          console.warn("[useRateDataLoader] Could not fetch margin settings, using defaults");
          calculateAllCostPrices(2.5, 3.0); // Use default values if no settings found
        }
        
        // Update historical rates
        if (Object.keys(currentRates).length > 0) {
          await saveHistoricalRates(currentRates, rate);
        }

        toast.success("Rate updated and prices recalculated");
      } else {
        console.error("[useRateDataLoader] Failed to save USDT/NGN rate");
        toast.error("Failed to update USDT/NGN rate");
        
        // Revert the local state if save failed
        const originalRate = await fetchLatestUsdtNgnRate();
        if (originalRate && originalRate > 0) {
          setUsdtNgnRate(originalRate);
        }
      }
    } catch (error) {
      console.error("[useRateDataLoader] Error updating USDT/NGN rate:", error);
      toast.error("Failed to update USDT/NGN rate");
    } finally {
      setIsLoading(false);
    }
  };

  return { loadAllData, updateUsdtRate };
};
