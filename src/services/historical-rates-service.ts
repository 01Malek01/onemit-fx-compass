
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRates } from './api';
import { Database } from '@/integrations/supabase/types';

// Interface for historical rate records
export interface HistoricalRate {
  id?: string;
  currency_code: string;
  rate: number;
  usdt_ngn_rate: number;
  date?: string;
}

// Save historical rate data
export const saveHistoricalRates = async (
  currencyRates: CurrencyRates,
  usdtNgnRate: number
): Promise<boolean> => {
  try {
    const entries = Object.entries(currencyRates).map(([currency_code, rate]) => ({
      currency_code,
      rate,
      usdt_ngn_rate: usdtNgnRate
    }));
    
    const { error } = await supabase
      .from('historical_rates')
      .insert(entries);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error saving historical rates:", error);
    return false;
  }
};

// Fetch historical rates for a specific currency
export const fetchHistoricalRates = async (
  currencyCode: string,
  limit: number = 30
): Promise<HistoricalRate[]> => {
  try {
    const { data, error } = await supabase
      .from('historical_rates')
      .select('*')
      .eq('currency_code', currencyCode)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching historical rates for ${currencyCode}:`, error);
    toast.error(`Failed to fetch historical data for ${currencyCode}`);
    return [];
  }
};
