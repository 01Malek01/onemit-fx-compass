
import { CurrencyRates } from '@/services/api';
import { updateCurrentCostPrices } from '@/services/api';
import { 
  calculateUsdPrice,
  calculateOtherCurrencyPrice
} from '@/utils/currencyUtils';
import { logger } from '@/utils/logUtils';

export interface CostPriceCalculatorProps {
  usdtNgnRate: number | null;
  fxRates: CurrencyRates;
  setCostPrices: (prices: CurrencyRates) => void;
  setPreviousCostPrices: (prices: CurrencyRates) => void;
  costPrices: CurrencyRates;
}

export const useCostPriceCalculator = ({
  usdtNgnRate,
  fxRates,
  setCostPrices,
  setPreviousCostPrices,
  costPrices
}: CostPriceCalculatorProps) => {
  
  const calculateAllCostPrices = (usdMargin: number, otherCurrenciesMargin: number) => {
    // Enhanced validation - guard clause to prevent calculations with invalid rate
    if (!usdtNgnRate || isNaN(Number(usdtNgnRate)) || usdtNgnRate <= 0) {
      logger.warn("Skipping cost price calculation due to invalid USDT/NGN rate:", usdtNgnRate);
      return;
    }
    
    // Only log once at the beginning with all parameters
    logger.debug("Calculating cost prices with margins:", { usdMargin, otherCurrenciesMargin });
    
    if (Object.keys(fxRates).length === 0) {
      logger.warn("No FX rates available for calculations");
      return;
    }
    
    // Store previous cost prices for comparison
    setPreviousCostPrices({ ...costPrices });
    
    const newCostPrices: CurrencyRates = {};
    
    // Calculate USD price using formula: USD/NGN = USDT/NGN × (1 + USD_margin)
    newCostPrices.USD = calculateUsdPrice(usdtNgnRate, usdMargin);
    
    // Calculate other currencies using formula:
    // TARGET/NGN = USDT/NGN ÷ (TARGET/USD) × (1 + target_margin)
    for (const [currency, rate] of Object.entries(fxRates)) {
      if (currency === "USD") continue;
      
      newCostPrices[currency] = calculateOtherCurrencyPrice(
        usdtNgnRate,
        rate,
        otherCurrenciesMargin
      );
    }
    
    // Log results once at the end
    if (process.env.NODE_ENV !== 'production') {
      logger.debug("All cost prices calculated:", newCostPrices);
    }
    
    setCostPrices(newCostPrices);
    
    // Update global cost prices for API access
    updateCurrentCostPrices(newCostPrices);
  };

  return { calculateAllCostPrices };
};

