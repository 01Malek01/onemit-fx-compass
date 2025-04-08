
import { 
  fetchLatestUsdtNgnRate, 
  saveUsdtNgnRate,
  UsdtNgnRate
} from './usdt-ngn-service';

import { 
  fetchMarginSettings, 
  updateMarginSettings,
  MarginSettings
} from './margin-settings-service';

import { 
  saveCurrencyRates, 
  fetchCurrencyRates,
  CurrencyRate
} from './currency-rates-service';

import { 
  saveHistoricalRates, 
  fetchHistoricalRates,
  HistoricalRate
} from './historical-rates-service';

// Re-export all service functions for backward compatibility
// This file is kept for backward compatibility and will be deprecated
export {
  fetchLatestUsdtNgnRate,
  saveUsdtNgnRate,
  fetchMarginSettings,
  updateMarginSettings,
  saveCurrencyRates,
  fetchCurrencyRates,
  saveHistoricalRates,
  fetchHistoricalRates,
  UsdtNgnRate,
  MarginSettings,
  CurrencyRate,
  HistoricalRate
};
