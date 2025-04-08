
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRates } from './api';

// Interface for USDT/NGN rate
interface UsdtNgnRate {
  id?: string;
  rate: number;
  created_at?: string;
  updated_at?: string;
}

// Interface for margin settings
interface MarginSettings {
  id?: string;
  usd_margin: number;
  other_currencies_margin: number;
  created_at?: string;
  updated_at?: string;
}

// Interface for currency rate records
interface CurrencyRate {
  id?: string;
  currency_code: string;
  rate: number;
  is_active?: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface for historical rate records
interface HistoricalRate {
  id?: string;
  currency_code: string;
  rate: number;
  usdt_ngn_rate: number;
  date?: string;
}

// Fetch the most recent USDT/NGN rate
export const fetchLatestUsdtNgnRate = async (): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0 ? data[0].rate : 0;
  } catch (error) {
    console.error("Error fetching USDT/NGN rate:", error);
    toast.error("Failed to fetch USDT/NGN rate");
    return 0;
  }
};

// Update or insert USDT/NGN rate
export const saveUsdtNgnRate = async (rate: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ rate }]);
    
    if (error) throw error;
    
    toast.success("USDT/NGN rate updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating USDT/NGN rate:", error);
    toast.error("Failed to update USDT/NGN rate");
    return false;
  }
};

// Fetch the current margin settings
export const fetchMarginSettings = async (): Promise<MarginSettings | null> => {
  try {
    const { data, error } = await supabase
      .from('margin_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error fetching margin settings:", error);
    toast.error("Failed to fetch margin settings");
    return null;
  }
};

// Update margin settings
export const updateMarginSettings = async (
  usdMargin: number,
  otherCurrenciesMargin: number
): Promise<boolean> => {
  try {
    // First get the latest record
    const { data, error: fetchError } = await supabase
      .from('margin_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) throw fetchError;

    if (data && data.length > 0) {
      // Update existing record
      const { error } = await supabase
        .from('margin_settings')
        .update({ 
          usd_margin: usdMargin, 
          other_currencies_margin: otherCurrenciesMargin 
        })
        .eq('id', data[0].id);
      
      if (error) throw error;
    } else {
      // Insert new record if none exists
      const { error } = await supabase
        .from('margin_settings')
        .insert([{ 
          usd_margin: usdMargin, 
          other_currencies_margin: otherCurrenciesMargin 
        }]);
      
      if (error) throw error;
    }
    
    toast.success("Margin settings updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating margin settings:", error);
    toast.error("Failed to update margin settings");
    return false;
  }
};

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
