
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

// Interface for VertoFX rates
export interface VertoFXRates {
  USD: { buy: number; sell: number };
  EUR: { buy: number; sell: number };
  GBP: { buy: number; sell: number };
  CAD: { buy: number; sell: number };
  [key: string]: { buy: number; sell: number };
}
