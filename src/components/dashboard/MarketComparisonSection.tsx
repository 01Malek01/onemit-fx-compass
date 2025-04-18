
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComparisonTable from "@/components/ComparisonTable";
import { CurrencyRates } from '@/services/currency-rates/api';
import { VertoFXRates } from '@/services/currency-rates/api';

interface MarketComparisonSectionProps {
  costPrices: CurrencyRates;
  vertoFxRates: VertoFXRates | null;
  isLoading?: boolean;
}

// Component that displays market comparisons for different rates
const MarketComparisonSection: React.FC<MarketComparisonSectionProps> = ({
  costPrices,
  vertoFxRates,
  isLoading = false
}) => {
  // Create comparison data
  const createComparisonData = () => {
    // Format for table display
    return [
      {
        currency: "USD",
        ourRate: costPrices?.USD || "N/A",
        vertoFxBuy: vertoFxRates?.USD?.buy || "N/A",
        vertoFxSell: vertoFxRates?.USD?.sell || "N/A",
        difference: calculateDifference("USD")
      },
      {
        currency: "EUR",
        ourRate: costPrices?.EUR || "N/A",
        vertoFxBuy: vertoFxRates?.EUR?.buy || "N/A",
        vertoFxSell: vertoFxRates?.EUR?.sell || "N/A",
        difference: calculateDifference("EUR")
      },
      {
        currency: "GBP",
        ourRate: costPrices?.GBP || "N/A",
        vertoFxBuy: vertoFxRates?.GBP?.buy || "N/A",
        vertoFxSell: vertoFxRates?.GBP?.sell || "N/A",
        difference: calculateDifference("GBP")
      },
      {
        currency: "CAD",
        ourRate: costPrices?.CAD || "N/A",
        vertoFxBuy: vertoFxRates?.CAD?.buy || "N/A",
        vertoFxSell: vertoFxRates?.CAD?.sell || "N/A",
        difference: calculateDifference("CAD")
      }
    ];
  };

  // Calculate difference percentage between our rate and VertoFX rates
  const calculateDifference = (currency: keyof typeof vertoFxRates) => {
    if (!costPrices || !vertoFxRates || !vertoFxRates[currency]?.sell || !costPrices[currency]) {
      return "N/A";
    }

    const percentDiff = ((Number(costPrices[currency]) - Number(vertoFxRates[currency].sell)) / 
                         Number(vertoFxRates[currency].sell)) * 100;
    
    return percentDiff.toFixed(2) + '%';
  };

  // Get comparison data
  const comparisonData = createComparisonData();

  return (
    <Card className="overflow-hidden">
      <Tabs defaultValue="table">
        <div className="flex justify-between items-center border-b px-6 py-3">
          <h3 className="font-medium text-lg">Market Comparison</h3>
          <TabsList>
            <TabsTrigger value="table">
              Table
            </TabsTrigger>
            <TabsTrigger value="chart">
              Chart
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="table" className="m-0">
            <ComparisonTable data={comparisonData} isLoading={isLoading} />
          </TabsContent>
          
          <TabsContent value="chart" className="m-0 p-6">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Chart view coming soon
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default MarketComparisonSection;
