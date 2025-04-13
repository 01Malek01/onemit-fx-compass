
// CORS and Cache utilities

// CORS headers for the API
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for Bybit responses with shorter TTL
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 second cache TTL (reduced from 60s)

/**
 * Checks cache for existing response
 */
export const checkCache = (cacheKey: string) => {
  const cachedItem = responseCache.get(cacheKey);
  if (cachedItem) {
    console.log("Returning cached Bybit response");
    return {
      data: cachedItem.data,
      found: true
    };
  }
  return { data: null, found: false };
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
  responseCache.set(cacheKey, {
    data: response,
    timestamp: Date.now()
  });
};
