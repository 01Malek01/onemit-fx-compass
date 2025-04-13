
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Database } from '@/integrations/supabase/types';

// Interface for USDT/NGN rate
export interface UsdtNgnRate {
  id?: string;
  rate: number;
  created_at?: string;
  updated_at?: string;
}

// Default fallback rate when no rates are found in the database
const DEFAULT_USDT_NGN_RATE = 1580;

// Fetch the most recent USDT/NGN rate
export const fetchLatestUsdtNgnRate = async (): Promise<number> => {
  try {
    console.log("[usdt-ngn-service] Fetching latest USDT/NGN rate from Supabase");
    
    // Use the new index we created for better performance
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("[usdt-ngn-service] Supabase error fetching USDT/NGN rate:", error);
      throw error;
    }
    
    console.log("[usdt-ngn-service] Fetched USDT/NGN rate data:", data);
    
    if (!data || data.length === 0) {
      console.warn("[usdt-ngn-service] No USDT/NGN rate found in database, using default rate:", DEFAULT_USDT_NGN_RATE);
      
      // Insert a default rate if no rates are found
      await saveUsdtNgnRate(DEFAULT_USDT_NGN_RATE);
      
      return DEFAULT_USDT_NGN_RATE;
    }
    
    // Make sure we're parsing the rate as a number and validate it
    const rate = Number(data[0].rate);
    if (isNaN(rate) || rate <= 0) {
      console.error("[usdt-ngn-service] Invalid rate value retrieved:", data[0].rate);
      console.warn("[usdt-ngn-service] Using default rate:", DEFAULT_USDT_NGN_RATE);
      return DEFAULT_USDT_NGN_RATE;
    }
    console.log("[usdt-ngn-service] Returning valid USDT/NGN rate:", rate);
    return rate;
  } catch (error) {
    console.error("[usdt-ngn-service] Error fetching USDT/NGN rate:", error);
    toast.error("Failed to fetch USDT/NGN rate, using default");
    return DEFAULT_USDT_NGN_RATE;
  }
};

// Update or insert USDT/NGN rate - improved to work with our database triggers
export const saveUsdtNgnRate = async (rate: number): Promise<boolean> => {
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      console.error("[usdt-ngn-service] Invalid rate value:", rate);
      toast.error("Invalid rate value provided");
      throw new Error("Invalid rate value");
    }

    console.log("[usdt-ngn-service] Saving USDT/NGN rate to Supabase:", rate);
    
    // Always insert a new rate to maintain history
    // We don't need to specify updated_at as our trigger will handle it
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ 
        rate: Number(rate)
        // created_at and updated_at will be set by database defaults
      }]);
    
    if (error) {
      console.error("[usdt-ngn-service] Supabase error saving USDT/NGN rate:", error);
      toast.error("Failed to save USDT/NGN rate");
      throw error;
    }
    
    console.log("[usdt-ngn-service] USDT/NGN rate saved successfully:", rate);
    toast.success("USDT/NGN rate updated successfully");
    return true;
  } catch (error) {
    console.error("[usdt-ngn-service] Error updating USDT/NGN rate:", error);
    toast.error("Failed to update USDT/NGN rate");
    return false;
  }
};

// Export the default rate for use in other files
export const DEFAULT_RATE = DEFAULT_USDT_NGN_RATE;
