
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
      {currencies.map((currency) => (
        <ComparisonTable
          key={currency}
          currencyCode={currency}
          oneremitRates={oneremitRatesFn(currency)}
          vertoFxRates={vertoFxRates[currency] || { buy: 0, sell: 0 }}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default MarketComparisonPanel;
