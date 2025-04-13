
import { useState, useCallback } from 'react';
import { updateMarginSettings } from '@/services/margin-settings-service';
import { saveHistoricalRates } from '@/services/historical-rates-service';
import { CurrencyRates } from '@/services/api';

interface MarginManagerProps {
  usdtNgnRate: number | null;
  costPrices: CurrencyRates;
  fxRates: CurrencyRates;
  calculateAllCostPrices: (usdMargin: number, otherCurrenciesMargin: number) => void;
  initialUsdMargin?: number;
  initialOtherCurrenciesMargin?: number;
}

export const useMarginManager = ({
  usdtNgnRate,
  costPrices,
  fxRates,
  calculateAllCostPrices,
  initialUsdMargin = 2.5,
  initialOtherCurrenciesMargin = 3.0
}: MarginManagerProps) => {
  // Margins state
  const [usdMargin, setUsdMargin] = useState<number>(initialUsdMargin);
  const [otherCurrenciesMargin, setOtherCurrenciesMargin] = useState<number>(initialOtherCurrenciesMargin);
  
  // Handle margin updates
  const handleMarginUpdate = useCallback(async (newUsdMargin: number, newOtherMargin: number) => {
    console.log("MarginManager: Updating margins:", { newUsdMargin, newOtherMargin });
    // Update local state
    setUsdMargin(newUsdMargin);
    setOtherCurrenciesMargin(newOtherMargin);
    
    // Save margins to database
    const success = await updateMarginSettings(newUsdMargin, newOtherMargin);
    console.log("Margin update success:", success);
    
    // Recalculate prices with new margins
    if (success) {
      calculateAllCostPrices(newUsdMargin, newOtherMargin);
      
      // Save historical data after margin update with source="manual"
      try {
        if (usdtNgnRate && Object.keys(costPrices).length > 0) {
          await saveHistoricalRates(
            usdtNgnRate,
            newUsdMargin,
            newOtherMargin,
            fxRates,
            costPrices,
            'manual'
          );
          console.log("Historical data saved after margin update");
        }
      } catch (error) {
        console.error("Error saving historical data after margin update:", error);
      }
    }
  }, [usdtNgnRate, costPrices, fxRates, calculateAllCostPrices]);

  return {
    usdMargin,
    otherCurrenciesMargin,
    setUsdMargin,
    setOtherCurrenciesMargin,
    handleMarginUpdate
  };
};
