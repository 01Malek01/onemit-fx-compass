
import React from 'react';

interface RateValueProps {
  rate: number | null;
  showUpdateFlash: boolean;
}

const RateValue: React.FC<RateValueProps> = ({ rate, showUpdateFlash }) => {
  // Format the rate with comma separators
  const formattedRate = rate ? 
    new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rate) : '₦0.00';

  return (
    <div className={`text-2xl font-bold ${showUpdateFlash ? 'text-primary' : ''} transition-colors duration-500`}>
      {rate ? formattedRate : 'Unavailable'}
    </div>
  );
};

export default RateValue;
