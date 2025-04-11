
import React from 'react';
import MarketComparisonPanel from '@/components/dashboard/MarketComparisonPanel';
import { VertoFXRates } from '@/services/api';

interface MarketComparisonSectionProps {
  currencies: string[];
  oneremitRatesFn: (currency: string) => { buy: number; sell: number };
  vertoFxRates: VertoFXRates;
  isLoading: boolean;
}

const MarketComparisonSection: React.FC<MarketComparisonSectionProps> = ({
  currencies,
  oneremitRatesFn,
  vertoFxRates,
  isLoading
}) => {
  return (
    <div>
      <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
        Market Comparison
      </h2>
      <MarketComparisonPanel 
        currencies={currencies} 
        oneremitRatesFn={oneremitRatesFn}
        vertoFxRates={vertoFxRates}
        isLoading={isLoading}
      />
    </div>
  );
};

export default MarketComparisonSection;
