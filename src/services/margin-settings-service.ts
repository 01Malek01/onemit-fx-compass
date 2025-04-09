
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Database } from '@/integrations/supabase/types';

// Interface for margin settings
export interface MarginSettings {
  id?: string;
  usd_margin: number;
  other_currencies_margin: number;
  created_at?: string;
  updated_at?: string;
}

// Fetch the current margin settings
export const fetchMarginSettings = async (): Promise<MarginSettings | null> => {
  try {
    console.log("Fetching margin settings");
    
    const { data, error } = await supabase
      .from('margin_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Supabase error fetching margin settings:", error);
      throw error;
    }
    
    console.log("Fetched margin settings:", data);
    
    if (!data || data.length === 0) {
      console.log("No margin settings found, will use defaults");
      return {
        usd_margin: 2.5,
        other_currencies_margin: 3.0
      };
    }
    
    return data[0];
  } catch (error) {
    console.error("Error fetching margin settings:", error);
    toast.error("Failed to fetch margin settings");
    return null;
  }
};

// Update margin settings
export const updateMarginSettings = async (
  usdMargin: number,
  otherCurrenciesMargin: number
): Promise<boolean> => {
  try {
    if (isNaN(usdMargin) || isNaN(otherCurrenciesMargin)) {
      throw new Error("Invalid margin values");
    }
    
    console.log("Updating margin settings:", { usdMargin, otherCurrenciesMargin });
    
    // First get the latest record
    const { data, error: fetchError } = await supabase
      .from('margin_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error("Supabase error fetching margin settings for update:", fetchError);
      throw fetchError;
    }
    
    const currentDate = new Date().toISOString();

    if (data && data.length > 0) {
      // Update existing record
      console.log("Updating existing margin settings with ID:", data[0].id);
      const { error } = await supabase
        .from('margin_settings')
        .update({ 
          usd_margin: usdMargin, 
          other_currencies_margin: otherCurrenciesMargin,
          updated_at: currentDate
        })
        .eq('id', data[0].id);
      
      if (error) {
        console.error("Supabase error updating margin settings:", error);
        throw error;
      }
    } else {
      // Insert new record if none exists
      console.log("No existing margin settings, creating new record");
      const { error } = await supabase
        .from('margin_settings')
        .insert([{ 
          usd_margin: usdMargin, 
          other_currencies_margin: otherCurrenciesMargin,
          created_at: currentDate,
          updated_at: currentDate
        }]);
      
      if (error) {
        console.error("Supabase error inserting margin settings:", error);
        throw error;
      }
    }
    
    console.log("Margin settings updated successfully");
    toast.success("Margin settings updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating margin settings:", error);
    toast.error("Failed to update margin settings");
    return false;
  }
};
