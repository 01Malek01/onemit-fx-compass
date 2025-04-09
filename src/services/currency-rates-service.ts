
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRates } from './api';
import { Database } from '@/integrations/supabase/types';

// Interface for currency rate records
export interface CurrencyRate {
  id?: string;
  currency_code: string;
  rate: number;
  is_active?: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// Save currency rates to the database
export const saveCurrencyRates = async (rates: CurrencyRates): Promise<boolean> => {
  try {
    if (!rates || Object.keys(rates).length === 0) {
      console.warn("No rates provided to save");
      return false;
    }

    console.log("Attempting to save currency rates:", rates);

    // First fetch existing rates to determine whether to insert or update
    const { data: existingRates, error: fetchError } = await supabase
      .from('currency_rates')
      .select('currency_code');
    
    if (fetchError) {
      console.error("Error fetching existing currency rates:", fetchError);
      throw fetchError;
    }
    
    const existingCurrencies = new Set();
    if (existingRates) {
      existingRates.forEach(rate => existingCurrencies.add(rate.currency_code));
    }
    
    console.log("Existing currencies:", Array.from(existingCurrencies));
    
    // Process each rate individually to avoid constraint issues
    for (const [currency_code, rate] of Object.entries(rates)) {
      try {
        if (existingCurrencies.has(currency_code)) {
          // Update existing rate
          console.log(`Updating rate for ${currency_code}:`, rate);
          const { error } = await supabase
            .from('currency_rates')
            .update({ 
              rate, 
              updated_at: new Date().toISOString(),
              source: 'api'
            })
            .eq('currency_code', currency_code);
            
          if (error) {
            console.error(`Error updating rate for ${currency_code}:`, error);
            // Continue with other rates even if one fails
            continue;
          }
        } else {
          // Insert new rate
          console.log(`Inserting rate for ${currency_code}:`, rate);
          const { error } = await supabase
            .from('currency_rates')
            .insert([{ 
              currency_code, 
              rate, 
              source: 'api',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
            
          if (error) {
            console.error(`Error inserting rate for ${currency_code}:`, error);
            // Continue with other rates even if one fails
            continue;
          }
        }
      } catch (innerError) {
        console.error(`Error processing ${currency_code}:`, innerError);
        // Continue with other currencies even if one fails
      }
    }
    
    console.log("Currency rates update completed");
    toast.success("Currency rates updated successfully");
    return true;
  } catch (error) {
    console.error("Error saving currency rates:", error);
    toast.error("Failed to update currency rates");
    return false;
  }
};

// Fetch currency rates from database
export const fetchCurrencyRates = async (): Promise<CurrencyRates> => {
  try {
    console.log("Fetching currency rates from database");
    const { data, error } = await supabase
      .from('currency_rates')
      .select('currency_code, rate')
      .eq('is_active', true);
    
    if (error) {
      console.error("Supabase error fetching currency rates:", error);
      throw error;
    }
    
    const rates: CurrencyRates = {};
    if (data) {
      data.forEach(item => {
        rates[item.currency_code] = item.rate;
      });
    }
    
    console.log("Fetched currency rates:", rates);
    return rates;
  } catch (error) {
    console.error("Error fetching currency rates:", error);
    toast.error("Failed to fetch currency rates");
    return {};
  }
};
