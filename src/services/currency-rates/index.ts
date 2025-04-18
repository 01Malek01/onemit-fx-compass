/**
 * Currency rates service main exports
 */

// Re-export types
export type { 
  CurrencyRate,
  CurrencyRateResponse
} from './types';

// Re-export API types and functions
export type { CurrencyRates, VertoFXRates } from './api';
export {
  fetchCurrencyRates,
  fetchVertoFXRates,
  fetchExchangeRates,
  fetchSingleExchangeRate,
  DEFAULT_VERTOFX_RATES
} from './api';

// Re-export storage functions
export {
  saveCurrencyRates,
  fetchCurrencyRates as fetchCurrencyRatesFromDB
} from './storage';
