
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
    console.log("Fetching latest USDT/NGN rate from Supabase");
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Supabase error fetching USDT/NGN rate:", error);
      throw error;
    }
    
    console.log("Fetched USDT/NGN rate data:", data);
    
    if (!data || data.length === 0) {
      console.log("No USDT/NGN rate found in database");
      return 0;
    }
    
    console.log("Returning USDT/NGN rate:", data[0].rate);
    return Number(data[0].rate);
  } catch (error) {
    console.error("Error fetching USDT/NGN rate:", error);
    toast.error("Failed to fetch USDT/NGN rate");
    return 0;
  }
};

// Update or insert USDT/NGN rate
export const saveUsdtNgnRate = async (rate: number): Promise<boolean> => {
  try {
    if (!rate || isNaN(rate) || rate <= 0) {
      console.error("Invalid rate value:", rate);
      toast.error("Invalid rate value provided");
      throw new Error("Invalid rate value");
    }

    console.log("Saving USDT/NGN rate to Supabase:", rate);
    
    // Always insert a new rate to maintain history
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ 
        rate: Number(rate),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) {
      console.error("Supabase error saving USDT/NGN rate:", error);
      toast.error("Failed to save USDT/NGN rate");
      throw error;
    }
    
    console.log("USDT/NGN rate saved successfully");
    toast.success("USDT/NGN rate updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating USDT/NGN rate:", error);
    toast.error("Failed to update USDT/NGN rate");
    return false;
  }
};
