import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logUtils";

/**
 * Saves a Bybit P2P rate to the database for historical purposes and fallback,
 * but skips saving if an entry already exists within the last 6 hours.
 */
export const saveBybitRate = async (rate: number): Promise<boolean> => {
  try {
    logger.info("[BybitAPI] Preparing to save rate to Supabase:", rate);

    if (!rate || rate <= 0) {
      logger.warn("[BybitAPI] Invalid rate provided:", rate);
      return false;
    }

    // Check if there's a record within the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    const { data: recentRates, error: checkError } = await supabase
      .from("usdt_ngn_rates")
      .select("id, created_at")
      .eq("source", "bybit")
      .gte("created_at", sixHoursAgo)
      .limit(1);

    if (checkError) {
      logger.error("[BybitAPI] Error checking recent records:", checkError);
      return false;
    }

    if (recentRates && recentRates.length > 0) {
      logger.info(
        "[BybitAPI] Recent rate already exists within 6 hours. Skipping insert."
      );
      return false;
    }

    // Insert new rate
    const { error } = await supabase.from("usdt_ngn_rates").insert([
      {
        rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: "bybit",
      },
    ]);

    if (error) {
      logger.error("❌ Failed to save Bybit rate:", error);
      return false;
    } else {
      logger.info("✅ Bybit rate saved successfully:", rate);
      return true;
    }
  } catch (error) {
    logger.error("❌ Error in saveBybitRate:", error);
    return false;
  }
};
