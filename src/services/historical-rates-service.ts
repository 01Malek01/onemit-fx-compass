
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
    if (!currencyRates || Object.keys(currencyRates).length === 0) {
      console.warn("No currency rates provided for historical data");
      return false;
    }

    if (!usdtNgnRate || usdtNgnRate <= 0) {
      console.warn("Invalid USDT/NGN rate for historical data:", usdtNgnRate);
      return false;
    }

    console.log("Saving historical rates with USDT/NGN rate:", usdtNgnRate);
    console.log("Currency rates for historical data:", currencyRates);

    const currentDate = new Date().toISOString();
    const entries = Object.entries(currencyRates).map(([currency_code, rate]) => ({
      currency_code,
      rate,
      usdt_ngn_rate: usdtNgnRate,
      date: currentDate
    }));
    
    console.log("Preparing historical entries:", entries);
    
    // Insert in batches to avoid payload size issues
    for (let i = 0; i < entries.length; i += 10) {
      const batch = entries.slice(i, i + 10);
      const { error } = await supabase
        .from('historical_rates')
        .insert(batch);
      
      if (error) {
        console.error(`Supabase error saving batch ${i} of historical rates:`, error);
        // Continue with other batches even if one fails
      }
    }
    
    console.log("Historical rates saved successfully");
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
    console.log(`Fetching historical rates for ${currencyCode}, limit: ${limit}`);
    
    const { data, error } = await supabase
      .from('historical_rates')
      .select('*')
      .eq('currency_code', currencyCode)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(`Supabase error fetching historical rates for ${currencyCode}:`, error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} historical rates for ${currencyCode}`);
    return data || [];
  } catch (error) {
    console.error(`Error fetching historical rates for ${currencyCode}:`, error);
    toast.error(`Failed to fetch historical data for ${currencyCode}`);
    return [];
  }
};
