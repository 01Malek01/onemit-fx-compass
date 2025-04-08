
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
    sm: 'h-4 w-5',
    md: 'h-5 w-6',
    lg: 'h-6 w-7'
  };

  const countryCode = getCountryCode(currency);
  
  // Special cases for crypto
  if (countryCode === 'BTC') {
    return (
      <div 
        className={`inline-flex items-center justify-center ${sizeClass[size]} rounded ${className} bg-amber-600 text-white font-bold`} 
        aria-label={`${currency} currency symbol`}
      >
        ₿
      </div>
    );
  }
  
  if (countryCode === 'ETH') {
    return (
      <div 
        className={`inline-flex items-center justify-center ${sizeClass[size]} rounded ${className} bg-indigo-600 text-white font-bold`} 
        aria-label={`${currency} currency symbol`}
      >
        Ξ
      </div>
    );
  }

  if (countryCode === 'EU') {
    // Special handling for EUR flag
    return (
      <div className={`${sizeClass[size]} rounded overflow-hidden ${className} currency-flag`}>
        <img 
          src="https://flagcdn.com/w80/eu.png" 
          alt="EUR flag"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Use the country-flag-icons library via CDN for other flags
  return (
    <div className={`${sizeClass[size]} rounded overflow-hidden ${className} currency-flag`}>
      <img 
        src={`https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
        alt={`${currency} flag`}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </div>
  );
};

export default CurrencyFlag;
