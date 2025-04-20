import React from 'react';
import { VertoFXRates, VertoFxRate } from '@/services/vertofx';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface MarketComparisonSectionProps {
  vertoFxRates: VertoFXRates | null;
  currentRate: number | null;
  isLoading: boolean;
}

const MarketComparisonSection: React.FC<MarketComparisonSectionProps> = ({
  vertoFxRates,
  currentRate,
  isLoading
}) => {
  const { toast } = useToast();

  const renderComparison = (rates: VertoFXRates) => {
    // Ensure rates is properly typed and has the required properties
    if (!rates || typeof rates !== 'object') return null;

    const rateValue = typeof rates.USD === 'number' ? rates.USD : 0;
    const showHigherRate = rateValue > (currentRate || 0);

    return (
      <Card className="border-2">
        <CardHeader>
          <CardTitle>
            Verto FX <Badge className="ml-2">USD</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-4 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {rateValue ? rateValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) : 'N/A'}
              </div>
              {showHigherRate && (
                <div className="text-sm text-green-500 mt-1">
                  <span className="font-bold">Recommended!</span> Higher rate
                  than current.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
      {renderComparison(vertoFxRates || {})}
    </div>
  );
};

export default MarketComparisonSection;
