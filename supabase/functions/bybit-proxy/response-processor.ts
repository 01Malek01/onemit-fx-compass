
// Response processor for Bybit API data
import { ProcessedResponse } from './types.ts';

/**
 * Processes successful API response data
 */
export const processApiResponse = (data: any): ProcessedResponse => {
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
