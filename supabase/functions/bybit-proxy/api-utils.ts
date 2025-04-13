
// API utilities for Bybit proxy
import { corsHeaders } from './cors-cache.ts';
import { BybitPayloadStrategy, BybitRequestParams, ApiCallResult } from './types.ts';

// Define the Bybit API URL
const BYBIT_API_URL = "https://api2.bybit.com/fiat/otc/item/online";

/**
 * Creates realistic request headers for Bybit API
 */
export const createApiHeaders = () => {
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
export const createApiPayload = (params: BybitRequestParams) => {
  // Use different payload strategies for different attempts
  const payloadStrategies: BybitPayloadStrategy[] = [
    // Strategy 1: Get best rates for buying USDT
    {
      side: "0",  // Buy USDT with NGN
      page: "1", 
      rows: "20",
      sortType: "PRICE_ASC"  // Sort by ascending price to get best deal
    },
    // Strategy 2: Default sorting
    {
      side: "0",  // Buy USDT with NGN
      page: "1",
      rows: "20", 
      sortType: "TRADE_PRICE"  // Default sort
    },
    // Strategy 3: Focus on highest completion traders
    {
      side: "0",  // Buy USDT with NGN
      page: "1", 
      rows: "20",
      sortType: "DEAL_RATE_DESC"  // Sort by completion rate
    }
  ];
  
  // Rotate strategies to avoid detection patterns
  const now = new Date();
  const minuteOfDay = now.getHours() * 60 + now.getMinutes();
  const selectedStrategy = payloadStrategies[minuteOfDay % payloadStrategies.length];
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
 * Calls the Bybit API with timeout handling and better error reporting
 */
export const callBybitApi = async (payload: any): Promise<ApiCallResult> => {
  console.log("Sending request to Bybit API");
  
  // Make request to Bybit API with increased timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout for better reliability
  
  try {
    const response = await fetch(BYBIT_API_URL, {
      method: "POST",
      headers: createApiHeaders(),
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return { response, error: null };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Better error classification
    let errorMessage = "Unknown error occurred calling Bybit API";
    if (error.name === 'AbortError') {
      console.error("Bybit API request timed out after 20 seconds");
      errorMessage = "Request to Bybit API timed out after 20 seconds";
    } else if (error.message) {
      errorMessage = `Bybit API error: ${error.message}`;
      console.error(errorMessage);
    }
    
    return { 
      response: null, 
      error: new Error(errorMessage)
    };
  }
};
