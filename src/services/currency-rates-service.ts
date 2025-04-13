
/**
 * This file is maintained for backward compatibility
 * All functionality has been refactored into the currency-rates folder
 */

// Re-export everything from the refactored modules
export {
  CurrencyRate,
  CurrencyRateResponse,
  fetchExchangeRates,
  fetchSingleExchangeRate,
  saveCurrencyRates,
  fetchCurrencyRates
} from './currency-rates';
