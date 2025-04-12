import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRates } from './api';
import { Database } from '@/integrations/supabase/types';

// Interface for historical rate records
export interface HistoricalRate {
  id?: string;
  timestamp?: string;
  usdt_ngn_rate: number;
  margin_usd: number;
  margin_others: number;
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

    // Prepare data for insertion
    const historicalData: HistoricalRate = {
      usdt_ngn_rate: usdtNgnRate,
      margin_usd: usdMargin,
      margin_others: otherCurrenciesMargin,
      eur_usd: fxRates.EUR,
      gbp_usd: fxRates.GBP,
      cad_usd: fxRates.CAD,
      ngn_usd: costPrices.USD,
      ngn_eur: costPrices.EUR,
      ngn_gbp: costPrices.GBP,
      ngn_cad: costPrices.CAD,
      source: source,
      timestamp: new Date().toISOString()
    };

    console.log("[historical-rates] Prepared historical data:", historicalData);
    
    // Insert data into Supabase
    const { error } = await supabase
      .from('historical_rates')
      .insert(historicalData);
    
    if (error) {
      console.error("[historical-rates] Error saving historical data:", error);
      toast.error("Failed to save historical rate data");
      return false;
    }
    
    console.log("[historical-rates] Historical rate data saved successfully");
    return true;
  } catch (error) {
    console.error("[historical-rates] Error in saveHistoricalRates:", error);
    toast.error("Failed to save historical rate data");
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
