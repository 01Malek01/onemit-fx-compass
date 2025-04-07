
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import CurrencyInput from '@/components/CurrencyInput';
import CurrencyCard from '@/components/CurrencyCard';
import ComparisonTable from '@/components/ComparisonTable';
import MarginControls from '@/components/MarginControls';
import { Separator } from '@/components/ui/separator';
import { toast } from "sonner";

import { 
  fetchUsdtNgnRate, 
  fetchFxRates, 
  fetchVertoFXRates,
  updateUsdtNgnRate,
  CurrencyRates,
  VertoFXRates 
} from '@/services/api';
import { 
  calculateCostPrice, 
  applyMargin 
} from '@/utils/currencyUtils';

const Index = () => {
  // State variables
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const [usdtNgnRate, setUsdtNgnRate] = useState<number>(0);
  const [fxRates, setFxRates] = useState<CurrencyRates>({});
  const [vertoFxRates, setVertoFxRates] = useState<VertoFXRates>({});
  
  const [usdMargin, setUsdMargin] = useState<number>(2.5);
  const [otherCurrenciesMargin, setOtherCurrenciesMargin] = useState<number>(3.0);
  
  const [costPrices, setCostPrices] = useState<CurrencyRates>({});
  const [previousCostPrices, setPreviousCostPrices] = useState<CurrencyRates>({});

  // Fee constants (could be made editable in future)
  const USDT_TO_USD_FEE = 0.01; // 1%
  const USD_TO_TARGET_FEE = 0.005; // 0.5%

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Recalculate cost prices when rates or margins change
  useEffect(() => {
    if (usdtNgnRate && Object.keys(fxRates).length) {
      calculateAllCostPrices();
    }
  }, [usdtNgnRate, fxRates, usdMargin, otherCurrenciesMargin]);

  // Load all data from APIs
  const loadAllData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch USDT/NGN rate
      const usdtRate = await fetchUsdtNgnRate();
      setUsdtNgnRate(usdtRate);
      
      // Fetch FX rates
      const rates = await fetchFxRates();
      setFxRates(rates);
      
      // Fetch VertoFX rates
      const vertoRates = await fetchVertoFXRates();
      setVertoFxRates(vertoRates);
      
      setLastUpdated(new Date());
      toast.success("All rates updated successfully");
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load some data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refresh button click
  const handleRefresh = () => {
    loadAllData();
  };

  // Handle USDT/NGN rate update
  const handleUsdtRateUpdate = async () => {
    setIsLoading(true);
    
    try {
      const success = await updateUsdtNgnRate(usdtNgnRate);
      if (success) {
        setLastUpdated(new Date());
        toast.success("USDT/NGN rate updated successfully");
      }
    } catch (error) {
      console.error("Error updating USDT/NGN rate:", error);
      toast.error("Failed to update USDT/NGN rate");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate all cost prices
  const calculateAllCostPrices = () => {
    if (!usdtNgnRate) return;
    
    // Store previous cost prices for comparison
    setPreviousCostPrices({ ...costPrices });
    
    const newCostPrices: CurrencyRates = {};
    
    // Calculate USD cost price
    const usdCostPrice = calculateCostPrice(
      usdtNgnRate,
      USDT_TO_USD_FEE,
      1, // USD/USD is 1
      USD_TO_TARGET_FEE
    );
    
    // Apply margin to USD
    newCostPrices.USD = applyMargin(usdCostPrice, usdMargin);
    
    // Calculate other currencies
    for (const [currency, rate] of Object.entries(fxRates)) {
      if (currency === "USD") continue;
      
      const costPrice = calculateCostPrice(
        usdtNgnRate,
        USDT_TO_USD_FEE,
        rate,
        USD_TO_TARGET_FEE
      );
      
      // Apply margin to other currencies
      newCostPrices[currency] = applyMargin(costPrice, otherCurrenciesMargin);
    }
    
    setCostPrices(newCostPrices);
  };

  // Handle margin updates
  const handleMarginUpdate = (newUsdMargin: number, newOtherMargin: number) => {
    setUsdMargin(newUsdMargin);
    setOtherCurrenciesMargin(newOtherMargin);
    toast.success("Margins updated successfully");
  };

  // Generate OneRemit rates based on cost prices
  const getOneRemitRates = (currencyCode: string): { buy: number; sell: number } => {
    const costPrice = costPrices[currencyCode] || 0;
    
    // In a real scenario, buy/sell would be calculated based on spread
    // For now, using a simple 2% spread for demonstration
    return {
      buy: costPrice,
      sell: costPrice * 0.98, // 2% lower for sell rate
    };
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Header 
        lastUpdated={lastUpdated} 
        onRefresh={handleRefresh} 
        isLoading={isLoading} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="md:col-span-1">
          <CurrencyInput
            label="USDT/NGN Rate"
            value={usdtNgnRate}
            onChange={setUsdtNgnRate}
            onSubmit={handleUsdtRateUpdate}
            isLoading={isLoading}
            autoFocus={true}
          />
        </div>
        
        <div className="md:col-span-2">
          <MarginControls
            usdMargin={usdMargin}
            otherCurrenciesMargin={otherCurrenciesMargin}
            onUpdate={handleMarginUpdate}
            isLoading={isLoading}
          />
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4 mt-8">Cost Prices (NGN)</h2>
      <div className="dashboard-grid mb-8">
        {['USD', 'EUR', 'GBP', 'CAD'].map((currency) => (
          <CurrencyCard
            key={currency}
            currencyCode={currency}
            ngnValue={costPrices[currency] || 0}
            previousValue={previousCostPrices[currency]}
            isLoading={isLoading}
          />
        ))}
      </div>
      
      <Separator className="my-8" />
      
      <h2 className="text-xl font-semibold mb-4">Market Comparison</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {['USD', 'EUR', 'GBP', 'CAD'].map((currency) => (
          <ComparisonTable
            key={currency}
            currencyCode={currency}
            oneremitRates={getOneRemitRates(currency)}
            vertoFxRates={vertoFxRates[currency] || { buy: 0, sell: 0 }}
            isLoading={isLoading}
          />
        ))}
      </div>
    </div>
  );
};

export default Index;
