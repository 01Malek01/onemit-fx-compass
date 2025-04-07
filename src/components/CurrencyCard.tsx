
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';

interface CurrencyCardProps {
  currencyCode: string;
  ngnValue: number;
  previousValue?: number;
  isLoading?: boolean;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({
  currencyCode,
  ngnValue,
  previousValue,
  isLoading = false,
}) => {
  const getChangeIndicator = () => {
    if (!previousValue || ngnValue === previousValue) return null;

    const isIncrease = ngnValue > previousValue;
    const changePercent = Math.abs(((ngnValue - previousValue) / previousValue) * 100).toFixed(2);
    
    return (
      <div className={`flex items-center text-sm ${isIncrease ? 'text-danger' : 'text-success'}`}>
        {isIncrease ? (
          <ArrowUp className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDown className="h-4 w-4 mr-1" />
        )}
        {changePercent}%
      </div>
    );
  };

  return (
    <Card className={`fx-card ${isLoading ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-base flex justify-between items-center">
          <span>NGN/{currencyCode}</span>
          {getChangeIndicator()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-full skeleton-pulse"></div>
        ) : (
          <div className="text-2xl font-bold">
            {formatCurrency(ngnValue, 'NGN')}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1.5">
          Cost per 1 {currencyCode}
        </p>
      </CardContent>
    </Card>
  );
};

export default CurrencyCard;
