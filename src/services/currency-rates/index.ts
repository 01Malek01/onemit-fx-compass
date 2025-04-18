/**
 * Currency rates service main exports
 */

// Re-export types
export type { 
  CurrencyRate,
  CurrencyRateResponse
} from './types';

// Re-export API functions
export {
  fetchExchangeRates,
  fetchSingleExchangeRate
} from './api';

// Re-export storage functions
export {
  saveCurrencyRates,
  fetchCurrencyRates
} from './storage';
