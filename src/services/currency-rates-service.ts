
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
    // First fetch existing rates to determine whether to insert or update
    const { data: existingRates } = await supabase
      .from('currency_rates')
      .select('currency_code');
    
    const existingCurrencies = new Set();
    if (existingRates) {
      existingRates.forEach(rate => existingCurrencies.add(rate.currency_code));
    }
    
    // Process each rate individually to avoid constraint issues
    for (const [currency_code, rate] of Object.entries(rates)) {
      if (existingCurrencies.has(currency_code)) {
        // Update existing rate
        const { error } = await supabase
          .from('currency_rates')
          .update({ rate, updated_at: new Date().toISOString() })
          .eq('currency_code', currency_code);
          
        if (error) {
          console.error(`Error updating rate for ${currency_code}:`, error);
          return false;
        }
      } else {
        // Insert new rate
        const { error } = await supabase
          .from('currency_rates')
          .insert([{ 
            currency_code, 
            rate, 
            source: 'api',
            is_active: true
          }]);
          
        if (error) {
          console.error(`Error inserting rate for ${currency_code}:`, error);
          return false;
        }
      }
    }
    
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
    const { data, error } = await supabase
      .from('currency_rates')
      .select('currency_code, rate')
      .eq('is_active', true);
    
    if (error) throw error;
    
    const rates: CurrencyRates = {};
    if (data) {
      data.forEach(item => {
        rates[item.currency_code] = item.rate;
      });
    }
    
    return rates;
  } catch (error) {
    console.error("Error fetching currency rates:", error);
    toast.error("Failed to fetch currency rates");
    return {};
  }
};
