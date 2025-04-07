
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
  // Get ISO country code from currency code
  const getCountryCode = (currencyCode: string): string => {
    const countryMap: Record<string, string> = {
      USD: 'US',
      EUR: 'EU',
      GBP: 'GB',
      CAD: 'CA',
      NGN: 'NG',
      AUD: 'AU',
      JPY: 'JP',
      CNY: 'CN',
      CHF: 'CH',
      NZD: 'NZ',
      INR: 'IN',
      BRL: 'BR',
      ZAR: 'ZA',
      SGD: 'SG',
      HKD: 'HK',
      MXN: 'MX',
      RUB: 'RU',
      USDT: 'US', // Using US flag for USDT
      BTC: 'BTC', // Special case
      ETH: 'ETH', // Special case
    };
    return countryMap[currencyCode] || 'UNKNOWN';
  };
  
  const sizeClass = {
    sm: 'h-3 w-4',
    md: 'h-4 w-6',
    lg: 'h-5 w-7'
  };

  const countryCode = getCountryCode(currency);
  
  // Special cases for crypto
  if (countryCode === 'BTC') {
    return (
      <span 
        className={`inline-flex items-center justify-center ${sizeClass[size]} rounded ${className}`} 
        aria-label={`${currency} currency symbol`}
      >
        ₿
      </span>
    );
  }
  
  if (countryCode === 'ETH') {
    return (
      <span 
        className={`inline-flex items-center justify-center ${sizeClass[size]} rounded ${className}`} 
        aria-label={`${currency} currency symbol`}
      >
        ⟠
      </span>
    );
  }

  // Use the country-flag-icons library via CDN
  const flagUrl = `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  
  return (
    <img 
      src={flagUrl}
      alt={`${currency} currency flag`}
      className={`currency-flag rounded-sm object-cover ${sizeClass[size]} ${className}`}
      style={{ objectFit: 'cover' }}
    />
  );
};

export default CurrencyFlag;
