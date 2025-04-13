
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CurrencyFlag from './CurrencyFlag';

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
  isLoading = false
}) => {
  const valueRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (valueRef.current && previousValue !== undefined && previousValue !== ngnValue) {
      valueRef.current.classList.remove('animate-count');
      // Force reflow
      void valueRef.current.offsetWidth;
      valueRef.current.classList.add('animate-count');
    }
  }, [ngnValue, previousValue]);
  
  const getChangeIndicator = () => {
    if (!previousValue || ngnValue === previousValue) return null;
    const isIncrease = ngnValue > previousValue;
    const changePercent = Math.abs((ngnValue - previousValue) / previousValue * 100).toFixed(2);
    
    return (
      <div 
        className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${isIncrease ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}
        aria-label={`${isIncrease ? 'Increased' : 'Decreased'} by ${changePercent}%`}
      >
        {isIncrease ? 
          <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" /> : 
          <TrendingDown className="h-3 w-3 mr-1" aria-hidden="true" />
        }
        {changePercent}%
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card className={`fx-card relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px] ${isLoading ? 'opacity-70' : ''}`}>
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${previousValue && ngnValue > previousValue ? 'from-danger/30 via-danger to-danger/30' : previousValue && ngnValue < previousValue ? 'from-success/30 via-success to-success/30' : 'from-primary/30 via-primary to-primary/30'}`}></div>
        
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-base flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <CurrencyFlag currency={currencyCode} size="md" className="mr-1.5" />
              <span className="font-medium">NGN/{currencyCode}</span>
            </div>
            {getChangeIndicator()}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-4 pt-0">
          {isLoading ? (
            <div className="h-8 w-full skeleton-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-white" ref={valueRef}>
              {formatCurrency(ngnValue, 'NGN')}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default CurrencyCard;
