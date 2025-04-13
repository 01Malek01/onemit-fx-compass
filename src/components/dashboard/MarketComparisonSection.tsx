
import React from 'react';
import MarketComparisonPanel from '@/components/dashboard/MarketComparisonPanel';
import { VertoFXRates } from '@/services/api';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { loadVertoFxRates, isUsingDefaultVertoFxRates, getLastApiAttemptTime } from '@/utils/rates/vertoRateLoader';

interface MarketComparisonSectionProps {
  currencies: string[];
  oneremitRatesFn: (currency: string) => { buy: number; sell: number };
  vertoFxRates: VertoFXRates;
  isLoading: boolean;
}

const MarketComparisonSection: React.FC<MarketComparisonSectionProps> = ({
  currencies,
  oneremitRatesFn,
  vertoFxRates,
  isLoading
}) => {
  // State to track retry button loading state
  const [retryLoading, setRetryLoading] = React.useState(false);
  // State to track if we're using default rates
  const [usingDefaults, setUsingDefaults] = React.useState(isUsingDefaultVertoFxRates());
  // State to track the last API attempt time
  const [lastAttemptTime, setLastAttemptTime] = React.useState(getLastApiAttemptTime());
  
  // Update states initially and when props change
  React.useEffect(() => {
    setUsingDefaults(isUsingDefaultVertoFxRates());
    setLastAttemptTime(getLastApiAttemptTime());
  }, [vertoFxRates]);
  
  // Calculate cooldown time remaining
  const cooldownRemaining = React.useMemo(() => {
    const now = Date.now();
    const elapsed = now - lastAttemptTime;
    const cooldownPeriod = 30000; // 30 seconds
    return Math.max(0, cooldownPeriod - elapsed);
  }, [lastAttemptTime]);
  
  // Handler for manually refreshing VertoFX rates
  const handleRefreshVertoFxRates = async () => {
    if (cooldownRemaining > 0 || retryLoading) return;
    
    setRetryLoading(true);
    try {
      // We need a temporary state updater for the loadVertoFxRates function
      const tempSetRates = (rates: VertoFXRates) => {
        // This will be handled by the parent component's state management
      };
      
      await loadVertoFxRates(false, tempSetRates);
      
      // Update our local tracking states
      setUsingDefaults(isUsingDefaultVertoFxRates());
      setLastAttemptTime(getLastApiAttemptTime());
    } catch (error) {
      console.error("Error refreshing VertoFX rates:", error);
    } finally {
      setRetryLoading(false);
    }
  };
  
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-medium mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Market Comparison
        </div>
        
        <Button 
          onClick={handleRefreshVertoFxRates} 
          variant="outline" 
          size="sm" 
          className="gap-1.5 text-gray-300 border-gray-700 hover:bg-gray-800 transition-all duration-300 hover:shadow-md"
          disabled={cooldownRemaining > 0 || retryLoading}
        >
          <RefreshCw className={`h-4 w-4 ${retryLoading ? 'animate-spin' : ''}`} />
          {retryLoading 
            ? 'Refreshing...' 
            : cooldownRemaining > 0 
              ? `Retry in ${Math.ceil(cooldownRemaining / 1000)}s` 
              : 'Refresh rates'
          }
        </Button>
      </h2>
      <MarketComparisonPanel 
        currencies={currencies} 
        oneremitRatesFn={oneremitRatesFn}
        vertoFxRates={vertoFxRates}
        isLoading={isLoading || retryLoading}
      />
    </div>
  );
};

export default MarketComparisonSection;
