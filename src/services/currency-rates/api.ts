
import axios from 'axios';
import { CurrencyRate } from './types';

/**
 * Type for currency rates object (from external API)
 */
export type CurrencyRates = Record<string, number>;

/**
 * Default API endpoint for currency rates
 */
const API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

/**
 * Fetch currency rates from the API
 */
export const fetchCurrencyRates = async (): Promise<CurrencyRates> => {
  try {
    const response = await axios.get(API_URL);
    
    // Type check for the response structure
    if (
      response.data && 
      typeof response.data === 'object' && 
      'rates' in response.data && 
      response.data.rates && 
      typeof response.data.rates === 'object'
    ) {
      // At this point, we've verified rates exists and is an object
      const rates = response.data.rates as Record<string, number>;
      return rates;
    }
    
    throw new Error('Invalid rates data structure from API');
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    // Return a minimal set of default rates as fallback
    return { 
      USD: 1.0, 
      EUR: 0.92, 
      GBP: 0.79, 
      CAD: 1.37 
    };
  }
};

export interface VertoFXRates {
  USD: { buy: number; sell: number };
  EUR: { buy: number; sell: number };
  GBP: { buy: number; sell: number };
  CAD: { buy: number; sell: number };
}

const VERTO_FX_API_URL = 'https://api.verto.exchange/v1/rate/all';

export const fetchVertoFXRates = async (): Promise<VertoFXRates> => {
  try {
    const response = await axios.get(VERTO_FX_API_URL);
    
    if (
      response.data &&
      typeof response.data === 'object' &&
      'data' in response.data &&
      Array.isArray(response.data.data)
    ) {
      const ratesData = response.data.data;
      const rates: VertoFXRates = {
        USD: { buy: 0, sell: 0 },
        EUR: { buy: 0, sell: 0 },
        GBP: { buy: 0, sell: 0 },
        CAD: { buy: 0, sell: 0 },
      };
      
      ratesData.forEach((item: any) => {
        const { currencyPair, buy, sell } = item;
        
        if (typeof currencyPair === 'string' && currencyPair.endsWith('NGN')) {
          const currency = currencyPair.substring(0, 3);
          
          if (['USD', 'EUR', 'GBP', 'CAD'].includes(currency)) {
            rates[currency as keyof VertoFXRates] = {
              buy: typeof buy === 'number' ? buy : 0,
              sell: typeof sell === 'number' ? sell : 0,
            };
          }
        }
      });
      
      return rates;
    } else if (response.data && response.data.error === 'Rate limit exceeded') {
      // Set a flag in local storage to indicate rate limiting
      const resetTime = Date.now() + (60 * 60 * 1000); // 1 hour
      localStorage.setItem('vertofx_rate_limit_reset', resetTime.toString());
      throw new Error('VertoFX API rate limit exceeded');
    } else {
      throw new Error('Invalid VertoFX rates data structure from API');
    }
  } catch (error) {
    console.error('Error fetching VertoFX rates:', error);
    throw error;
  }
};
