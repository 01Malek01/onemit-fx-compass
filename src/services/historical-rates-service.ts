
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

    // Now we need to save multiple records - one for each currency
    const insertPromises: Promise<any>[] = [];
    const timestamp = new Date().toISOString();

    // Save USD data
    insertPromises.push(
      new Promise((resolve, reject) => {
        supabase.from('historical_rates').insert({
          currency_code: 'USD',
          rate: costPrices.USD,
          usdt_ngn_rate: usdtNgnRate,
          date: timestamp
        }).then(result => {
          if (result.error) {
            reject(result.error);
          } else {
            resolve(result);
          }
        }).catch(reject);
      })
    );

    // Save other currencies data
    const otherCurrencies = ['EUR', 'GBP', 'CAD'];
    otherCurrencies.forEach(currencyCode => {
      if (costPrices[currencyCode]) {
        insertPromises.push(
          new Promise((resolve, reject) => {
            supabase.from('historical_rates').insert({
              currency_code: currencyCode,
              rate: costPrices[currencyCode],
              usdt_ngn_rate: usdtNgnRate,
              date: timestamp
            }).then(result => {
              if (result.error) {
                reject(result.error);
              } else {
                resolve(result);
              }
            }).catch(reject);
          })
        );
      }
    });

    // Wait for all inserts to complete
    const results = await Promise.all(insertPromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      console.error("[historical-rates] Errors saving historical data:", errors);
      toast.error("Failed to save some historical rate data");
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

// Fetch historical rates for analytics
export const fetchHistoricalRates = async (
  limit: number = 30
): Promise<HistoricalRate[]> => {
  try {
    console.log(`Fetching historical rates, limit: ${limit}`);
    
    const { data, error } = await supabase
      .from('historical_rates')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error(`Supabase error fetching historical rates:`, error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} historical rates`);
    
    // Convert the raw data to our application's HistoricalRate type
    // We need to explicitly cast because the DB schema and our application schema are different
    const historicalRates: HistoricalRate[] = (data as unknown) as HistoricalRate[];
    return historicalRates;
  } catch (error) {
    console.error(`Error fetching historical rates:`, error);
    toast.error(`Failed to fetch historical data`);
    return [];
  }
};
