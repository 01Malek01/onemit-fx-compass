
import { useState } from 'react';
import { CurrencyRates, VertoFXRates } from '@/services/api';

export interface RateState {
  usdtNgnRate: number;
  fxRates: CurrencyRates;
  vertoFxRates: VertoFXRates;
  costPrices: CurrencyRates;
  previousCostPrices: CurrencyRates;
  lastUpdated: Date | null;
  isLoading: boolean;
}

export interface RateStateActions {
  setUsdtNgnRate: (rate: number) => void;
  setFxRates: (rates: CurrencyRates) => void;
  setVertoFxRates: (rates: VertoFXRates) => void;
  setCostPrices: (prices: CurrencyRates) => void;
  setPreviousCostPrices: (prices: CurrencyRates) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useRateState = (): [RateState, RateStateActions] => {
  // State variables
  const [usdtNgnRate, setUsdtNgnRate] = useState<number>(0);
  const [fxRates, setFxRates] = useState<CurrencyRates>({});
  const [vertoFxRates, setVertoFxRates] = useState<VertoFXRates>({});
  const [costPrices, setCostPrices] = useState<CurrencyRates>({});
  const [previousCostPrices, setPreviousCostPrices] = useState<CurrencyRates>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return [
    { 
      usdtNgnRate, 
      fxRates, 
      vertoFxRates, 
      costPrices, 
      previousCostPrices, 
      lastUpdated, 
      isLoading 
    },
    { 
      setUsdtNgnRate, 
      setFxRates, 
      setVertoFxRates, 
      setCostPrices, 
      setPreviousCostPrices, 
      setLastUpdated, 
      setIsLoading 
    }
  ];
};
