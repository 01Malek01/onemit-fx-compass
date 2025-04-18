import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logUtils';

/**
 * Hook to subscribe to real-time updates for USDT/NGN rates and margin settings
 * Performance optimized with better type checking and reduced overhead
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
    
    // Single channel with better error handling for real-time updates
    const channel = supabase
      .channel('fx-rates-updates')
      // More efficient subscription with tighter type checking
      .on('postgres_changes', 
        {
          event: '*', 
          schema: 'public',
          table: 'usdt_ngn_rates'
        }, 
        (payload) => {
          if (!payload.new || typeof payload.new !== 'object') {
            logger.warn("Received invalid payload from Supabase real-time:", payload);
            return;
          }
          
          // Proper type checking to avoid TypeScript errors
          const newPayload = payload.new as Record<string, unknown>;
          
          // Check if this is a rate update
          if ('rate' in newPayload && typeof newPayload.rate === 'number' && newPayload.rate > 0) {
            const rate = newPayload.rate;
            
            // Check for timestamp to ensure we only process newer updates
            const timestamp = newPayload.created_at as string;
            
            if (timestamp && (!lastProcessedTimestamp.current || timestamp > lastProcessedTimestamp.current)) {
              // Update our last processed timestamp
              lastProcessedTimestamp.current = timestamp;
              
              logger.info(`Real-time update: USDT/NGN rate changed to ${rate}`);
              onUsdtRateChange(rate);
              
              // Show toast for real-time updates from other users
              // Using a short delay to prevent rapid toasts
              const debounceToast = setTimeout(() => {
                toast.info("USDT/NGN rate updated", {
                  description: "Rate refreshed from another user"
                });
              }, 200);
              
              return () => clearTimeout(debounceToast);
            } else {
              logger.debug("Skipping already processed rate update", { timestamp, lastProcessed: lastProcessedTimestamp.current });
            }
          }
        }
      )
      // Improved margin settings subscription with proper type checking
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'margin_settings'
        }, 
        (payload) => {
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
      )
      .subscribe((status) => {
        logger.info(`Supabase real-time subscription status: ${status}`);
      });

    // Cleanup function to remove the channel when component unmounts
    return () => {
      logger.info("Cleaning up real-time updates subscription");
      supabase.removeChannel(channel);
    };
  }, [onUsdtRateChange, onMarginSettingsChange]);
};
