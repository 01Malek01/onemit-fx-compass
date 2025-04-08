
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
    const entries = Object.entries(rates).map(([currency_code, rate]) => ({
      currency_code,
      rate,
      source: 'api'
    }));
    
    const { error } = await supabase
      .from('currency_rates')
      .upsert(
        entries,
        { 
          onConflict: 'currency_code',
          ignoreDuplicates: false
        }
      );
    
    if (error) throw error;
    
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
