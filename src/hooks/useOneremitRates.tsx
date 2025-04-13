
import { useCallback } from 'react';
import { CurrencyRates } from '@/services/api';

interface OneremitRatesProps {
  costPrices: CurrencyRates;
}

export const useOneremitRates = ({ costPrices }: OneremitRatesProps) => {
  // Generate Oneremit rates based on cost prices
  const getOneremitRates = useCallback((currencyCode: string): { buy: number; sell: number } => {
    const costPrice = costPrices[currencyCode] || 0;
    
    // In a real scenario, buy/sell would be calculated based on spread
    // For now, using a simple 2% spread for demonstration
    return {
      buy: costPrice,
      sell: costPrice * 0.98, // 2% lower for sell rate
    };
  }, [costPrices]);

  return {
    getOneremitRates
  };
};
