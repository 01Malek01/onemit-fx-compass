import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logUtils";

// Interface for USDT/NGN rate
export interface UsdtNgnRate {
  id?: string;
  rate: number;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// Default fallback rate
const DEFAULT_USDT_NGN_RATE = 1580;

// Fetch the most recent USDT/NGN rate
export const fetchLatestUsdtNgnRate = async (): Promise<number> => {
  try {
    logger.debug("Fetching latest USDT/NGN rate from Supabase");

    const { data, error } = await supabase
      .from("usdt_ngn_rates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      logger.error("Supabase error fetching USDT/NGN rate:", error);
      throw error;
    }

    logger.debug("Fetched USDT/NGN rate data:", data);

    // If no data, check if there is any recent rate in last 6 hours before inserting
    if (!data || data.length === 0) {
      const sixHoursAgo = new Date(
        Date.now() - 6 * 60 * 60 * 1000
      ).toISOString();

      const { data: recentRates, error: selectError } = await supabase
        .from("usdt_ngn_rates")
        .select("id")
        .gte("created_at", sixHoursAgo)
        .limit(1);

      if (selectError) {
        logger.error(
          "Error checking recent USDT/NGN rates:",
          selectError.message
        );
        throw selectError;
      }

      if (!recentRates || recentRates.length === 0) {
        logger.warn(
          "No USDT/NGN rate found in DB and none in last 6 hours. Inserting default:",
          DEFAULT_USDT_NGN_RATE
        );
        await saveUsdtNgnRate(DEFAULT_USDT_NGN_RATE, "default", true);
      }

      return DEFAULT_USDT_NGN_RATE;
    }

    const rate = Number(data[0].rate);
    if (isNaN(rate) || rate <= 0) {
      logger.error("Invalid rate value retrieved:", data[0].rate);
      return DEFAULT_USDT_NGN_RATE;
    }

    logger.debug("Returning valid USDT/NGN rate:", rate);
    return rate;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error fetching USDT/NGN rate:", errorMessage);
    return DEFAULT_USDT_NGN_RATE;
  }
};

// Save a new rate only if one hasn't been saved in the last 6 hours
export const saveUsdtNgnRate = async (
  rate: number,
  source: string = "manual",
  silent: boolean = false
): Promise<boolean> => {
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      logger.error("Invalid rate value:", rate);
      throw new Error("Invalid rate value");
    }

    logger.debug("Checking for recent USDT/NGN rate before saving...");

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: recentRates, error: selectError } = await supabase
      .from("usdt_ngn_rates")
      .select("id")
      .gte("created_at", sixHoursAgo)
      .limit(1);

    if (selectError) {
      logger.error(
        "Error checking recent rates before insert:",
        selectError.message
      );
      throw selectError;
    }

    if (recentRates && recentRates.length > 0) {
      logger.info("Recent rate already exists. Skipping insert.");
      console.log(recentRates);
      return false;
    }

    logger.debug(`Saving USDT/NGN rate (source: ${source}):`, rate);

    const { error: insertError } = await supabase
      .from("usdt_ngn_rates")
      .insert([
        {
          rate: Number(rate),
          source,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      logger.error("Error inserting USDT/NGN rate:", insertError.message);
      throw insertError;
    }

    logger.debug("USDT/NGN rate inserted successfully.");
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error saving USDT/NGN rate:", errorMessage);
    return false;
  }
};

// Export default rate
export const DEFAULT_RATE = DEFAULT_USDT_NGN_RATE;
