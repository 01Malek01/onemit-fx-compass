
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {currencies.map((currency) => {
        // Make sure we have valid rates, otherwise use fallback values
        const vertoRates = vertoFxRates[currency] || { buy: 0, sell: 0 };
        
        // Ensure the rates are actual numbers and not 0 (API failure case)
        const safeVertoRates = {
          buy: vertoRates.buy || 0,
          sell: vertoRates.sell || 0
        };
        
        return (
          <ComparisonTable
            key={currency}
            currencyCode={currency}
            oneremitRates={oneremitRatesFn(currency)}
            vertoFxRates={safeVertoRates}
            isLoading={isLoading}
          />
        );
      })}
    </div>
  );
};

export default MarketComparisonPanel;
