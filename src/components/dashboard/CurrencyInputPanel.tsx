
import React from 'react';
import MarginControls from '@/components/MarginControls';
import LiveRateDisplay from '@/components/dashboard/LiveRateDisplay';

interface CurrencyInputPanelProps {
  usdtNgnRate: number | null;
  lastUpdated: Date | null;
  usdMargin: number;
  otherCurrenciesMargin: number;
  onBybitRateRefresh: () => Promise<void>;
  onMarginUpdate: (usdMargin: number, otherMargin: number) => void;
  isLoading: boolean;
}

const CurrencyInputPanel: React.FC<CurrencyInputPanelProps> = ({
  usdtNgnRate,
  lastUpdated,
  usdMargin,
  otherCurrenciesMargin,
  onBybitRateRefresh,
  onMarginUpdate,
  isLoading
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="md:col-span-1">
        <LiveRateDisplay
          rate={usdtNgnRate}
          lastUpdated={lastUpdated}
          onRefresh={onBybitRateRefresh}
          isLoading={isLoading}
        />
      </div>
      
      <div className="md:col-span-2">
        <MarginControls
          usdMargin={usdMargin}
          otherCurrenciesMargin={otherCurrenciesMargin}
          onUpdate={onMarginUpdate}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default CurrencyInputPanel;
