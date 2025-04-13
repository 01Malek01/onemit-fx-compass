
import React from 'react';
import ComparisonTable from '@/components/ComparisonTable';
import { VertoFXRates } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, WifiOff, Info } from 'lucide-react';
import { toast } from 'sonner';

interface MarketComparisonPanelProps {
  currencies: string[];
  oneremitRatesFn: (currency: string) => { buy: number; sell: number };
  vertoFxRates: VertoFXRates;
  isLoading: boolean;
}

// Default rates to use as fallback
const DEFAULT_VERTOFX_RATES: VertoFXRates = {
  USD: { buy: 1635, sell: 1600 },
  EUR: { buy: 1870, sell: 1805 },
  GBP: { buy: 2150, sell: 2080 },
  CAD: { buy: 1190, sell: 1140 }
};

const MarketComparisonPanel: React.FC<MarketComparisonPanelProps> = ({
  currencies,
  oneremitRatesFn,
  vertoFxRates,
  isLoading
}) => {
  // Log the VertoFX rates for debugging
  console.log("MarketComparisonPanel received vertoFxRates:", vertoFxRates);
  
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
    <div className="space-y-4">
      {isUsingDefaults && (
        <Alert className="bg-red-50/10 border-red-500/20 text-red-100 animate-fade-in">
          <WifiOff className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-100">
            <strong>Market comparison data unavailable.</strong> VertoFX API connection failed. Showing default rates.
          </AlertDescription>
        </Alert>
      )}
      
      {usingCachedRates && !isUsingDefaults && (
        <Alert variant="default" className="bg-amber-50/10 border-amber-500/20 text-amber-100 animate-fade-in">
          <WifiOff className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-100">
            Market comparison data may be outdated or incomplete. Using cached rates.
          </AlertDescription>
        </Alert>
      )}
      
      {hasPartialData && !isUsingDefaults && (
        <Alert variant="default" className="bg-blue-50/10 border-blue-500/20 text-blue-100 animate-fade-in">
          <AlertTriangle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-100">
            Some market comparison data may be incomplete. Showing available rates.
          </AlertDescription>
        </Alert>
      )}
      
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
          
          console.log(`MarketComparisonPanel: Currency ${currency}`, {
            oneremitRates,
            vertoRates
          });
          
          return (
            <div key={currency} className="animate-slide-up" style={{animationDelay: `${index * 100}ms`}}>
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
      
      {isUsingDefaults && (
        <div className="mt-4 animate-fade-in" style={{animationDelay: '300ms'}}>
          <Alert variant="default" className="bg-blue-50/10 border-blue-500/20 text-blue-100">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-100">
              Default rates are based on typical market spreads and may not reflect current conditions. 
              Please refresh to attempt reconnection to VertoFX API.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default MarketComparisonPanel;
