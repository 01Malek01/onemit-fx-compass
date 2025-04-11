
import React from 'react';
import CostPricePanel from '@/components/dashboard/CostPricePanel';
import { CurrencyRates } from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';

interface CostPriceSectionProps {
  costPrices: CurrencyRates;
  previousCostPrices: CurrencyRates;
  isLoading: boolean;
}

const CostPriceSection: React.FC<CostPriceSectionProps> = ({
  costPrices,
  previousCostPrices,
  isLoading
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-medium mb-4 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
        Cost Prices (NGN)
      </h2>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <CostPricePanel 
          costPrices={costPrices}
          previousCostPrices={previousCostPrices}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default CostPriceSection;
