
// Follow Deno Deploy runtime compatibility
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Import CORS headers from shared module
import { corsHeaders } from "../_shared/cors.ts";

// Define the Bybit API URL
const BYBIT_API_URL = "https://api2.bybit.com/fiat/otc/item/online";

// In-memory cache for Bybit responses with shorter TTL
const responseCache = new Map();
const CACHE_TTL = 30 * 1000; // 30 second cache TTL (reduced from 60s)

serve(async (req) => {
  console.log("Bybit proxy request received:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight request");
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log("Invalid method:", req.method);
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse the request body from the client
    const requestData = await req.json();
    console.log("Received request parameters:", JSON.stringify(requestData));
    
    // Default values if not provided
    const tokenId = requestData.tokenId || "USDT";
    const currencyId = requestData.currencyId || "NGN";
    const verifiedOnly = requestData.verifiedOnly !== undefined ? requestData.verifiedOnly : true;
    
    // Create a cache key based on the request params and a timestamp component
    // that rotates every 30 seconds to ensure regular refreshes
    const timestampComponent = Math.floor(Date.now() / CACHE_TTL);
    const cacheKey = `${tokenId}-${currencyId}-${verifiedOnly}-${timestampComponent}`;
    
    // Check if we have a cached response
    const cachedItem = responseCache.get(cacheKey);
    if (cachedItem) {
      console.log("Returning cached Bybit response");
      return new Response(JSON.stringify(cachedItem.data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // Prepare headers for Bybit API request - updated with more realistic values
    const headers = {
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
    
    // Prepare the payload for Bybit API with updated parameters
    const payload = {
      userId: "",
      tokenId,
      currencyId,
      payment: [],
      side: selectedStrategy.side,
      size: selectedStrategy.rows,
      page: selectedStrategy.page,
      rows: selectedStrategy.rows,
      amount: "",
      canTrade: true,
      bulkMaker: false,
      sortType: selectedStrategy.sortType,
      vaMaker: verifiedOnly,
      verificationFilter: 0,
      itemRegion: 1,
      paymentPeriod: []
    };
    
    console.log("Sending request to Bybit API with strategy:", JSON.stringify(selectedStrategy));
    
    // Make request to Bybit API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
    
    try {
      const response = await fetch(BYBIT_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
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
      
      // Process the response similarly to the frontend code
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
        
        const average =
          prices.reduce((sum: number, p: number) => sum + p, 0) / (prices.length || 1);
        
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
        
        // Prepare response
        const processedResponse = {
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
        
        // Cache the response
        responseCache.set(cacheKey, {
          data: processedResponse,
          timestamp: Date.now()
        });
        
        return new Response(JSON.stringify(processedResponse), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      // Handle unsuccessful or empty responses
      console.warn("Invalid or empty response from Bybit API");
      return new Response(JSON.stringify({
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
      }), {
        status: 200, // Still return 200 to allow frontend to handle gracefully
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error("Bybit API request timed out");
        return new Response(JSON.stringify({
          success: false,
          error: "Request to Bybit API timed out",
          timestamp: new Date().toISOString(),
        }), {
          status: 504, // Gateway Timeout
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      
      throw error; // Re-throw for the outer catch block
    }
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
