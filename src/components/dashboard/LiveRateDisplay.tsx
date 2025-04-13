
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface LiveRateDisplayProps {
  rate: number | null;
  lastUpdated: Date | null;
  onRefresh: () => Promise<void>;
  isLoading: boolean;
}

const LiveRateDisplay: React.FC<LiveRateDisplayProps> = ({
  rate,
  lastUpdated,
  onRefresh,
  isLoading
}) => {
  // Format the rate with comma separators
  const formattedRate = rate ? 
    new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(rate) : '₦0.00';
  
  // Format the last updated time
  const lastUpdatedText = lastUpdated ? 
    formatDistanceToNow(lastUpdated, { addSuffix: true }) : 
    'never';

  return (
    <Card className="fx-card relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" 
        aria-hidden="true"
      />
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <div className="relative">
            {rate ? (
              <>
                <div className="absolute -left-1 -top-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </>
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            )}
          </div>
          USDT/NGN Rate (Live from Bybit)
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-2xl font-bold">
              {rate ? formattedRate : 'Unavailable'}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              Last updated: {lastUpdatedText}
              {!rate && lastUpdated && <span className="text-amber-400">(Using fallback)</span>}
            </p>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm" 
            disabled={isLoading}
            className="gap-1.5 relative overflow-hidden"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {!rate && (
          <div className="mt-2 text-xs py-1.5 px-2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-md flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Rate information unavailable. Using last known rate or default.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveRateDisplay;
