
// CORS and Cache utilities

// CORS headers for the API
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for Bybit responses
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 20 * 1000; // 20 second cache TTL (reduced for more frequent updates)

/**
 * Checks cache for existing response
 */
export const checkCache = (cacheKey: string) => {
  const cachedItem = responseCache.get(cacheKey);
  
  if (!cachedItem) {
    return { data: null, found: false };
  }
  
  // Check if cache has expired
  const now = Date.now();
  if (now - cachedItem.timestamp > CACHE_TTL) {
    console.log("Cache expired, removing stale item");
    responseCache.delete(cacheKey);
    return { data: null, found: false };
  }
  
  console.log("Returning cached Bybit response");
  return {
    data: cachedItem.data,
    found: true
  };
};

/**
 * Creates a cache key based on request parameters
 */
export const createCacheKey = (params: { tokenId: string; currencyId: string; verifiedOnly: boolean }) => {
  const timestampComponent = Math.floor(Date.now() / CACHE_TTL);
  return `${params.tokenId}-${params.currencyId}-${params.verifiedOnly}-${timestampComponent}`;
};

/**
 * Updates the cache with a response
 */
export const updateCache = (cacheKey: string, response: any) => {
  console.log(`Updating cache for key: ${cacheKey}`);
  responseCache.set(cacheKey, {
    data: response,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries every 5 minutes
  setTimeout(() => {
    cleanupCache();
  }, 5 * 60 * 1000);
};

/**
 * Cleans up expired cache entries
 */
const cleanupCache = () => {
  const now = Date.now();
  let removedCount = 0;
  
  responseCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} expired cache entries`);
  }
};
