
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
}
const ComparisonTable: React.FC<ComparisonTableProps> = ({
  currencyCode,
  oneremitRates,
  vertoFxRates,
  isLoading = false
}) => {
  // Log the incoming rates for debugging
  console.log(`ComparisonTable for ${currencyCode}:`, {
    oneremitRates,
    vertoFxRates
  });

  // Safety check for valid rates
  const safeOneremitRates = {
    buy: oneremitRates?.buy || 0,
    sell: oneremitRates?.sell || 0
  };
  
  const safeVertoRates = {
    buy: vertoFxRates?.buy || 0,
    sell: vertoFxRates?.sell || 0
  };

  const getBuyRateComparison = () => {
    try {
      // If either rate is 0 or missing, show the rate without comparison
      if (!safeVertoRates.buy || !safeOneremitRates.buy) {
        return <div>
            <div className="text-lg font-medium">{formatCurrency(safeOneremitRates.buy, 'NGN')}</div>
          </div>;
      }
      const isBetter = compareRates(safeOneremitRates.buy, safeVertoRates.buy, true);
      const diff = calculateDifference(safeOneremitRates.buy, safeVertoRates.buy);
      return <div className={isBetter ? 'rate-better' : 'rate-worse'}>
          <div className="text-lg font-medium">{formatCurrency(safeOneremitRates.buy, 'NGN')}</div>
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
        </div>;
    } catch (error) {
      console.error(`Error rendering buy rate comparison for ${currencyCode}:`, error);
      return <div>
          <div className="text-lg font-medium">{formatCurrency(safeOneremitRates.buy, 'NGN')}</div>
        </div>;
    }
  };
  
  const getSellRateComparison = () => {
    // Display 0 NGN for sell rates as requested
    return <div>
        <div className="text-lg font-medium">{formatCurrency(0, 'NGN')}</div>
      </div>;
  };

  // Function to format VertoFX rates with handling for 0 values
  const formatVertoRate = (rate: number) => {
    if (!rate) return "-"; // Show dash for missing rates
    return formatCurrency(rate, 'NGN');
  };
  
  // Handle errors in the entire component render
  try {
    return <Card className="fx-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <CurrencyFlag currency={currencyCode} className="mr-2" />
            NGN/{currencyCode} Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="space-y-2">
              <div className="h-6 w-full skeleton-pulse"></div>
              <div className="h-20 w-full skeleton-pulse"></div>
            </div> : <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Provider</TableHead>
                  <TableHead>Buy Rate (NGN → {currencyCode})</TableHead>
                  <TableHead>Sell Rate ({currencyCode} → NGN)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="hover:bg-secondary/20">
                  <TableCell className="font-medium">Oneremit</TableCell>
                  <TableCell>{getBuyRateComparison()}</TableCell>
                  <TableCell>{getSellRateComparison()}</TableCell>
                </TableRow>
                <TableRow className="hover:bg-secondary/20">
                  <TableCell className="font-medium">VertoFX</TableCell>
                  <TableCell>{formatVertoRate(safeVertoRates.buy)}</TableCell>
                  <TableCell>{formatVertoRate(safeVertoRates.sell)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>}
        </CardContent>
      </Card>;
  } catch (error) {
    console.error(`Critical error rendering ComparisonTable for ${currencyCode}:`, error);
    // Fallback UI that won't crash
    return <Card className="fx-card bg-red-50 border-red-200">
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
      </Card>;
  }
};
export default ComparisonTable;
