
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, compareRates, calculateDifference } from '@/utils/currencyUtils';

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
        {formatCurrency(oneremitRates.buy, 'NGN')}
        <span className="text-xs block">
          {isBetter ? 'Better by ' : 'Worse by '}{Math.abs(diff).toFixed(2)}%
        </span>
      </div>
    );
  };

  const getSellRateComparison = () => {
    const isBetter = compareRates(oneremitRates.sell, vertoFxRates.sell, false);
    const diff = calculateDifference(oneremitRates.sell, vertoFxRates.sell);
    
    return (
      <div className={isBetter ? 'rate-better' : 'rate-worse'}>
        {formatCurrency(oneremitRates.sell, 'NGN')}
        <span className="text-xs block">
          {isBetter ? 'Better by ' : 'Worse by '}{Math.abs(diff).toFixed(2)}%
        </span>
      </div>
    );
  };

  return (
    <Card className="fx-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">NGN/{currencyCode} Comparison</CardTitle>
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
                <TableHead>Provider</TableHead>
                <TableHead>Buy Rate (NGN → {currencyCode})</TableHead>
                <TableHead>Sell Rate ({currencyCode} → NGN)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">OneRemit</TableCell>
                <TableCell>{getBuyRateComparison()}</TableCell>
                <TableCell>{getSellRateComparison()}</TableCell>
              </TableRow>
              <TableRow>
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
