
import React from 'react';
import ComparisonTable from '@/components/ComparisonTable';
import { VertoFXRates } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, WifiOff } from 'lucide-react';

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
  
  // Count how many currencies have valid buy rates
  const validBuyRateCount = Object.values(safeVertoRates).filter(rate => rate?.buy > 0).length;
  const validSellRateCount = Object.values(safeVertoRates).filter(rate => rate?.sell > 0).length;
  
  // Determine if we're using cached rates or have partial data
  const usingCachedRates = !hasVertoRates && !isLoading;
  const hasPartialData = hasVertoRates && (validBuyRateCount < currencies.length || validSellRateCount < currencies.length);
  
  return (
    <div className="space-y-4">
      {usingCachedRates && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <WifiOff className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800">
            Market comparison data may be outdated or incomplete. Using cached rates.
          </AlertDescription>
        </Alert>
      )}
      
      {hasPartialData && (
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-800">
            Some market comparison data may be incomplete. Showing available rates.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currencies.map((currency) => {
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
            <ComparisonTable
              key={currency}
              currencyCode={currency}
              oneremitRates={oneremitRates}
              vertoFxRates={vertoRates}
              isLoading={isLoading}
            />
          );
        })}
      </div>
    </div>
  );
};

export default MarketComparisonPanel;
