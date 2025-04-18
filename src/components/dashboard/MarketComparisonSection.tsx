
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import MarketComparisonPanel from '@/components/dashboard/MarketComparisonPanel';
import { VertoFXRates } from '@/services/api';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, TrendingUp, BarChartHorizontal, Activity, LineChart } from 'lucide-react';
import { loadVertoFxRates, isUsingDefaultVertoFxRates, getLastApiAttemptTime } from '@/utils/rates/vertoRateLoader';
import { useVertoFxRefresher } from '@/hooks/useVertoFxRefresher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RefreshCountdown from './rate-display/RefreshCountdown';
import TimestampDisplay from './rate-display/TimestampDisplay';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import RefreshButton from './rate-display/RefreshButton';
import { logger } from '@/utils/logUtils';
import { Badge } from '@/components/ui/badge';
import StatusAlerts from './rate-display/StatusAlerts';

// Update emoji array for refresh animations
const RATE_UPDATE_EMOJIS = [
  '🚀', // Rapid update
  '💹', // Chart increasing
  '🔥', // Fire (hot update)
  '✨', // Sparkles
  '💡', // Idea
  '🌟', // Glowing star
];

interface MarketComparisonSectionProps {
  currencies: string[];
  oneremitRatesFn: (currency: string) => { buy: number; sell: number };
  vertoFxRates: VertoFXRates;
  isLoading: boolean;
  setVertoFxRates: (rates: VertoFXRates) => void;
}

const MarketComparisonSection: React.FC<MarketComparisonSectionProps> = ({
  currencies,
  oneremitRatesFn,
  vertoFxRates,
  isLoading,
  setVertoFxRates
}) => {
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);
  const [showUpdateFlash, setShowUpdateFlash] = useState(false);
  
  const { 
    refreshVertoFxRates, 
    nextRefreshIn: vertoFxNextRefreshIn, 
    isRefreshing: vertoFxIsRefreshing,
    lastUpdated: vertoFxLastUpdated
  } = useVertoFxRefresher({
    vertoFxRates,
    setVertoFxRates
  });
  
  // Derive additional states based on available data
  const vertoFxIsLoading = isLoading;
  const vertoFxIsStale = false; // This should be calculated based on the time since last update
  const vertoFxIsFallback = isUsingDefaultVertoFxRates(); // Get this information from the util function
  const vertoFxRatesRefreshed = vertoFxRates;
  const vertoFxRateValue = vertoFxRates && Object.keys(vertoFxRates).length > 0 ? 1 : null;

  // Show update flash animation when rates refresh
  useEffect(() => {
    if (!vertoFxIsRefreshing && !isManuallyRefreshing) {
      setShowUpdateFlash(true);
      const timer = setTimeout(() => setShowUpdateFlash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [vertoFxLastUpdated, vertoFxIsRefreshing, isManuallyRefreshing]);

  // Pick a random emoji when the rate updates
  const updateEmoji = useMemo(() => {
    return showUpdateFlash 
      ? RATE_UPDATE_EMOJIS[Math.floor(Math.random() * RATE_UPDATE_EMOJIS.length)] 
      : null;
  }, [showUpdateFlash]);

  const handleManualRefresh = useCallback(async (): Promise<boolean> => {
    setIsManuallyRefreshing(true);
    try {
      // Always pass true to force a refresh when manually triggered
      const success = await refreshVertoFxRates(true);
      if (success) {
        toast({
          title: "Market comparison rates have been updated",
          variant: "default"
        });
      } else {
        toast({
          title: "Failed to refresh rates",
          description: "Please try again later",
          variant: "destructive"
        });
      }
      return success;
    } catch (error) {
      logger.error("Error refreshing rates:", error);
      toast({
        title: "An unexpected error occurred",
        description: "Could not refresh rates",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsManuallyRefreshing(false);
    }
  }, [refreshVertoFxRates]);

  return (
    <div className="relative overflow-hidden">
      <Card className="border border-gray-800/50 shadow-lg">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600/40 via-indigo-500/60 to-blue-600/40" />
        
        {/* Flash animation for updates */}
        {showUpdateFlash && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 animate-gradient-x pointer-events-none z-10" />
        )}
        
        <CardHeader className="pb-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-bold tracking-tight">
                Market Comparison
              </CardTitle>
              <Badge 
                className="bg-indigo-900/30 text-indigo-200 border border-indigo-700/30 text-xs px-2 py-0 h-5"
              >
                LIVE
              </Badge>
              {updateEmoji && (
                <span 
                  className="text-xl animate-bounce" 
                  role="img" 
                  aria-label="Rate update emoji"
                >
                  {updateEmoji}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton 
                onRefresh={handleManualRefresh}
                isLoading={isManuallyRefreshing || vertoFxIsRefreshing}
                variant="premium"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn("relative", (isLoading || vertoFxIsRefreshing) && "opacity-60 pointer-events-none")}>
            <MarketComparisonPanel 
              currencies={currencies} 
              oneremitRatesFn={oneremitRatesFn}
              vertoFxRates={vertoFxRatesRefreshed}
              isLoading={isLoading || vertoFxIsLoading || vertoFxIsRefreshing}
            />
            
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <LineChart className="h-3 w-3 text-blue-400" />
                  <span>MARKET RATES</span>
                </div>
                <TimestampDisplay 
                  lastUpdated={vertoFxLastUpdated}
                  rate={vertoFxRateValue}
                  isStale={vertoFxIsStale}
                />
              </div>
              
              <RefreshCountdown 
                nextRefreshIn={vertoFxNextRefreshIn} 
                isRefreshing={vertoFxIsRefreshing || isManuallyRefreshing}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-3">
        <StatusAlerts 
          rate={vertoFxRateValue} 
          isStale={vertoFxIsStale} 
        />
      </div>
    </div>
  );
};

export default MarketComparisonSection;
