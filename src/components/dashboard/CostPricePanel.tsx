
import React from 'react';
import CurrencyCard from '@/components/CurrencyCard';
import { CurrencyRates } from '@/services/api';

interface CostPricePanelProps {
  costPrices: CurrencyRates;
  previousCostPrices: CurrencyRates;
  isLoading: boolean;
}

const CostPricePanel: React.FC<CostPricePanelProps> = ({
  costPrices,
  previousCostPrices,
  isLoading
}) => {
  return (
    <div className="dashboard-grid mb-8">
      {['USD', 'EUR', 'GBP', 'CAD'].map((currency) => (
        <CurrencyCard
          key={currency}
          currencyCode={currency}
          ngnValue={costPrices[currency] || 0}
          previousValue={previousCostPrices[currency]}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
};

export default CostPricePanel;
