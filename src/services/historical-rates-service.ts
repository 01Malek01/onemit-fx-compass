import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CurrencyRates } from "./api";
import { Database } from "@/integrations/supabase/types";

// Interface that matches our Supabase historical_rates table schema
export interface HistoricalRate {
  id?: string;
  timestamp?: string;
  date?: string;
  usdt_ngn_rate: number;
  currency_code?: string;
  rate?: number;
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
  source: string = "manual"
): Promise<boolean> => {
  try {
    console.log("[historical-rates] Saving historical rates snapshot");

    if (!usdtNgnRate || usdtNgnRate <= 0) {
      console.warn(
        "[historical-rates] Invalid USDT/NGN rate for historical data:",
        usdtNgnRate
      );
      return false;
    }

    if (!costPrices || Object.keys(costPrices).length === 0) {
      console.warn(
        "[historical-rates] No cost prices available for historical data"
      );
      return false;
    }

    // Check if there's already an entry in the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: recentRecords, error: checkError } = await supabase
      .from("historical_rates")
      .select("id, date")
      .gte("date", sixHoursAgo)
      .limit(1);

    if (checkError) {
      console.error(
        "[historical-rates] Error checking recent entries:",
        checkError
      );
      toast.error("Error checking for recent historical rates");
      return false;
    }

    if (recentRecords && recentRecords.length > 0) {
      console.info(
        "[historical-rates] Recent historical rates already exist. Skipping insert."
      );
      return false;
    }

    const insertPromises: Promise<any>[] = [];
    const timestamp = new Date().toISOString();

    // Save USD data
    insertPromises.push(
      supabase.from("historical_rates").insert({
        currency_code: "USD",
        rate: costPrices.USD,
        usdt_ngn_rate: usdtNgnRate,
        margin_usd: usdMargin,
        margin_others: otherCurrenciesMargin,
        source,
        date: timestamp,
      })
    );

    // Save other currencies data
    const otherCurrencies = ["EUR", "GBP", "CAD"];
    otherCurrencies.forEach((currencyCode) => {
      const rate = costPrices[currencyCode];
      if (rate) {
        insertPromises.push(
          supabase.from("historical_rates").insert({
            currency_code: currencyCode,
            rate,
            usdt_ngn_rate: usdtNgnRate,
            margin_usd: usdMargin,
            margin_others: otherCurrenciesMargin,
            source,
            date: timestamp,
          })
        );
      }
    });

    const results = await Promise.all(insertPromises);
    const insertErrors = results.filter((res) => res.error);

    if (insertErrors.length > 0) {
      console.error(
        "[historical-rates] Errors saving historical data:",
        insertErrors
      );
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
      .from("historical_rates")
      .select("*")
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Supabase error fetching historical rates:`, error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} historical rates`);

    const historicalRates: HistoricalRate[] =
      data as unknown as HistoricalRate[];
    return historicalRates;
  } catch (error) {
    console.error(`Error fetching historical rates:`, error);
    toast.error(`Failed to fetch historical data`);
    return [];
  }
};
