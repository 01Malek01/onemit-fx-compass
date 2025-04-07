
import React from 'react';

interface CurrencyFlagProps {
  currency: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CurrencyFlag: React.FC<CurrencyFlagProps> = ({ 
  currency, 
  size = 'md',
  className = '' 
}) => {
  const getEmojiFlag = (currencyCode: string): string => {
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      CAD: '🇨🇦',
      NGN: '🇳🇬',
    };
    return flags[currencyCode] || '';
  };
  
  const sizeClass = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <span className={`currency-flag ${sizeClass[size]} ${className}`} aria-hidden="true">
      {getEmojiFlag(currency)}
    </span>
  );
};

export default CurrencyFlag;
