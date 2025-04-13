
// Type definitions for the Bybit proxy function

export interface BybitRequestParams {
  tokenId: string;
  currencyId: string;
  verifiedOnly: boolean;
}

export interface BybitPayloadStrategy {
  side: string;
  page: string;
  rows: string;
  sortType: string;
}

export interface ProcessedResponse {
  traders: any[];
  market_summary: {
    total_traders: number;
    price_range: {
      min: number;
      max: number;
      average: number;
      median: number;
      mode: number;
    };
  };
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface ApiCallResult {
  response: Response | null;
  error: Response | null;
}

export interface CacheItem {
  data: any;
  timestamp: number;
}
