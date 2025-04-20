import React from 'react';
import ComparisonTable from '@/components/ComparisonTable';
import { VertoFXRates, DEFAULT_VERTOFX_RATES } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, WifiOff, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  // Ensure vertoFxRates is never undefined by providing default values
  const safeVertoRates: VertoFXRates = vertoFxRates && Object.keys(vertoFxRates).length > 0 
    ? vertoFxRates 
    : DEFAULT_VERTOFX_RATES;
  
  // Check if we have valid VertoFX rates (any rate > 0)
  const hasVertoRates = Object.values(safeVertoRates).some(rate => 
    (rate?.buy > 0 || rate?.sell > 0)
  );
  
  // Check if we're using defaults by comparing with our DEFAULT_VERTOFX_RATES
  const isUsingDefaults = currencies.every(currency => 
    safeVertoRates[currency]?.buy === DEFAULT_VERTOFX_RATES[currency]?.buy &&
    safeVertoRates[currency]?.sell === DEFAULT_VERTOFX_RATES[currency]?.sell
  );
  
  // Count how many currencies have valid buy rates
  const validBuyRateCount = Object.values(safeVertoRates).filter(rate => rate?.buy > 0).length;
  const validSellRateCount = Object.values(safeVertoRates).filter(rate => rate?.sell > 0).length;
  
  // Determine if we're using cached rates or have partial data
  const usingCachedRates = !hasVertoRates && !isLoading;
  const hasPartialData = hasVertoRates && (validBuyRateCount < currencies.length || validSellRateCount < currencies.length);
  
  return (
    <div className="space-y-6">
      {/* Status alerts */}
      <div className="space-y-2.5">
        {isUsingDefaults && (
          <Alert className="border-none bg-gradient-to-r from-red-950/60 to-red-900/40 text-red-100 shadow-lg shadow-red-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="bg-red-900/60 p-1.5 rounded-md">
                <WifiOff className="h-4 w-4 text-red-300" />
              </div>
              <AlertDescription className="text-red-100 font-medium">
                Market data connection failed — showing default rates
              </AlertDescription>
            </div>
            <div className="pl-9 mt-1 text-xs text-red-300/80">
              Rates displayed may not reflect current market conditions
            </div>
          </Alert>
        )}
        
        {usingCachedRates && !isUsingDefaults && (
          <Alert className="border-none bg-gradient-to-r from-amber-950/60 to-amber-900/40 text-amber-100 shadow-lg shadow-amber-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="bg-amber-900/60 p-1.5 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-300" />
              </div>
              <AlertDescription className="text-amber-100 font-medium">
                Using cached market data — information may be outdated
              </AlertDescription>
            </div>
          </Alert>
        )}
        
        {hasPartialData && !isUsingDefaults && (
          <Alert className="border-none bg-gradient-to-r from-blue-950/60 to-blue-900/40 text-blue-100 shadow-lg shadow-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="bg-blue-900/60 p-1.5 rounded-md">
                <AlertTriangle className="h-4 w-4 text-blue-300" />
              </div>
              <AlertDescription className="text-blue-100 font-medium">
                Some market data is incomplete — showing available rates
              </AlertDescription>
            </div>
          </Alert>
        )}
      </div>
      
      {/* Comparison tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currencies.map((currency, index) => {
          // Make sure we have valid rates, otherwise use fallback values
          const oneremitRates = oneremitRatesFn(currency);
          
          // Use the rates from our safe object, or default values if currency not found
          const defaultRate = { buy: currency === 'USD' ? 1635 : 
                               currency === 'EUR' ? 1870 : 
                               currency === 'GBP' ? 2150 : 1190, 
                              sell: currency === 'USD' ? 1600 : 
                                   currency === 'EUR' ? 1805 : 
                                   currency === 'GBP' ? 2080 : 1140 };
          
          const vertoRates = safeVertoRates[currency] || defaultRate;
          
          return (
            <div 
              key={currency} 
              className={cn(
                "animate-slide-up transition-all duration-300",
                "bg-gray-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-800",
                "hover:border-gray-700/60 hover:shadow-md"
              )} 
              style={{animationDelay: `${index * 100}ms`}}
            >
              <ComparisonTable
                currencyCode={currency}
                oneremitRates={oneremitRates}
                vertoFxRates={vertoRates}
                isLoading={isLoading}
                isUsingDefaultRates={isUsingDefaults}
              />
            </div>
          );
        })}
      </div>
      
      {/* Additional information for default rates */}
      {isUsingDefaults && (
        <div className="mt-6 animate-fade-in transition-all duration-300" style={{animationDelay: '300ms'}}>
          <div className="rounded-lg border border-gray-800 bg-gray-900/30 p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-blue-900/60 p-2 rounded-md flex-shrink-0">
                <RefreshCw className="h-4 w-4 text-blue-300" />
              </div>
              <div>
                <h3 className="text-blue-100 font-medium text-sm mb-1.5">Try refreshing market data</h3>
                <p className="text-xs text-blue-200/80 leading-relaxed">
                  Default rates shown are estimates based on typical market spreads and may not reflect 
                  current conditions. Click the refresh button to reconnect to the market data API.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketComparisonPanel;
