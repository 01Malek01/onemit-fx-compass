
// Currency formatting and calculation utilities

// Format currency values
export const formatCurrency = (value: number, currency: string = "NGN"): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Format currency pairs
export const formatCurrencyPair = (base: string, quote: string): string => {
  return `${base}/${quote}`;
};

// Calculate cost price based on the corrected formula
export const calculateCostPrice = (
  usdtNgnRate: number,
  usdtToUsdFee: number,  // Now representing a percentage like 0.15%
  currencyFxRate: number,
  usdToTargetFee: number  // Now representing a percentage like 0.5%
): number => {
  if (!usdtNgnRate || !currencyFxRate) return 0;
  
  // Add the USDT fee to the rate (e.g., 1582 + 0.15% = 1582 * 1.0015 = 1584.37)
  const rateWithUsdtFee = usdtNgnRate * (1 + usdtToUsdFee);
  
  // Divide by currency FX rate and add the target fee
  return rateWithUsdtFee / currencyFxRate / (1 - usdToTargetFee);
};

// Apply margin to cost price
export const applyMargin = (costPrice: number, marginPercent: number): number => {
  if (!costPrice) return 0;
  
  return costPrice * (1 + marginPercent / 100);
};

// Compare rates and determine if ours is better
export const compareRates = (ourRate: number, competitorRate: number, isBuy: boolean): boolean => {
  if (isBuy) {
    // For buy rates, lower is better (customer pays less)
    return ourRate < competitorRate;
  } else {
    // For sell rates, higher is better (customer gets more)
    return ourRate > competitorRate;
  }
};

// Calculate percentage difference between rates
export const calculateDifference = (ourRate: number, competitorRate: number): number => {
  if (!ourRate || !competitorRate) return 0;
  
  return ((ourRate - competitorRate) / competitorRate) * 100;
};

// Currency codes map
export const currencyCodes: Record<string, string> = {
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  CAD: "CAD",
  NGN: "NGN",
  USDT: "USDT",
};
