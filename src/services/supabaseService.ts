
import { 
  fetchLatestUsdtNgnRate, 
  saveUsdtNgnRate,
  type UsdtNgnRate
} from './usdt-ngn-service';

import { 
  fetchMarginSettings, 
  updateMarginSettings,
  type MarginSettings
} from './margin-settings-service';

import { 
  saveCurrencyRates, 
  fetchCurrencyRates,
  type CurrencyRate
} from './currency-rates';

import { 
  saveHistoricalRates, 
  fetchHistoricalRates,
  type HistoricalRate
} from './historical-rates-service';

import {
  saveVertoFxHistoricalRates,
  fetchVertoFxHistoricalRates
} from './vertofx-historical-service';

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
  saveVertoFxHistoricalRates,
  fetchVertoFxHistoricalRates
};

// Re-export all types using 'export type'
export type { UsdtNgnRate, MarginSettings, CurrencyRate, HistoricalRate };
