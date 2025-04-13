
/**
 * Type definitions for Bybit P2P API responses and related entities
 */

export interface P2PTrader {
  price: number;
  nickname: string;
  completion_rate: number;
  orders: number;
  available_quantity: number;
  min_amount: number;
  max_amount: number;
  verified: boolean;
  payment_methods: string[];
  order_completion_time: string;
}

export interface P2PMarketSummary {
  total_traders: number;
  price_range: {
    min: number;
    max: number;
    average: number;
    median: number;
    mode: number;
  };
}

export interface BybitP2PResponse {
  traders: P2PTrader[];
  market_summary: P2PMarketSummary;
  timestamp: string;
  success: boolean;
  error?: string;
}

/**
 * Parameters for Bybit P2P API requests
 */
export interface BybitRequestParams {
  currencyId: string;
  tokenId: string;
  verifiedOnly: boolean;
}
