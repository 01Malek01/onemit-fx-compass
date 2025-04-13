
// Follow Deno Deploy runtime compatibility
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Import CORS headers from shared module
import { corsHeaders } from "../_shared/cors.ts";

// Define the Bybit API URL
const BYBIT_API_URL = "https://api2.bybit.com/fiat/otc/item/online";

// In-memory cache for Bybit responses with shorter TTL
const responseCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 second cache TTL (reduced from 60s)

/**
 * Handles CORS preflight requests
 */
const handleCorsPreflightRequest = () => {
  console.log("Handling CORS preflight request");
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

/**
 * Validates the request method
 */
const validateRequestMethod = (method: string) => {
  if (method !== 'POST') {
    console.log("Invalid method:", method);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  return null;
};

/**
 * Extracts and validates request parameters
 */
const extractRequestParameters = async (req: Request) => {
  const requestData = await req.json();
  console.log("Received request parameters:", JSON.stringify(requestData));
  
  // Default values if not provided
  return {
    tokenId: requestData.tokenId || "USDT",
    currencyId: requestData.currencyId || "NGN",
    verifiedOnly: requestData.verifiedOnly !== undefined ? requestData.verifiedOnly : true,
  };
};

/**
 * Checks cache for existing response
 */
const checkCache = (cacheKey: string) => {
  const cachedItem = responseCache.get(cacheKey);
  if (cachedItem) {
    console.log("Returning cached Bybit response");
    return new Response(JSON.stringify(cachedItem.data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  return null;
};

/**
 * Creates realistic request headers for Bybit API
 */
const createApiHeaders = () => {
  return {
    "Accept": "application/json",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en-US,en;q=0.9",
    "Content-Type": "application/json;charset=UTF-8",
    "Origin": "https://www.bybit.com",
    "Referer": "https://www.bybit.com/fiat/trade/otc/?actionType=0&token=USDT&fiat=NGN&paymentMethod=",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  };
};

/**
 * Creates the API request payload based on strategy
 */
const createApiPayload = (params: { tokenId: string; currencyId: string; verifiedOnly: boolean }) => {
  // Use different payload strategies for different attempts
  const payloadStrategies = [
    {
      side: "0",  // Buy USDT with NGN
      page: "1", 
      rows: "20",
      sortType: "PRICE_ASC"  // Sort by ascending price
    },
    {
      side: "0",  // Buy USDT with NGN
      page: "1",
      rows: "20", 
      sortType: "TRADE_PRICE"  // Default sort
    }
  ];
  
  // Randomly select a strategy
  const selectedStrategy = payloadStrategies[Math.floor(Math.random() * payloadStrategies.length)];
  console.log("Using strategy:", JSON.stringify(selectedStrategy));
  
  return {
    userId: "",
    tokenId: params.tokenId,
    currencyId: params.currencyId,
    payment: [],
    side: selectedStrategy.side,
    size: selectedStrategy.rows,
    page: selectedStrategy.page,
    rows: selectedStrategy.rows,
    amount: "",
    canTrade: true,
    bulkMaker: false,
    sortType: selectedStrategy.sortType,
    vaMaker: params.verifiedOnly,
    verificationFilter: 0,
    itemRegion: 1,
    paymentPeriod: []
  };
};

/**
 * Calls the Bybit API with timeout handling
 */
const callBybitApi = async (payload: any) => {
  console.log("Sending request to Bybit API");
  
  // Make request to Bybit API with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
  
  try {
    const response = await fetch(BYBIT_API_URL, {
      method: "POST",
      headers: createApiHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return { response, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error("Bybit API request timed out");
      return { 
        response: null, 
        error: new Response(JSON.stringify({
          success: false,
          error: "Request to Bybit API timed out",
          timestamp: new Date().toISOString(),
        }), {
          status: 504, // Gateway Timeout
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      };
    }
    
    return { response: null, error };
  }
};

/**
 * Processes successful API response data
 */
const processApiResponse = (data: any) => {
  if (data.ret_code === 0 && data.result && data.result.items && data.result.items.length > 0) {
    const items = data.result.items;
    
    const traders = items.map((item: any) => ({
      price: parseFloat(item.price),
      nickname: item.nickName,
      completion_rate: item.recentExecuteRate,
      orders: item.recentOrderNum,
      available_quantity: parseFloat(item.lastQuantity),
      min_amount: parseFloat(item.minAmount),
      max_amount: parseFloat(item.maxAmount),
      verified: !!item.authTag,
      payment_methods: item.payments ?? [],
      order_completion_time: item.orderFinishTime ?? "15Min(s)",
    }));
    
    const prices = traders.map((t: any) => t.price);
    const sortedPrices = [...prices].sort((a: number, b: number) => a - b);
    const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    const average = prices.reduce((sum: number, p: number) => sum + p, 0) / (prices.length || 1);
    
    // Find most common price (mode)
    const priceFrequency: Record<number, number> = {};
    let maxFreq = 0;
    let modePrice = prices[0] || 0;
    
    prices.forEach((price: number) => {
      priceFrequency[price] = (priceFrequency[price] || 0) + 1;
      if (priceFrequency[price] > maxFreq) {
        maxFreq = priceFrequency[price];
        modePrice = price;
      }
    });
    
    return {
      traders,
      market_summary: {
        total_traders: prices.length,
        price_range: {
          min: Math.min(...prices),
          max: Math.max(...prices),
          average,
          median: medianPrice,
          mode: modePrice,
        },
      },
      timestamp: new Date().toISOString(),
      success: true
    };
  }
  
  console.warn("Invalid or empty response from Bybit API");
  return {
    traders: [],
    market_summary: {
      total_traders: 0,
      price_range: {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        mode: 0,
      },
    },
    timestamp: new Date().toISOString(),
    success: false,
    error: `Invalid response from Bybit API: ${data?.ret_msg || "No traders found"}`
  };
};

/**
 * Creates a cache key based on request parameters
 */
const createCacheKey = (params: { tokenId: string; currencyId: string; verifiedOnly: boolean }) => {
  const timestampComponent = Math.floor(Date.now() / CACHE_TTL);
  return `${params.tokenId}-${params.currencyId}-${params.verifiedOnly}-${timestampComponent}`;
};

/**
 * Updates the cache with a response
 */
const updateCache = (cacheKey: string, response: any) => {
  responseCache.set(cacheKey, {
    data: response,
    timestamp: Date.now()
  });
};

/**
 * Main handler for bybit-proxy function
 */
serve(async (req) => {
  console.log("Bybit proxy request received:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  try {
    // Validate request method
    const methodError = validateRequestMethod(req.method);
    if (methodError) return methodError;

    // Extract parameters from request
    const params = await extractRequestParameters(req);
    
    // Create a cache key and check for cached response
    const cacheKey = createCacheKey(params);
    const cachedResponse = checkCache(cacheKey);
    if (cachedResponse) return cachedResponse;
    
    // Create payload for Bybit API
    const payload = createApiPayload(params);
    
    // Call the Bybit API
    const { response, error } = await callBybitApi(payload);
    
    // Handle errors from API call
    if (error) {
      if (error instanceof Response) {
        return error;
      }
      
      // Handle unexpected errors
      console.error("Error in bybit-proxy API call:", error.message);
      return new Response(JSON.stringify({
        success: false,
        error: `Server error: ${error.message}`,
        timestamp: new Date().toISOString(),
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Handle API response
    if (!response.ok) {
      console.error(`Bybit API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error("Error response:", errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `API responded with status: ${response.status}`,
        details: errorText
      }), {
        status: 502, // Bad Gateway
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Parse and process the successful response
    const data = await response.json();
    console.log("Bybit API response status code:", response.status);
    console.log("Bybit API response ret_code:", data.ret_code);
    
    // Process the response data
    const processedResponse = processApiResponse(data);
    
    // Cache successful responses
    if (processedResponse.success) {
      updateCache(cacheKey, processedResponse);
    }
    
    // Return the processed response
    return new Response(JSON.stringify(processedResponse), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error in bybit-proxy function:", error.message);
    return new Response(JSON.stringify({
      success: false,
      error: `Server error: ${error.message}`,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
