import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, compareRates, calculateDifference } from '@/utils/currencyUtils';
import { Badge } from '@/components/ui/badge';
import CurrencyFlag from '@/components/CurrencyFlag';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDown, ArrowUp } from 'lucide-react';
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
  const getBuyRateComparison = () => {
    // If either rate is 0 or missing, show the rate without comparison
    if (!vertoFxRates.buy || !oneremitRates.buy) {
      return <div>
          <div className="text-lg font-medium">{formatCurrency(oneremitRates.buy, 'NGN')}</div>
        </div>;
    }
    const isBetter = compareRates(oneremitRates.buy, vertoFxRates.buy, true);
    const diff = calculateDifference(oneremitRates.buy, vertoFxRates.buy);
    return <div className={isBetter ? 'rate-better' : 'rate-worse'}>
        <div className="text-lg font-medium">{formatCurrency(oneremitRates.buy, 'NGN')}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              
            </TooltipTrigger>
            <TooltipContent>
              <p>{isBetter ? 'Better than' : 'Worse than'} VertoFX by {Math.abs(diff).toFixed(2)}%</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>;
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
                <TableCell>{formatVertoRate(vertoFxRates.buy)}</TableCell>
                <TableCell>{formatVertoRate(vertoFxRates.sell)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>}
      </CardContent>
    </Card>;
};
export default ComparisonTable;