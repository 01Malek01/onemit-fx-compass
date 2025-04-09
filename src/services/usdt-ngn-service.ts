
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
    
    if (error) throw error;
    
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
    // Always insert a new rate to maintain history
    const { error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ 
        rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) throw error;
    
    toast.success("USDT/NGN rate updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating USDT/NGN rate:", error);
    toast.error("Failed to update USDT/NGN rate");
    return false;
  }
};
