
import { CurrencyRates } from '@/services/api';
import { updateCurrentCostPrices } from '@/services/api';
import { 
  calculateUsdPrice,
  calculateOtherCurrencyPrice
} from '@/utils/currencyUtils';

// Updated fee constant with correct value (0.10%)
const USDT_TO_USD_FEE = 0.001; // 0.10% as decimal

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
    console.log("Calculating cost prices with margins:", { usdMargin, otherCurrenciesMargin });
    console.log("Using USDT/NGN rate:", usdtNgnRate);
    console.log("Using FX rates:", fxRates);
    
    if (!usdtNgnRate || usdtNgnRate <= 0) {
      console.warn("Invalid USDT/NGN rate for calculations:", usdtNgnRate);
      return;
    }
    
    if (Object.keys(fxRates).length === 0) {
      console.warn("No FX rates available for calculations");
      return;
    }
    
    // Store previous cost prices for comparison
    setPreviousCostPrices({ ...costPrices });
    
    const newCostPrices: CurrencyRates = {};
    
    // Calculate USD price using formula: USD/NGN = USDT/NGN × (1 + USD_margin)
    newCostPrices.USD = calculateUsdPrice(usdtNgnRate, usdMargin);
    
    console.log("USD cost price calculated:", { 
      usdtNgnRate: usdtNgnRate,
      usdMargin: usdMargin,
      result: newCostPrices.USD
    });
    
    // Calculate other currencies using formula:
    // TARGET/NGN = (USDT/NGN × (1 - usdt_to_usd_fee)) ÷ (TARGET/USD) × (1 + target_margin)
    for (const [currency, rate] of Object.entries(fxRates)) {
      if (currency === "USD") continue;
      
      newCostPrices[currency] = calculateOtherCurrencyPrice(
        usdtNgnRate,
        rate,
        otherCurrenciesMargin,
        USDT_TO_USD_FEE
      );
      
      console.log(`${currency} cost price calculated:`, { 
        usdtNgnRate: usdtNgnRate,
        currencyFxRate: rate,
        otherCurrenciesMargin: otherCurrenciesMargin,
        usdtToUsdFee: USDT_TO_USD_FEE,
        result: newCostPrices[currency]
      });
    }
    
    console.log("All cost prices calculated:", newCostPrices);
    setCostPrices(newCostPrices);
    
    // Update global cost prices for API access
    updateCurrentCostPrices(newCostPrices);
  };

  return { calculateAllCostPrices };
};
