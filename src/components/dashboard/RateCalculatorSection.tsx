import React from 'react';
import CurrencyInputPanel from '@/components/dashboard/CurrencyInputPanel';
import { Skeleton } from '@/components/ui/skeleton';

interface RateCalculatorSectionProps {
  usdtNgnRate: number | null;
  lastUpdated: Date | null;
  usdMargin: number;
  otherCurrenciesMargin: number;
  onBybitRateRefresh: () => Promise<boolean>;
  onMarginUpdate: (usdMargin: number, otherMargin: number) => void;
  isLoading: boolean;
}

const RateCalculatorSection: React.FC<RateCalculatorSectionProps> = ({
  usdtNgnRate,
  lastUpdated,
  usdMargin,
  otherCurrenciesMargin,
  onBybitRateRefresh,
  onMarginUpdate,
  isLoading
}) => {
  return (
    <>
      {isLoading && usdtNgnRate === null ? (
        <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900/80 p-6">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <CurrencyInputPanel 
          usdtNgnRate={usdtNgnRate}
          lastUpdated={lastUpdated}
          usdMargin={usdMargin}
          otherCurrenciesMargin={otherCurrenciesMargin}
          onBybitRateRefresh={onBybitRateRefresh}
          onMarginUpdate={onMarginUpdate}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default RateCalculatorSection;
