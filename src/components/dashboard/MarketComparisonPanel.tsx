
import React from 'react';
import ComparisonTable from '@/components/ComparisonTable';
import { VertoFXRates } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

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
  // Log the VertoFX rates for debugging
  console.log("MarketComparisonPanel received vertoFxRates:", vertoFxRates);
  
  // Check if we have valid VertoFX rates
  const hasVertoRates = Object.values(vertoFxRates).some(rate => 
    (rate.buy > 0 || rate.sell > 0)
  );
  
  return (
    <div className="space-y-4">
      {!hasVertoRates && !isLoading && (
        <Alert variant="default" className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800">
            Market comparison data may be outdated or incomplete. Using cached rates.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currencies.map((currency) => {
          // Make sure we have valid rates, otherwise use fallback values
          const oneremitRates = oneremitRatesFn(currency);
          const vertoRates = vertoFxRates[currency] || { buy: 0, sell: 0 };
          
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
