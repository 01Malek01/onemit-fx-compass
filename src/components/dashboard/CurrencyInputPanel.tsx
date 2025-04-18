import React from 'react';
import MarginControls from '@/components/MarginControls';
import LiveRateDisplay from '@/components/dashboard/LiveRateDisplay';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CurrencyInputPanelProps {
  usdtNgnRate: number | null;
  lastUpdated: Date | null;
  usdMargin: number;
  otherCurrenciesMargin: number;
  onBybitRateRefresh: () => Promise<boolean>;
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
    <div className={cn(
      "rounded-xl overflow-hidden border border-gray-800 bg-gray-900/80 backdrop-blur-sm",
      "relative"
    )}>
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-900/40 via-blue-500/60 to-blue-900/40" />
      
      {/* Background subtle grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjkuNSAzMC41aDEiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSg1MCw1MCw1MCwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-10" />
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800/70 flex items-center gap-3">
        <div className="p-2 bg-blue-900/30 rounded-lg">
          <Calculator className="h-5 w-5 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-100">Rate Calculator</h2>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          
          <div className="lg:col-span-3">
            <MarginControls
              usdMargin={usdMargin}
              otherCurrenciesMargin={otherCurrenciesMargin}
              onUpdate={onMarginUpdate}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyInputPanel;
