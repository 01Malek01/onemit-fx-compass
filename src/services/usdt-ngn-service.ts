
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { logger } from '@/utils/logUtils';

// Interface for USDT/NGN rate
export interface UsdtNgnRate {
  id?: string;
  rate: number;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// Default fallback rate when no rates are found in the database
const DEFAULT_USDT_NGN_RATE = 1580;

// Fetch the most recent USDT/NGN rate
export const fetchLatestUsdtNgnRate = async (): Promise<number> => {
  try {
    logger.debug("Fetching latest USDT/NGN rate from Supabase");
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      logger.error("Supabase error fetching USDT/NGN rate:", error);
      throw error;
    }
    
    logger.debug("Fetched USDT/NGN rate data:", data);
    
    if (!data || data.length === 0) {
      logger.warn("No USDT/NGN rate found in database, using default rate:", DEFAULT_USDT_NGN_RATE);
      
      // Insert a default rate if no rates are found
      await saveUsdtNgnRate(DEFAULT_USDT_NGN_RATE);
      
      return DEFAULT_USDT_NGN_RATE;
    }
    
    // Make sure we're parsing the rate as a number and validate it
    const rate = Number(data[0].rate);
    if (isNaN(rate) || rate <= 0) {
      logger.error("Invalid rate value retrieved:", data[0].rate);
      logger.warn("Using default rate:", DEFAULT_USDT_NGN_RATE);
      return DEFAULT_USDT_NGN_RATE;
    }
    logger.debug("Returning valid USDT/NGN rate:", rate);
    return rate;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error fetching USDT/NGN rate:", errorMessage);
    toast.error("Failed to fetch USDT/NGN rate, using default");
    return DEFAULT_USDT_NGN_RATE;
  }
};

// Update or insert USDT/NGN rate with optional source parameter and silent option
export const saveUsdtNgnRate = async (
  rate: number, 
  source: string = 'manual', 
  silent: boolean = false
): Promise<boolean> => {
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      logger.error("Invalid rate value:", rate);
      if (!silent) toast.error("Invalid rate value provided");
      throw new Error("Invalid rate value");
    }

    logger.debug(`Saving USDT/NGN rate to Supabase (source: ${source}):`, rate);
    
    // Always insert a new rate to maintain history
    const { error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ 
        rate: Number(rate),
        source,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) {
      logger.error("Supabase error saving USDT/NGN rate:", error);
      if (!silent) toast.error("Failed to save USDT/NGN rate");
      throw error;
    }
    
    logger.debug(`USDT/NGN rate saved successfully (source: ${source}):`, rate);
    if (!silent) toast.success("USDT/NGN rate updated successfully");
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error updating USDT/NGN rate:", errorMessage);
    if (!silent) toast.error("Failed to update USDT/NGN rate");
    return false;
  }
};

// Export the default rate for use in other files
export const DEFAULT_RATE = DEFAULT_USDT_NGN_RATE;
