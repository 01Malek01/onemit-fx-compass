
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRates } from './api';
import { Database } from '@/integrations/supabase/types';

// Interface that matches our Supabase historical_rates table schema
export interface HistoricalRate {
  id?: string;
  timestamp?: string;
  date?: string; // This matches the database schema
  usdt_ngn_rate: number;
  currency_code?: string; // Added to match DB schema
  rate?: number; // Added to match DB schema
  // Additional fields for our application logic
  margin_usd?: number;
  margin_others?: number;
  eur_usd?: number;
  gbp_usd?: number;
  cad_usd?: number;
  ngn_usd?: number;
  ngn_eur?: number;
  ngn_gbp?: number;
  ngn_cad?: number;
  source?: string;
  created_at?: string;
}

/**
 * Save a complete snapshot of rates and cost prices
 * @param usdtNgnRate Current USDT/NGN rate
 * @param usdMargin USD margin percentage
 * @param otherCurrenciesMargin Other currencies margin percentage
 * @param fxRates Current FX rates (currency codes as keys)
 * @param costPrices Calculated cost prices (currency codes as keys)
 * @param source Source of the update ("manual", "auto", or "refresh")
 * @returns Promise<boolean> Success indicator
 */
export const saveHistoricalRates = async (
  usdtNgnRate: number,
  usdMargin: number,
  otherCurrenciesMargin: number,
  fxRates: CurrencyRates,
  costPrices: CurrencyRates,
  source: string = 'manual'
): Promise<boolean> => {
  try {
    console.log("[historical-rates] Saving historical rates snapshot");
    
    // Validate input values
    if (!usdtNgnRate || usdtNgnRate <= 0) {
      console.warn("[historical-rates] Invalid USDT/NGN rate for historical data:", usdtNgnRate);
      return false;
    }

    if (!costPrices || Object.keys(costPrices).length === 0) {
      console.warn("[historical-rates] No cost prices available for historical data");
      return false;
    }

    // Now we need to save multiple records - one for each currency
    const timestamp = new Date().toISOString();
    const recordsToInsert = [];

    // Prepare USD data
    if (costPrices.USD) {
      recordsToInsert.push({
        currency_code: 'USD',
        rate: costPrices.USD,
        usdt_ngn_rate: usdtNgnRate,
        date: timestamp
      });
    }

    // Prepare other currencies data
    const otherCurrencies = ['EUR', 'GBP', 'CAD'];
    otherCurrencies.forEach(currencyCode => {
      if (costPrices[currencyCode]) {
        recordsToInsert.push({
          currency_code: currencyCode,
          rate: costPrices[currencyCode],
          usdt_ngn_rate: usdtNgnRate,
          date: timestamp
        });
      }
    });

    // Batch insert all records at once for better performance
    if (recordsToInsert.length > 0) {
      const { error } = await supabase
        .from('historical_rates')
        .insert(recordsToInsert);
        
      if (error) {
        console.error("[historical-rates] Error saving historical data:", error);
        return false;
      }
      
      console.log("[historical-rates] Historical rate data saved successfully");
      return true;
    } else {
      console.warn("[historical-rates] No data to save");
      return false;
    }
  } catch (error) {
    console.error("[historical-rates] Error in saveHistoricalRates:", error);
    toast.error("Failed to save historical rate data");
    return false;
  }
};

// Fetch historical rates for analytics with better error handling
export const fetchHistoricalRates = async (
  limit: number = 30
): Promise<HistoricalRate[]> => {
  try {
    console.log(`[historical-rates] Fetching historical rates, limit: ${limit}`);
    
    const { data, error } = await supabase
      .from('historical_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(Math.max(1, Math.min(limit, 100))); // Ensure limit is between 1 and 100
    
    if (error) {
      console.error(`[historical-rates] Supabase error fetching historical rates:`, error);
      throw error;
    }
    
    console.log(`[historical-rates] Fetched ${data?.length || 0} historical rates`);
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert the raw data to our application's HistoricalRate type
    const historicalRates: HistoricalRate[] = data.map(item => ({
      ...item,
      // Ensure item.date is properly interpreted as a string
      date: item.date ? String(item.date) : undefined,
      usdt_ngn_rate: Number(item.usdt_ngn_rate)
    }));
    
    return historicalRates;
  } catch (error) {
    console.error(`[historical-rates] Error fetching historical rates:`, error);
    toast.error(`Failed to fetch historical data`);
    return [];
  }
};
