
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Info } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CurrencyCardProps {
  currencyCode: string;
  ngnValue: number;
  previousValue?: number;
  isLoading?: boolean;
}

// Helper function to get flag emoji
const getFlagEmoji = (currencyCode: string): string => {
  const flags: Record<string, string> = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    CAD: '🇨🇦',
    NGN: '🇳🇬',
  };
  return flags[currencyCode] || '';
};

const CurrencyCard: React.FC<CurrencyCardProps> = ({
  currencyCode,
  ngnValue,
  previousValue,
  isLoading = false,
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
    const changePercent = Math.abs(((ngnValue - previousValue) / previousValue) * 100).toFixed(2);
    
    return (
      <div className={`flex items-center text-xs font-medium ${isIncrease ? 'text-danger' : 'text-success'}`}
           aria-label={`${isIncrease ? 'Increased' : 'Decreased'} by ${changePercent}%`}>
        {isIncrease ? (
          <ArrowUp className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
        )}
        {changePercent}%
      </div>
    );
  };

  const cardStyles = "fx-card relative transform transition-all duration-300 hover:translate-y-[-2px]";

  return (
    <TooltipProvider>
      <Card className={`${cardStyles} ${isLoading ? 'opacity-70' : ''}`}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30"></div>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-base flex justify-between items-center">
            <div className="flex items-center">
              <span className="mr-1.5" aria-hidden="true">{getFlagEmoji(currencyCode)}</span>
              <span className="font-medium">NGN/{currencyCode}</span>
            </div>
            {getChangeIndicator()}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {isLoading ? (
            <div className="h-8 w-full skeleton-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-white" ref={valueRef}>
              {formatCurrency(ngnValue, 'NGN')}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              Cost per 1 {currencyCode}
            </p>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground" aria-label="More information">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Includes all fees and applied margin</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default CurrencyCard;
