import { getBybitP2PRate } from './bybit-api';
import { saveBybitRate } from './bybit-storage';
import { cacheWithExpiration } from '@/utils/cacheUtils';

// Cache key for Bybit rate
const BYBIT_RATE_CACHE_KEY = 'bybit_rate_cache';

// Keep track of consecutive failures for exponential backoff
let consecutiveFailures = 0;

/**
 * Function to fetch Bybit rate with improved retry logic and caching
 * @param maxRetries Maximum number of retry attempts
 * @param delayMs Delay in ms between retries
 */
export const fetchBybitRateWithRetry = async (
  maxRetries: number = 7,
  delayMs: number = 3000
): Promise<{rate: number | null, error?: string}> => {
  // Check cache first for ultra-fast response
  const cachedRate = cacheWithExpiration.get(BYBIT_RATE_CACHE_KEY);
  if (cachedRate) {
    console.log(`[BybitAPI] Using cached rate: ${cachedRate}`);
    // Reset failures count on successful cache hit
    consecutiveFailures = 0;
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
        // Calculate most reliable price from available methods
        // For better stability, prefer median over average, but use a fallback strategy
        let rate: number;
        
        if (response.market_summary.price_range.median && response.market_summary.price_range.median > 0) {
          rate = response.market_summary.price_range.median;
          console.log(`[BybitAPI] Using median price (most stable): ${rate}`);
        } else if (response.market_summary.price_range.average && response.market_summary.price_range.average > 0) {
          rate = response.market_summary.price_range.average; 
          console.log(`[BybitAPI] Using average price (fallback): ${rate}`);
        } else if (response.market_summary.price_range.mode && response.market_summary.price_range.mode > 0) {
          rate = response.market_summary.price_range.mode;
          console.log(`[BybitAPI] Using mode price (second fallback): ${rate}`);
        } else {
          // Last resort: use the lowest sell price from a verified trader
          const verifiedSellers = response.traders.filter(t => t.verified && t.price > 0);
          if (verifiedSellers.length > 0) {
            // Sort by price ascending and take lowest
            verifiedSellers.sort((a, b) => a.price - b.price);
            rate = verifiedSellers[0].price;
            console.log(`[BybitAPI] Using lowest verified seller price (last resort): ${rate}`);
          } else {
            lastError = "No valid rate found in response";
            console.warn(`[BybitAPI] ${lastError}`);
            continue;
          }
        }
        
        if (rate && rate > 0) {
          console.log(`[BybitAPI] Successfully fetched rate on attempt ${attempt}: ${rate}`);
          
          // Reset consecutive failures on success
          consecutiveFailures = 0;
          
          // Save successful rate to database
          await saveBybitRate(rate).catch(err => {
            console.warn(`[BybitAPI] Failed to save rate to DB: ${err.message}`);
            // Continue anyway as this is not critical
          });
          
          // Cache the rate for 3 minutes (reduced from 5 to get more frequent updates)
          cacheWithExpiration.set(BYBIT_RATE_CACHE_KEY, rate, 3 * 60 * 1000);
          
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
    
    // Implement smarter exponential backoff strategy with jitter
    // Factor in consecutive failures across requests to back off more aggressively
    const backoffFactor = Math.min(consecutiveFailures + 1, 5); // Cap at 5x factor
    const backoffDelay = delayMs * Math.pow(1.5, attempt - 1) * backoffFactor;
    const jitter = Math.random() * 500; // Add randomness (0-500ms)
    const totalDelay = Math.min(backoffDelay + jitter, 15000); // Cap at 15 seconds
    
    // Don't wait after the last attempt
    if (attempt < maxRetries) {
      console.log(`[BybitAPI] Waiting ${Math.round(totalDelay)}ms before retry ${attempt + 1}...`);
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  // Increment consecutive failures counter when all retries fail
  consecutiveFailures++;
  console.log(`[BybitAPI] Consecutive failures: ${consecutiveFailures}`);
  
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

/**
 * Reset the consecutive failures counter
 */
export const resetConsecutiveFailures = () => {
  consecutiveFailures = 0;
};
