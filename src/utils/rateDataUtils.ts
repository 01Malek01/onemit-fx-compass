
// This file is maintained for backward compatibility
// New code should import from specific utility files directly

import { loadRatesData } from './rates/ratesLoader';
import { loadAndApplyMarginSettings } from './marginUtils';
import { saveHistoricalRatesData } from './historicalDataUtils';

// Re-export functions for backward compatibility
export { loadRatesData, loadAndApplyMarginSettings, saveHistoricalRatesData };
