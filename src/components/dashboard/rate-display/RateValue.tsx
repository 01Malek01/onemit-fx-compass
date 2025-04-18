import React from 'react';
import { cn } from '@/lib/utils';

interface RateValueProps {
  rate: number | null;
  showUpdateFlash: boolean;
  customClasses?: string;
}

const RateValue: React.FC<RateValueProps> = ({ rate, showUpdateFlash, customClasses }) => {
  // Format the rate with comma separators
  const formattedRate = rate ? 
    new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rate) : '₦0.00';

  return (
    <div className={cn(
      `font-bold ${showUpdateFlash ? 'text-primary' : ''} transition-colors duration-500`,
      customClasses || 'text-2xl'
    )}>
      {rate ? formattedRate : 'Unavailable'}
    </div>
  );
};

export default RateValue;
