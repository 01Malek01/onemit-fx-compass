import { CurrencyRates } from "@/services/api";
import { updateCurrentCostPrices } from "@/services/api";
import {
  calculateUsdPrice,
  calculateOtherCurrencyPrice,
} from "@/utils/currencyUtils";
import { logger } from "@/utils/logUtils";
import { supabase } from "@/integrations/supabase/client";

export interface CostPriceCalculatorProps {
  usdtNgnRate: number | null;
  fxRates: CurrencyRates;
  setCostPrices: (prices: CurrencyRates) => void;
  setPreviousCostPrices: (prices: CurrencyRates) => void;
  costPrices: CurrencyRates;
}

// ✅ Helper function to compare prices
const havePricesChanged = (
  newPrices: CurrencyRates,
  oldPrices: CurrencyRates
): boolean => {
  return (
    newPrices.USD !== oldPrices.USD ||
    newPrices.EUR !== oldPrices.EUR ||
    newPrices.GBP !== oldPrices.GBP ||
    newPrices.CAD !== oldPrices.CAD
  );
};

export const useCostPriceCalculator = ({
  usdtNgnRate,
  fxRates,
  setCostPrices,
  setPreviousCostPrices,
  costPrices,
}: CostPriceCalculatorProps) => {
  // ✅ Function to save prices to Supabase
  const saveCostPricesToSupabase = async (prices: CurrencyRates) => {
    const { error } = await supabase.from("fx_prices").upsert(
      {
        id: 1,
        usd_price: prices.USD,
        gbp_price: prices.GBP,
        eur_price: prices.EUR,
        cad_price: prices.CAD,
        updated_at: new Date(),
      },
      { onConflict: "id" } // ensures updating the same row
    );

    if (error) {
      console.error(
        "❌ Failed to save cost prices to Supabase:",
        error.message
      );
    } else {
      console.log("✅ Cost prices saved to Supabase.");
    }
  };

  const calculateAllCostPrices = (
    usdMargin: number,
    otherCurrenciesMargin: number
  ) => {
    console.log("📥 calculateAllCostPrices called with:", {
      usdtNgnRate,
      fxRates,
      usdMargin,
      otherCurrenciesMargin,
    });

    if (!usdtNgnRate || isNaN(Number(usdtNgnRate)) || usdtNgnRate <= 0) {
      logger.warn(
        "Skipping cost price calculation due to invalid USDT/NGN rate:",
        usdtNgnRate
      );
      return;
    }

    if (Object.keys(fxRates).length === 0) {
      logger.warn("No FX rates available for calculations");
      return;
    }

    const newCostPrices: CurrencyRates = {
      USD: calculateUsdPrice(usdtNgnRate, usdMargin),
      EUR: calculateOtherCurrencyPrice(
        usdtNgnRate,
        fxRates.EUR,
        otherCurrenciesMargin
      ),
      GBP: calculateOtherCurrencyPrice(
        usdtNgnRate,
        fxRates.GBP,
        otherCurrenciesMargin
      ),
      CAD: calculateOtherCurrencyPrice(
        usdtNgnRate,
        fxRates.CAD,
        otherCurrenciesMargin
      ),
    };

    if (process.env.NODE_ENV !== "production") {
      logger.debug("🧮 Calculated new cost prices:", newCostPrices);
    }

    const pricesChanged = havePricesChanged(newCostPrices, costPrices);

    // ✅ Store old prices and update new ones in state
    setPreviousCostPrices({ ...costPrices });
    setCostPrices(newCostPrices);
    updateCurrentCostPrices(newCostPrices);

    if (pricesChanged) {
      console.log("✅ Prices changed. Saving to Supabase...");
      saveCostPricesToSupabase(newCostPrices);
    } else {
      console.log("🟡 No changes in cost prices. Skipping DB update.");
    }
  };

  return { calculateAllCostPrices };
};
