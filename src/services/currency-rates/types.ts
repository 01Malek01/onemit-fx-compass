
/**
 * Type definitions for currency rates
 */

// Interface for currency rate records
export interface CurrencyRate {
  id?: string;
  currency_code: string;
  rate: number;
  is_active?: boolean;
  source?: string;
  created_at?: string;
  updated_at?: string;
}

// API response interface
export interface CurrencyRateResponse {
  data: {
    [currencyCode: string]: number;
  };
  meta?: {
    last_updated_at: string;
  };
}
