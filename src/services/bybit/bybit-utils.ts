
import { getBybitP2PRate } from './bybit-api';
import { saveBybitRate } from './bybit-storage';
import { cacheWithExpiration } from '@/utils/cacheUtils';

// Cache key for Bybit rate
const BYBIT_RATE_CACHE_KEY = 'bybit_rate_cache';

/**
 * Function to fetch Bybit rate with retry logic and caching
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay in ms between retries
 */
export const fetchBybitRateWithRetry = async (
  maxRetries: number = 2,
  delayMs: number = 2000
): Promise<{rate: number | null, error?: string}> => {
  // Check cache first for ultra-fast response
  const cachedRate = cacheWithExpiration.get(BYBIT_RATE_CACHE_KEY);
  if (cachedRate) {
    console.log(`[BybitAPI] Using cached rate: ${cachedRate}`);
    return { rate: cachedRate };
  }
  
  let lastError = "";
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[BybitAPI] Attempt ${attempt}/${maxRetries} to fetch P2P rate`);
    
    try {
      const response = await getBybitP2PRate();
      
      if (response && response.success && response.market_summary.total_traders > 0) {
        // Use min price as it's more conservative for rate calculations
        const rate = response.market_summary.price_range.min; 
        
        if (rate && rate > 0) {
          console.log(`[BybitAPI] Successfully fetched rate on attempt ${attempt}: ${rate}`);
          
          // Save successful rate to database
          await saveBybitRate(rate);
          
          // Cache the rate for 5 minutes
          cacheWithExpiration.set(BYBIT_RATE_CACHE_KEY, rate, 5 * 60 * 1000);
          
          return { rate };
        } else {
          lastError = "Received invalid rate value (zero or negative)";
          console.warn(`[BybitAPI] ${lastError}`);
        }
      } else {
        lastError = response?.error || "No traders found or empty response";
        console.warn(`[BybitAPI] ${lastError}`);
      }
    } catch (error: any) {
      lastError = error.message || "Unknown error";
      console.error(`[BybitAPI] Error on attempt ${attempt}: ${lastError}`);
    }
    
    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      console.log(`[BybitAPI] Waiting ${delayMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.error(`[BybitAPI] All ${maxRetries} attempts failed. Last error: ${lastError}`);
  return { rate: null, error: lastError };
};
