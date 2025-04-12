
import React from 'react';
import CurrencyInput from '@/components/CurrencyInput';
import MarginControls from '@/components/MarginControls';

interface CurrencyInputPanelProps {
  usdtNgnRate: number | null;
  setUsdtNgnRate: (rate: number) => void;
  usdMargin: number;
  otherCurrenciesMargin: number;
  onUsdtRateUpdate: (rate: number) => void; // Update type to accept a value parameter
  onMarginUpdate: (usdMargin: number, otherMargin: number) => void;
  isLoading: boolean;
}

const CurrencyInputPanel: React.FC<CurrencyInputPanelProps> = ({
  usdtNgnRate,
  setUsdtNgnRate,
  usdMargin,
  otherCurrenciesMargin,
  onUsdtRateUpdate,
  onMarginUpdate,
  isLoading
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="md:col-span-1">
        <CurrencyInput
          label="USDT/NGN Rate"
          value={usdtNgnRate}
          onChange={setUsdtNgnRate}
          onSubmit={onUsdtRateUpdate} // This will now pass the value from CurrencyInput
          isLoading={isLoading}
          autoFocus={true}
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
