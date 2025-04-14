
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRate } from "./types";
import { logger } from '@/utils/logUtils';

/**
 * Save currency rates to the database
 * @param rates Currency rates to save
 * @returns Success indicator
 */
export const saveCurrencyRates = async (rates: Record<string, number>): Promise<boolean> => {
  try {
    if (!rates || Object.keys(rates).length === 0) {
      logger.warn("[currency-rates/storage] No rates provided to save");
      return false;
    }

    logger.info("[currency-rates/storage] Attempting to save currency rates:", rates);

    // Process each rate individually to avoid constraint issues
    for (const [currency_code, rate] of Object.entries(rates)) {
      try {
        // Check if rate already exists
        const { data: existingRates, error: fetchError } = await supabase
          .from('currency_rates')
          .select('id')
          .eq('currency_code', currency_code)
          .limit(1);
        
        if (fetchError) {
          logger.error(`[currency-rates/storage] Error checking if ${currency_code} exists:`, fetchError);
          continue;
        }
        
        const currentDate = new Date().toISOString();
        
        if (existingRates && existingRates.length > 0) {
          // Update existing rate
          logger.debug(`[currency-rates/storage] Updating rate for ${currency_code}:`, rate);
          const { error: updateError } = await supabase
            .from('currency_rates')
            .update({ 
              rate, 
              updated_at: currentDate,
              source: 'api'
            })
            .eq('currency_code', currency_code);
            
          if (updateError) {
            logger.error(`[currency-rates/storage] Error updating rate for ${currency_code}:`, updateError);
          }
        } else {
          // Insert new rate
          logger.debug(`[currency-rates/storage] Inserting rate for ${currency_code}:`, rate);
          const { error: insertError } = await supabase
            .from('currency_rates')
            .insert([{ 
              currency_code, 
              rate, 
              source: 'api',
              is_active: true,
              created_at: currentDate,
              updated_at: currentDate
            }]);
            
          if (insertError) {
            logger.error(`[currency-rates/storage] Error inserting rate for ${currency_code}:`, insertError);
          }
        }
      } catch (innerError) {
        logger.error(`[currency-rates/storage] Error processing ${currency_code}:`, innerError);
        // Continue with other currencies even if one fails
      }
    }
    
    logger.info("[currency-rates/storage] Currency rates update completed");
    return true;
  } catch (error) {
    logger.error("[currency-rates/storage] Error saving currency rates:", error);
    toast.error("Failed to update currency rates");
    return false;
  }
};

/**
 * Fetch currency rates from database
 * @returns Object with currency codes as keys and rates as values
 */
export const fetchCurrencyRates = async (): Promise<Record<string, number>> => {
  try {
    logger.debug("[currency-rates/storage] Fetching currency rates from database");
    const { data, error } = await supabase
      .from('currency_rates')
      .select('currency_code, rate')
      .eq('is_active', true);
    
    if (error) {
      logger.error("[currency-rates/storage] Supabase error fetching currency rates:", error);
      throw error;
    }
    
    const rates: Record<string, number> = {};
    if (data) {
      data.forEach(item => {
        rates[item.currency_code] = item.rate;
      });
    }
    
    logger.debug("[currency-rates/storage] Fetched currency rates:", rates);
    return rates;
  } catch (error) {
    logger.error("[currency-rates/storage] Error fetching currency rates:", error);
    toast.error("Failed to fetch currency rates");
    return {};
  }
};
