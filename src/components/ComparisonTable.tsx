
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, compareRates, calculateDifference } from '@/utils/currencyUtils';
import { Badge } from '@/components/ui/badge';
import CurrencyFlag from '@/components/CurrencyFlag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp, AlertTriangle } from 'lucide-react';

interface Rate {
  buy: number;
  sell: number;
}

interface ComparisonTableProps {
  currencyCode: string;
  oneremitRates: Rate;
  vertoFxRates: Rate;
  isLoading?: boolean;
  isUsingDefaultRates?: boolean;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currencyCode,
  oneremitRates,
  vertoFxRates,
  isLoading = false,
  isUsingDefaultRates = false
}) => {
  // Log the incoming rates for debugging
  console.log(`ComparisonTable for ${currencyCode}:`, {
    oneremitRates,
    vertoFxRates,
    isUsingDefaultRates
  });

  // Define default values based on currency
  const getDefaultRates = (currency: string): Rate => {
    switch (currency) {
      case 'USD':
        return { buy: 1635, sell: 1600 };
      case 'EUR':
        return { buy: 1870, sell: 1805 };
      case 'GBP':
        return { buy: 2150, sell: 2080 };
      case 'CAD':
        return { buy: 1190, sell: 1140 };
      default:
        return { buy: 1600, sell: 1550 };
    }
  };

  // Safety check for valid rates with currency-specific defaults
  const safeOneremitRates = {
    buy: oneremitRates?.buy || 0,
    sell: oneremitRates?.sell || 0
  };
  
  const defaultRates = getDefaultRates(currencyCode);
  const safeVertoRates = {
    buy: (vertoFxRates?.buy > 0) ? vertoFxRates.buy : defaultRates.buy,
    sell: (vertoFxRates?.sell > 0) ? vertoFxRates.sell : defaultRates.sell
  };

  const getBuyRateComparison = () => {
    try {
      // If oneremit rate is 0 or missing, just show placeholder
      if (!safeOneremitRates.buy) {
        return <div className="text-lg font-medium">-</div>;
      }
      
      // If verto rate is 0 or missing, just show the oneremit rate without comparison
      if (!safeVertoRates.buy) {
        return <div className="text-lg font-medium">{formatCurrency(safeOneremitRates.buy, 'NGN')}</div>;
      }
      
      // Both rates available, do the comparison
      const isBetter = compareRates(safeOneremitRates.buy, safeVertoRates.buy, true);
      const diff = calculateDifference(safeOneremitRates.buy, safeVertoRates.buy);
      
      return (
        <div className={isBetter ? 'rate-better' : 'rate-worse'}>
          <div className="text-lg font-medium text-emerald-500">{formatCurrency(safeOneremitRates.buy, 'NGN')}</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge className={`text-xs ${isBetter ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
                  {isBetter ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                  {isNaN(diff) ? '0.00' : Math.abs(diff).toFixed(2)}%
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBetter ? 'Better than' : 'Worse than'} VertoFX by {isNaN(diff) ? '0.00' : Math.abs(diff).toFixed(2)}%</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      );
    } catch (error) {
      console.error(`Error rendering buy rate comparison for ${currencyCode}:`, error);
      return <div className="text-lg font-medium">{formatCurrency(safeOneremitRates.buy || 0, 'NGN')}</div>;
    }
  };
  
  const getSellRateComparison = () => {
    // Display 0 NGN for sell rates as requested
    return <div>
        <div className="text-lg font-medium">NGN 0.00</div>
      </div>;
  };

  // Function to format VertoFX rates with handling for 0 values
  const formatVertoRate = (rate: number) => {
    if (!rate) return "-"; // Show dash for missing rates
    return formatCurrency(rate, 'NGN');
  };
  
  // Handle errors in the entire component render
  try {
    return (
      <Card className="fx-card bg-[#111119]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <CurrencyFlag currency={currencyCode} className="mr-2" />
            NGN/{currencyCode} Comparison
            {isUsingDefaultRates && (
              <Badge variant="outline" className="ml-2 bg-red-500/10 text-white text-xs px-2 py-0">
                Default data
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-6 w-full skeleton-pulse"></div>
              <div className="h-20 w-full skeleton-pulse"></div>
            </div>
          ) : (
            <div className="text-sm">
              <div className="flex border-b border-gray-700 py-3">
                <div className="w-1/3 font-medium text-gray-400">Provider</div>
                <div className="w-1/3 font-medium text-gray-400">Buy Rate (NGN → {currencyCode})</div>
                <div className="w-1/3 font-medium text-gray-400">Sell Rate ({currencyCode} → NGN)</div>
              </div>
              
              <div className="flex border-b border-gray-700 py-4 items-center">
                <div className="w-1/3 font-medium">Oneremit</div>
                <div className="w-1/3">{getBuyRateComparison()}</div>
                <div className="w-1/3">{getSellRateComparison()}</div>
              </div>
              
              <div className="flex py-4 items-center">
                <div className="w-1/3 font-medium">VertoFX</div>
                <div className="w-1/3 text-lg font-medium">{formatVertoRate(safeVertoRates.buy)}</div>
                <div className="w-1/3 text-lg font-medium">{formatVertoRate(safeVertoRates.sell)}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error(`Critical error rendering ComparisonTable for ${currencyCode}:`, error);
    // Fallback UI that won't crash
    return (
      <Card className="fx-card bg-red-50 border-red-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center text-red-700">
            <AlertTriangle className="mr-2 h-5 w-5" />
            NGN/{currencyCode} Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-700">
            <p>Error displaying comparison data</p>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default ComparisonTable;
