
import { getBybitP2PRate } from './bybit-api';
import { saveBybitRate } from './bybit-storage';
import { cacheWithExpiration } from '@/utils/cacheUtils';

// Cache key for Bybit rate
const BYBIT_RATE_CACHE_KEY = 'bybit_rate_cache';

/**
 * Function to fetch Bybit rate with improved retry logic and caching
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay in ms between retries
 */
export const fetchBybitRateWithRetry = async (
  maxRetries: number = 5,
  delayMs: number = 2000
): Promise<{rate: number | null, error?: string}> => {
  // Check cache first for ultra-fast response
  const cachedRate = cacheWithExpiration.get(BYBIT_RATE_CACHE_KEY);
  if (cachedRate) {
    console.log(`[BybitAPI] Using cached rate: ${cachedRate}`);
    return { rate: cachedRate };
  }
  
  let lastError = "";
  let lastResponse = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[BybitAPI] Attempt ${attempt}/${maxRetries} to fetch P2P rate`);
    
    try {
      // Extend timeout for each retry attempt
      const response = await getBybitP2PRate("NGN", "USDT", true);
      lastResponse = response;
      
      if (!response) {
        lastError = "Null response from Bybit API";
        console.warn(`[BybitAPI] ${lastError}`);
        continue;
      }
      
      if (response && response.success && response.market_summary && response.market_summary.total_traders > 0) {
        // Use average price for more stability
        const rate = response.market_summary.price_range.average; 
        
        if (rate && rate > 0) {
          console.log(`[BybitAPI] Successfully fetched rate on attempt ${attempt}: ${rate}`);
          
          // Save successful rate to database
          await saveBybitRate(rate).catch(err => {
            console.warn(`[BybitAPI] Failed to save rate to DB: ${err.message}`);
            // Continue anyway as this is not critical
          });
          
          // Cache the rate for 5 minutes (reduced from 10 to get more frequent updates)
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
    
    // Implement exponential backoff strategy
    const backoffDelay = delayMs * Math.pow(1.5, attempt - 1);
    const jitter = Math.random() * 300; // Add some randomness (0-300ms)
    const totalDelay = Math.min(backoffDelay + jitter, 10000); // Cap at 10 seconds
    
    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      console.log(`[BybitAPI] Waiting ${Math.round(totalDelay)}ms before retry ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  // Log detailed info about last response for debugging
  console.error(`[BybitAPI] All ${maxRetries} attempts failed. Last error: ${lastError}`);
  if (lastResponse) {
    console.error("[BybitAPI] Last response details:", JSON.stringify({
      success: lastResponse.success,
      traders: lastResponse.traders?.length || 0,
      error: lastResponse.error,
      timestamp: lastResponse.timestamp
    }));
  }
  
  return { rate: null, error: lastError };
};
