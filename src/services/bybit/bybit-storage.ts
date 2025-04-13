
import { supabase } from '@/integrations/supabase/client';

/**
 * Saves a Bybit P2P rate to the database for historical purposes and fallback
 */
export const saveBybitRate = async (rate: number): Promise<boolean> => {
  try {
    console.log("[BybitAPI] Saving rate to Supabase:", rate);
    
    const { error } = await supabase.from("usdt_ngn_rates").insert([
      {
        rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'bybit' // Explicitly set source to 'bybit'
      },
    ]);

    if (error) {
      console.error("❌ Failed to save Bybit rate:", error);
      return false;
    } else {
      console.log("✅ Bybit rate saved:", rate);
      return true;
    }
  } catch (error) {
    console.error("❌ Error in saveBybitRate:", error);
    return false;
  }
};
