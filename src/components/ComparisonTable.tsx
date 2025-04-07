
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
  isLoading = false,
}) => {
  const getBuyRateComparison = () => {
    const isBetter = compareRates(oneremitRates.buy, vertoFxRates.buy, true);
    const diff = calculateDifference(oneremitRates.buy, vertoFxRates.buy);
    
    return (
      <div className={isBetter ? 'rate-better' : 'rate-worse'}>
        <div className="text-lg font-medium">{formatCurrency(oneremitRates.buy, 'NGN')}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={isBetter ? "success" : "destructive"} className="mt-1 gap-1 cursor-help">
                {isBetter ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
                {Math.abs(diff).toFixed(2)}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isBetter ? 'Better than' : 'Worse than'} VertoFX by {Math.abs(diff).toFixed(2)}%</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  const getSellRateComparison = () => {
    const isBetter = compareRates(oneremitRates.sell, vertoFxRates.sell, false);
    const diff = calculateDifference(oneremitRates.sell, vertoFxRates.sell);
    
    return (
      <div className={isBetter ? 'rate-better' : 'rate-worse'}>
        <div className="text-lg font-medium">{formatCurrency(oneremitRates.sell, 'NGN')}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={isBetter ? "success" : "destructive"} className="mt-1 gap-1 cursor-help">
                {isBetter ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(diff).toFixed(2)}%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isBetter ? 'Better than' : 'Worse than'} VertoFX by {Math.abs(diff).toFixed(2)}%</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  };

  return (
    <Card className="fx-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center">
          <CurrencyFlag currency={currencyCode} className="mr-2" />
          NGN/{currencyCode} Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 w-full skeleton-pulse"></div>
            <div className="h-20 w-full skeleton-pulse"></div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Provider</TableHead>
                <TableHead>Buy Rate (NGN → {currencyCode})</TableHead>
                <TableHead>Sell Rate ({currencyCode} → NGN)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="hover:bg-secondary/20">
                <TableCell className="font-medium">OneRemit</TableCell>
                <TableCell>{getBuyRateComparison()}</TableCell>
                <TableCell>{getSellRateComparison()}</TableCell>
              </TableRow>
              <TableRow className="hover:bg-secondary/20">
                <TableCell className="font-medium">VertoFX</TableCell>
                <TableCell>{formatCurrency(vertoFxRates.buy, 'NGN')}</TableCell>
                <TableCell>{formatCurrency(vertoFxRates.sell, 'NGN')}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonTable;
