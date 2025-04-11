
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp } from 'lucide-react';
import CurrencyInputPanel from '@/components/dashboard/CurrencyInputPanel';
import { Skeleton } from '@/components/ui/skeleton';

interface RateCalculatorSectionProps {
  usdtNgnRate: number | null;
  setUsdtNgnRate: (rate: number) => void;
  usdMargin: number;
  otherCurrenciesMargin: number;
  onUsdtRateUpdate: () => void;
  onMarginUpdate: (usdMargin: number, otherMargin: number) => void;
  isLoading: boolean;
}

const RateCalculatorSection: React.FC<RateCalculatorSectionProps> = ({
  usdtNgnRate,
  setUsdtNgnRate,
  usdMargin,
  otherCurrenciesMargin,
  onUsdtRateUpdate,
  onMarginUpdate,
  isLoading
}) => {
  return (
    <Card className="fx-card">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <ArrowDownUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium">Rate Calculator</h2>
        </div>
        
        {isLoading && usdtNgnRate === null ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <CurrencyInputPanel 
            usdtNgnRate={usdtNgnRate}
            setUsdtNgnRate={setUsdtNgnRate}
            usdMargin={usdMargin}
            otherCurrenciesMargin={otherCurrenciesMargin}
            onUsdtRateUpdate={onUsdtRateUpdate}
            onMarginUpdate={onMarginUpdate}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RateCalculatorSection;
