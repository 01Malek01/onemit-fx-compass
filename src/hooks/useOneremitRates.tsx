
import { useCallback } from 'react';
import { CurrencyRates } from '@/services/api';

interface OneremitRatesProps {
  costPrices: CurrencyRates;
}

export const useOneremitRates = ({ costPrices }: OneremitRatesProps) => {
  // Generate Oneremit rates based on cost prices
  const getOneremitRates = useCallback((currencyCode: string): { buy: number; sell: number } => {
    const costPrice = costPrices[currencyCode] || 0;
    
    return {
      buy: costPrice,
      sell: 0, // Setting sell rate to 0 for all currencies as requested
    };
  }, [costPrices]);

  return {
    getOneremitRates
  };
};
