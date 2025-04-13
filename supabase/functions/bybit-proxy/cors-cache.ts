
// CORS and Cache utilities

// CORS headers for the API
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for Bybit responses with fail-safe expiration
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 1000; // 15 second cache TTL for desktop
const MOBILE_CACHE_TTL = 30 * 1000; // 30 second cache TTL for mobile to reduce network usage

/**
 * Checks cache for existing response
 */
export const checkCache = (cacheKey: string, isMobile: boolean = false) => {
  const cachedItem = responseCache.get(cacheKey);
  
  if (!cachedItem) {
    return { data: null, found: false };
  }
  
  // Check if cache has expired (use longer TTL for mobile)
  const ttl = isMobile ? MOBILE_CACHE_TTL : CACHE_TTL;
  const now = Date.now();
  if (now - cachedItem.timestamp > ttl) {
    console.log(`Cache expired after ${Math.floor((now - cachedItem.timestamp)/1000)}s, removing stale item`);
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
  // For mobile, we use a longer cache duration by adjusting the timestamp component
  const timestampComponent = Math.floor(Date.now() / CACHE_TTL);
  return `${params.tokenId}-${params.currencyId}-${params.verifiedOnly}-${timestampComponent}`;
};

/**
 * Updates the cache with a response
 */
export const updateCache = (cacheKey: string, response: any) => {
  console.log(`Updating cache for key: ${cacheKey}`);
  
  // Protection against invalid responses
  if (!response || typeof response !== 'object') {
    console.warn("Attempted to cache invalid response, skipping");
    return;
  }
  
  responseCache.set(cacheKey, {
    data: response,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries every minute
  setTimeout(() => {
    cleanupCache();
  }, 60 * 1000);
};

/**
 * Cleans up expired cache entries
 */
const cleanupCache = () => {
  const now = Date.now();
  let removedCount = 0;
  
  responseCache.forEach((value, key) => {
    if (now - value.timestamp > MOBILE_CACHE_TTL) {
      responseCache.delete(key);
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} expired cache entries`);
  }
};

