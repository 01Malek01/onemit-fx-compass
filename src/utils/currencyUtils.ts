
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

// Calculate cost price based on the formula
export const calculateCostPrice = (
  usdtNgnRate: number,
  usdtToUsdFee: number,
  currencyFxRate: number,
  usdToTargetFee: number
): number => {
  if (!usdtNgnRate || !currencyFxRate) return 0;
  
  return (usdtNgnRate * (1 - usdtToUsdFee)) / currencyFxRate / (1 - usdToTargetFee);
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
