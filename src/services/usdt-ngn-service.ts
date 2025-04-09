
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
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Supabase error fetching USDT/NGN rate:", error);
      throw error;
    }
    
    console.log("Fetched USDT/NGN rate:", data);
    return data && data.length > 0 ? data[0].rate : 0;
  } catch (error) {
    console.error("Error fetching USDT/NGN rate:", error);
    toast.error("Failed to fetch USDT/NGN rate");
    return 0;
  }
};

// Update or insert USDT/NGN rate
export const saveUsdtNgnRate = async (rate: number): Promise<boolean> => {
  try {
    if (!rate || rate <= 0) {
      throw new Error("Invalid rate value");
    }

    console.log("Saving USDT/NGN rate:", rate);
    
    // Always insert a new rate to maintain history
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ 
        rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error("Supabase error saving USDT/NGN rate:", error);
      throw error;
    }
    
    console.log("USDT/NGN rate saved successfully:", data);
    toast.success("USDT/NGN rate updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating USDT/NGN rate:", error);
    toast.error("Failed to update USDT/NGN rate");
    return false;
  }
};
