
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { CurrencyRates } from './api';
import { Database } from '@/integrations/supabase/types';
import { logger } from '@/utils/logUtils';

// Interface that matches our Supabase historical_rates table schema
export interface HistoricalRate {
  id?: string;
  timestamp?: string;
  date?: string; // This matches the database schema
  usdt_ngn_rate: number;
  currency_code?: string; // Added to match DB schema
  rate?: number; // Added to match DB schema
  // Additional fields for our application logic
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
 * Use daily aggregation to prevent database growth
 * 
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
    logger.debug("[historical-rates] Saving historical rates snapshot");
    
    // Validate input values
    if (!usdtNgnRate || usdtNgnRate <= 0) {
      logger.warn("[historical-rates] Invalid USDT/NGN rate for historical data:", usdtNgnRate);
      return false;
    }

    if (!costPrices || Object.keys(costPrices).length === 0) {
      logger.warn("[historical-rates] No cost prices available for historical data");
      return false;
    }

    // Get the current date in YYYY-MM-DD format (UTC)
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    
    // Check if we already have entries for today for each currency
    const insertPromises: Promise<any>[] = [];
    const currencies = ['USD', 'EUR', 'GBP', 'CAD'];

    for (const currencyCode of currencies) {
      if (!costPrices[currencyCode]) continue;
      
      // First check if we already have an entry for this currency today
      const { data: existingEntries, error: queryError } = await supabase
        .from('historical_rates')
        .select('id')
        .eq('currency_code', currencyCode)
        .gte('date', today)
        .lt('date', new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString());
      
      if (queryError) {
        logger.error(`[historical-rates] Error checking for existing entries for ${currencyCode}:`, queryError);
        continue;
      }
      
      if (existingEntries && existingEntries.length > 0) {
        // Update the existing entry instead of creating a new one
        logger.debug(`[historical-rates] Updating existing entry for ${currencyCode} today`);
        
        insertPromises.push(
          new Promise((resolve, reject) => {
            supabase
              .from('historical_rates')
              .update({
                rate: costPrices[currencyCode],
                usdt_ngn_rate: usdtNgnRate,
                date: timestamp
              })
              .eq('id', existingEntries[0].id)
              .then(result => {
                if (result.error) {
                  reject(result.error);
                } else {
                  resolve(result);
                }
              })
          })
        );
      } else {
        // Insert a new entry
        logger.debug(`[historical-rates] Creating new entry for ${currencyCode} today`);
        
        insertPromises.push(
          new Promise((resolve, reject) => {
            supabase
              .from('historical_rates')
              .insert({
                currency_code: currencyCode,
                rate: costPrices[currencyCode],
                usdt_ngn_rate: usdtNgnRate,
                date: timestamp
              })
              .then(result => {
                if (result.error) {
                  reject(result.error);
                } else {
                  resolve(result);
                }
              })
          })
        );
      }
    }

    // Wait for all operations to complete
    const results = await Promise.all(insertPromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      logger.error("[historical-rates] Errors saving historical data:", errors);
      toast.error("Failed to save some historical rate data");
      return false;
    }
    
    logger.debug("[historical-rates] Historical rate data saved successfully");
    return true;
  } catch (error) {
    logger.error("[historical-rates] Error in saveHistoricalRates:", error);
    toast.error("Failed to save historical rate data");
    return false;
  }
};

// Fetch historical rates for analytics
export const fetchHistoricalRates = async (
  limit: number = 30
): Promise<HistoricalRate[]> => {
  try {
    logger.debug(`Fetching historical rates, limit: ${limit}`);
    
    const { data, error } = await supabase
      .from('historical_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.error(`Supabase error fetching historical rates:`, error);
      throw error;
    }
    
    logger.debug(`Fetched ${data?.length || 0} historical rates`);
    
    // Convert the raw data to our application's HistoricalRate type
    // We need to explicitly cast because the DB schema and our application schema are different
    const historicalRates: HistoricalRate[] = (data as unknown) as HistoricalRate[];
    return historicalRates;
  } catch (error) {
    logger.error(`Error fetching historical rates:`, error);
    toast.error(`Failed to fetch historical data`);
    return [];
  }
};

/**
 * Run the aggregation function on-demand
 * This can be used to manually trigger the aggregation process
 */
export const runDailyAggregation = async (): Promise<boolean> => {
  try {
    logger.info("[historical-rates] Running manual aggregation of historical rates");
    
    const { error } = await supabase.rpc('aggregate_historical_rates_daily');
    
    if (error) {
      logger.error("[historical-rates] Error running aggregation function:", error);
      return false;
    }
    
    logger.info("[historical-rates] Manual aggregation completed successfully");
    return true;
  } catch (error) {
    logger.error("[historical-rates] Error in runDailyAggregation:", error);
    return false;
  }
};
