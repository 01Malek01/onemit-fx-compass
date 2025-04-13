
// Response processor for Bybit API data
import { ProcessedResponse } from './types.ts';

/**
 * Processes successful API response data
 */
export const processApiResponse = (data: any): ProcessedResponse => {
  try {
    if (!data) {
      console.error("Empty response from Bybit API");
      return createErrorResponse("Empty response from Bybit API");
    }
    
    console.log("Processing API response, ret_code =", data.ret_code);
    
    // Check for specific error cases first
    if (data.ret_code !== 0) {
      console.error(`Bybit API error code: ${data.ret_code}, message: ${data.ret_msg || "No message"}`);
      return createErrorResponse(`Bybit API error: ${data.ret_msg || "Unknown error"}`);
    }
    
    if (!data.result || !data.result.items) {
      console.error("Missing expected data structure in response");
      return createErrorResponse("Invalid API response structure");
    }
    
    const items = data.result.items;
    if (!Array.isArray(items) || items.length === 0) {
      console.warn("No traders found in response");
      return createErrorResponse("No traders found");
    }
    
    // Extract traders from the response
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
    
    // Calculate price statistics
    const prices = traders.map((t: any) => t.price);
    if (prices.length === 0) {
      console.warn("No valid prices found");
      return createErrorResponse("No valid prices found");
    }
    
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
    
    console.log(`Processed ${traders.length} traders, avg price: ${average}, median: ${medianPrice}`);
    
    return {
      traders,
      market_summary: {
        total_traders: traders.length,
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
  } catch (error) {
    console.error("Error processing API response:", error.message);
    return createErrorResponse(`Error processing API response: ${error.message}`);
  }
};

/**
 * Creates a standardized error response
 */
function createErrorResponse(errorMessage: string): ProcessedResponse {
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
    error: errorMessage
  };
}
