
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VertoFxRate } from "./vertofx";

/**
 * Save VertoFX rates to the historical database
 * @param rates The VertoFX rates to save
 * @returns Promise<boolean> Success indicator
 */
export const saveVertoFxHistoricalRates = async (
  rates: Record<string, VertoFxRate>
): Promise<boolean> => {
  try {
    console.log("[vertofx-historical] Saving historical VertoFX rates");
    
    if (!rates || Object.keys(rates).length === 0) {
      console.warn("[vertofx-historical] No rates available to save");
      return false;
    }

    // Transform rates into the format needed for the database
    const recordsToInsert = Object.entries(rates).map(([currencyPair, rateData]) => {
      // Determine buy and sell rates based on the currency pair
      const [fromCurrency, toCurrency] = currencyPair.split('-');
      const isNgnBuy = fromCurrency === 'NGN';
      
      return {
        currency_pair: currencyPair,
        buy_rate: isNgnBuy ? rateData.rate : rateData.inverse_rate,
        sell_rate: isNgnBuy ? rateData.inverse_rate : rateData.rate,
        provider: rateData.provider || 'VertoFX',
        percent_change: rateData.percent_change
      };
    });

    // Insert records into the database
    const { error } = await supabase
      .from('vertofx_historical_rates')
      .insert(recordsToInsert);

    if (error) {
      console.error("[vertofx-historical] Error saving historical rates:", error);
      return false;
    }
    
    console.log(`[vertofx-historical] Successfully saved ${recordsToInsert.length} historical rates`);
    return true;
  } catch (error) {
    console.error("[vertofx-historical] Error in saveVertoFxHistoricalRates:", error);
    return false;
  }
};

/**
 * Fetch historical VertoFX rates for analytics
 * @param currencyPair The currency pair to fetch rates for (e.g., 'NGN-USD')
 * @param limit Maximum number of records to return
 * @returns Array of historical rates
 */
export const fetchVertoFxHistoricalRates = async (
  currencyPair: string,
  limit: number = 30
) => {
  try {
    const { data, error } = await supabase
      .from('vertofx_historical_rates')
      .select('*')
      .eq('currency_pair', currencyPair)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(`[vertofx-historical] Error fetching historical rates for ${currencyPair}:`, error);
      toast.error(`Failed to fetch historical data for ${currencyPair}`);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error(`[vertofx-historical] Error in fetchVertoFxHistoricalRates:`, error);
    toast.error(`Failed to fetch historical VertoFX data`);
    return [];
  }
};
