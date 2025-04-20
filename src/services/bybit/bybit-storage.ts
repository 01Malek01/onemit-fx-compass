
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logUtils';

/**
 * Saves a Bybit P2P rate to the database for historical purposes and fallback
 */
export const saveBybitRate = async (rate: number): Promise<boolean> => {
  try {
    logger.info("[BybitAPI] Saving rate to Supabase:", rate);
    
    const { error } = await supabase.from("usdt_ngn_rates").insert([
      {
        rate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        source: 'bybit' // Explicitly set source to 'bybit'
      },
    ]);

    if (error) {
      logger.error("❌ Failed to save Bybit rate:", error);
      return false;
    } else {
      logger.info("✅ Bybit rate saved:", rate);
      return true;
    }
  } catch (error) {
    logger.error("❌ Error in saveBybitRate:", error);
    return false;
  }
};

/**
 * Stores ticker data in localStorage for quick access and offline fallback
 */
export const storeTickerData = async (data: { symbol: string; price: string | number; timestamp?: string }) => {
  try {
    logger.debug(`[BybitStorage] Storing ticker data for ${data.symbol}`);
    
    // Store in localStorage
    localStorage.setItem(`bybit_ticker_${data.symbol.toLowerCase()}`, JSON.stringify({
      ...data,
      timestamp: data.timestamp || new Date().toISOString()
    }));
    
    // If we have a valid price, also store in database for historical tracking
    if (data.price && data.symbol === 'BTCUSDT') {
      await saveBybitRate(Number(data.price));
    }
    
    return true;
  } catch (error) {
    logger.error('[BybitStorage] Error storing ticker data:', error);
    return false;
  }
};

/**
 * Retrieves the latest stored ticker data from localStorage
 */
export const getStoredTickerData = (symbol: string = 'BTCUSDT') => {
  try {
    const stored = localStorage.getItem(`bybit_ticker_${symbol.toLowerCase()}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    logger.error('[BybitStorage] Error retrieving stored ticker data:', error);
    return null;
  }
};
