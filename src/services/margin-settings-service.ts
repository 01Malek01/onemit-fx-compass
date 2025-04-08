
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
    const { data, error } = await supabase
      .from('margin_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return data && data.length > 0 ? data[0] : null;
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
    // First get the latest record
    const { data, error: fetchError } = await supabase
      .from('margin_settings')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) throw fetchError;

    if (data && data.length > 0) {
      // Update existing record
      const { error } = await supabase
        .from('margin_settings')
        .update({ 
          usd_margin: usdMargin, 
          other_currencies_margin: otherCurrenciesMargin 
        })
        .eq('id', data[0].id);
      
      if (error) throw error;
    } else {
      // Insert new record if none exists
      const { error } = await supabase
        .from('margin_settings')
        .insert([{ 
          usd_margin: usdMargin, 
          other_currencies_margin: otherCurrenciesMargin 
        }]);
      
      if (error) throw error;
    }
    
    toast.success("Margin settings updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating margin settings:", error);
    toast.error("Failed to update margin settings");
    return false;
  }
};
