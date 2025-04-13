
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRate } from "./types";

/**
 * Save currency rates to the database with improved error handling
 * @param rates Currency rates to save
 * @returns Success indicator
 */
export const saveCurrencyRates = async (rates: Record<string, number>): Promise<boolean> => {
  try {
    if (!rates || Object.keys(rates).length === 0) {
      console.warn("[currency-rates/storage] No rates provided to save");
      return false;
    }

    console.log("[currency-rates/storage] Attempting to save currency rates:", rates);
    
    // Prepare records for batch processing
    const updates = [];
    const inserts = [];
    
    // First, get all existing currency codes
    const { data: existingRates, error: fetchError } = await supabase
      .from('currency_rates')
      .select('currency_code, id')
      .in('currency_code', Object.keys(rates));
      
    if (fetchError) {
      console.error("[currency-rates/storage] Error fetching existing rates:", fetchError);
      throw fetchError;
    }
    
    // Create a map of currency codes to their IDs for quick lookup
    const existingCurrencyCodes = new Map<string, string>();
    if (existingRates) {
      existingRates.forEach(rate => {
        existingCurrencyCodes.set(rate.currency_code, rate.id);
      });
    }
    
    // Separate records into updates and inserts
    for (const [currency_code, rate] of Object.entries(rates)) {
      if (existingCurrencyCodes.has(currency_code)) {
        updates.push({
          id: existingCurrencyCodes.get(currency_code),
          rate,
          updated_at: new Date().toISOString(),
          source: 'api'
        });
      } else {
        inserts.push({
          currency_code,
          rate,
          source: 'api',
          is_active: true
        });
      }
    }
    
    // Batch process updates
    if (updates.length > 0) {
      const { error: updateError } = await supabase
        .from('currency_rates')
        .upsert(updates);
        
      if (updateError) {
        console.error("[currency-rates/storage] Error updating rates:", updateError);
        throw updateError;
      }
    }
    
    // Batch process inserts
    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('currency_rates')
        .insert(inserts);
        
      if (insertError) {
        console.error("[currency-rates/storage] Error inserting rates:", insertError);
        throw insertError;
      }
    }
    
    console.log("[currency-rates/storage] Currency rates update completed");
    return true;
  } catch (error) {
    console.error("[currency-rates/storage] Error saving currency rates:", error);
    toast.error("Failed to update currency rates");
    return false;
  }
};

/**
 * Fetch currency rates from database with improved caching
 * @returns Object with currency codes as keys and rates as values
 */
export const fetchCurrencyRates = async (): Promise<Record<string, number>> => {
  try {
    console.log("[currency-rates/storage] Fetching currency rates from database");
    
    // Use more efficient query with filter for active rates only
    const { data, error } = await supabase
      .from('currency_rates')
      .select('currency_code, rate')
      .eq('is_active', true);
    
    if (error) {
      console.error("[currency-rates/storage] Supabase error fetching currency rates:", error);
      throw error;
    }
    
    const rates: Record<string, number> = {};
    if (data) {
      data.forEach(item => {
        rates[item.currency_code] = Number(item.rate);
      });
    }
    
    console.log("[currency-rates/storage] Fetched currency rates:", rates);
    return rates;
  } catch (error) {
    console.error("[currency-rates/storage] Error fetching currency rates:", error);
    toast.error("Failed to fetch currency rates");
    return {};
  }
};
