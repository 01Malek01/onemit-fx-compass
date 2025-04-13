
import React from 'react';
import ComparisonTable from '@/components/ComparisonTable';
import { VertoFXRates } from '@/services/api';

interface MarketComparisonPanelProps {
  currencies: string[];
  oneremitRatesFn: (currency: string) => { buy: number; sell: number };
  vertoFxRates: VertoFXRates;
  isLoading: boolean;
}

const MarketComparisonPanel: React.FC<MarketComparisonPanelProps> = ({
  currencies,
  oneremitRatesFn,
  vertoFxRates,
  isLoading
}) => {
  // Log the VertoFX rates for debugging
  console.log("MarketComparisonPanel received vertoFxRates:", vertoFxRates);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {currencies.map((currency) => {
        // Make sure we have valid rates, otherwise use fallback values
        const oneremitRates = oneremitRatesFn(currency);
        const vertoRates = vertoFxRates[currency] || { buy: 0, sell: 0 };
        
        console.log(`MarketComparisonPanel: Currency ${currency}`, {
          oneremitRates,
          vertoRates
        });
        
        return (
          <ComparisonTable
            key={currency}
            currencyCode={currency}
            oneremitRates={oneremitRates}
            vertoFxRates={vertoRates}
            isLoading={isLoading}
          />
        );
      })}
    </div>
  );
};

export default MarketComparisonPanel;
