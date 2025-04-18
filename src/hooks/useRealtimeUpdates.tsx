import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logUtils';

/**
 * Hook to subscribe to real-time updates for USDT/NGN rates and margin settings
 * Fixed to ensure cross-browser synchronization works properly
 */
export const useRealtimeUpdates = ({
  onUsdtRateChange,
  onMarginSettingsChange
}: {
  onUsdtRateChange: (rate: number) => void;
  onMarginSettingsChange: (usdMargin: number, otherCurrenciesMargin: number) => void;
}) => {
  // Keep track of the last processed rate update timestamp to avoid duplicate processing
  const lastProcessedTimestamp = useRef<string | null>(null);

  useEffect(() => {
    logger.info("Setting up real-time updates subscription");
    
    // Fixed channel configuration for reliable cross-client synchronization
    const channel = supabase
      .channel('public:usdt_ngn_rates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Only listen for new insertions - this is key for the refresh feature
          schema: 'public',
          table: 'usdt_ngn_rates'
        }, 
        (payload) => {
          logger.debug("Received real-time update from Supabase:", payload);
          
          if (!payload.new || typeof payload.new !== 'object') {
            logger.warn("Received invalid payload from Supabase real-time:", payload);
            return;
          }
          
          // Type check the payload
          const newPayload = payload.new as Record<string, unknown>;
          
          // Check if this is a valid rate update
          if ('rate' in newPayload && typeof newPayload.rate === 'number' && newPayload.rate > 0) {
            const rate = newPayload.rate;
            
            // Check for timestamp to ensure we only process newer updates
            const timestamp = newPayload.created_at as string;
            
            if (timestamp && (!lastProcessedTimestamp.current || timestamp > lastProcessedTimestamp.current)) {
              // Update our last processed timestamp
              lastProcessedTimestamp.current = timestamp;
              
              logger.info(`Real-time update: USDT/NGN rate changed to ${rate} (timestamp: ${timestamp})`);
              
              // Update the rate in the UI
              onUsdtRateChange(rate);
              
              // Show toast for real-time updates
              const sourceInfo = newPayload.source as string;
              const isManualUpdate = sourceInfo === 'manual' || sourceInfo === 'bybit';
              
              if (isManualUpdate) {
                toast.info("USDT/NGN rate updated", {
                  description: "Rate was refreshed by another user"
                });
              }
            } else {
              logger.debug("Skipping already processed rate update", { 
                timestamp, 
                lastProcessed: lastProcessedTimestamp.current 
              });
            }
          }
        }
      );
    
    // Set up margin settings channel in a similar way
    const marginChannel = supabase
      .channel('public:margin_settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'margin_settings'
        }, 
        (payload) => {
          logger.debug("Received margin settings update:", payload);
          
          if (!payload.new || typeof payload.new !== 'object') {
            logger.warn("Received invalid margin settings payload:", payload);
            return;
          }
          
          // Proper type checking to avoid TypeScript errors
          const newPayload = payload.new as Record<string, unknown>;
          const hasUsdMargin = 'usd_margin' in newPayload && newPayload.usd_margin !== null;
          const hasOtherMargin = 'other_currencies_margin' in newPayload && newPayload.other_currencies_margin !== null;
          
          if (hasUsdMargin && hasOtherMargin) {
            const usdMargin = Number(newPayload.usd_margin);
            const otherCurrenciesMargin = Number(newPayload.other_currencies_margin);
            
            if (!isNaN(usdMargin) && !isNaN(otherCurrenciesMargin)) {
              logger.info(`Real-time update: Margin settings changed to USD: ${usdMargin}%, Other: ${otherCurrenciesMargin}%`);
              onMarginSettingsChange(usdMargin, otherCurrenciesMargin);
              toast.info("Margin settings updated", {
                description: "Settings changed by another user"
              });
            }
          }
        }
      );
    
    // Subscribe to both channels and log the result
    channel.subscribe((status) => {
      logger.info(`Supabase USDT/NGN rates channel subscription status: ${status}`);
    });
    
    marginChannel.subscribe((status) => {
      logger.info(`Supabase margin settings channel subscription status: ${status}`);
    });

    // Cleanup function to remove the channels when component unmounts
    return () => {
      logger.info("Cleaning up real-time updates subscription");
      supabase.removeChannel(channel);
      supabase.removeChannel(marginChannel);
    };
  }, [onUsdtRateChange, onMarginSettingsChange]);
};
