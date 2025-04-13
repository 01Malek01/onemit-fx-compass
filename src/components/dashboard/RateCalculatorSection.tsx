
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp } from 'lucide-react';
import CurrencyInputPanel from '@/components/dashboard/CurrencyInputPanel';
import { Skeleton } from '@/components/ui/skeleton';

interface RateCalculatorSectionProps {
  usdtNgnRate: number | null;
  lastUpdated: Date | null;
  usdMargin: number;
  otherCurrenciesMargin: number;
  onBybitRateRefresh: () => Promise<boolean>; // Updated to match the actual return type
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
            lastUpdated={lastUpdated}
            usdMargin={usdMargin}
            otherCurrenciesMargin={otherCurrenciesMargin}
            onBybitRateRefresh={onBybitRateRefresh}
            onMarginUpdate={onMarginUpdate}
            isLoading={isLoading}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default RateCalculatorSection;
