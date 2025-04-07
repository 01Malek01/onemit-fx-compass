
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
  // Extended currency flag mapping with more currencies
  const getEmojiFlag = (currencyCode: string): string => {
    const flags: Record<string, string> = {
      USD: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      CAD: '🇨🇦',
      NGN: '🇳🇬',
      AUD: '🇦🇺',
      JPY: '🇯🇵',
      CNY: '🇨🇳',
      CHF: '🇨🇭',
      NZD: '🇳🇿',
      INR: '🇮🇳',
      BRL: '🇧🇷',
      ZAR: '🇿🇦',
      SGD: '🇸🇬',
      HKD: '🇭🇰',
      MXN: '🇲🇽',
      RUB: '🇷🇺',
      USDT: '💰', // Tether token
      BTC: '₿',   // Bitcoin symbol
      ETH: '⟠',   // Ethereum symbol
    };
    return flags[currencyCode] || '🌐'; // Default to globe emoji if currency not found
  };
  
  const sizeClass = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <span 
      className={`currency-flag ${sizeClass[size]} ${className}`} 
      aria-hidden="true"
      role="img"
      aria-label={`${currency} currency flag`}
    >
      {getEmojiFlag(currency)}
    </span>
  );
};

export default CurrencyFlag;
