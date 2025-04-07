
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
      <div className={`flex items-center text-xs font-medium ${isIncrease ? 'text-danger' : 'text-success'}`}>
        {isIncrease ? (
          <ArrowUp className="h-3.5 w-3.5 mr-1" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 mr-1" />
        )}
        {changePercent}%
      </div>
    );
  };

  return (
    <Card className={`fx-card ${isLoading ? 'opacity-70' : ''} overflow-hidden`}>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-base flex justify-between items-center">
          <span className="font-medium">NGN/{currencyCode}</span>
          {getChangeIndicator()}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {isLoading ? (
          <div className="h-8 w-full skeleton-pulse"></div>
        ) : (
          <div className="text-2xl font-bold text-white">
            {formatCurrency(ngnValue, 'NGN')}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Cost per 1 {currencyCode}
        </p>
      </CardContent>
    </Card>
  );
};

export default CurrencyCard;
