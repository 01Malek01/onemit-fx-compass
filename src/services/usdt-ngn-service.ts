
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

// Fetch the most recent USDT/NGN rate
export const fetchLatestUsdtNgnRate = async (): Promise<number> => {
  try {
    console.log("[usdt-ngn-service] Fetching latest USDT/NGN rate from Supabase");
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
      console.warn("[usdt-ngn-service] No USDT/NGN rate found in database, returning default");
      return 0;
    }
    
    // Make sure we're parsing the rate as a number and validate it
    const rate = Number(data[0].rate);
    if (isNaN(rate) || rate <= 0) {
      console.error("[usdt-ngn-service] Invalid rate value retrieved:", data[0].rate);
      throw new Error("Invalid rate value retrieved");
    }
    console.log("[usdt-ngn-service] Returning valid USDT/NGN rate:", rate);
    return rate;
  } catch (error) {
    console.error("[usdt-ngn-service] Error fetching USDT/NGN rate:", error);
    toast.error("Failed to fetch USDT/NGN rate");
    return 0;
  }
};

// Update or insert USDT/NGN rate
export const saveUsdtNgnRate = async (rate: number): Promise<boolean> => {
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      console.error("[usdt-ngn-service] Invalid rate value:", rate);
      toast.error("Invalid rate value provided");
      throw new Error("Invalid rate value");
    }

    console.log("[usdt-ngn-service] Saving USDT/NGN rate to Supabase:", rate);
    
    // Always insert a new rate to maintain history
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ 
        rate: Number(rate),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
