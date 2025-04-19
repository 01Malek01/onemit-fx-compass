
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/logUtils';
import { useNotifications } from '@/contexts/NotificationContext';

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
  const { addNotification } = useNotifications();

  useEffect(() => {
    logger.info("Setting up real-time updates subscription");
    
    // Create a single channel for both tables - this is more reliable
    const channel = supabase
      .channel('realtime-sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Listen for new inserts - crucial for refresh functionality
          schema: 'public',
          table: 'usdt_ngn_rates'
        }, 
        (payload) => {
          logger.debug("Received USDT/NGN rate update:", payload);
          
          if (!payload.new || typeof payload.new !== 'object') {
            logger.warn("Invalid payload received:", payload);
            return;
          }
          
          const newPayload = payload.new as Record<string, unknown>;
          
          if ('rate' in newPayload && typeof newPayload.rate === 'number' && newPayload.rate > 0) {
            const rate = newPayload.rate;
            const timestamp = newPayload.created_at as string;
            
            logger.info(`Real-time update: New USDT/NGN rate detected: ${rate}`);
            
            // Update the UI with the new rate
            onUsdtRateChange(rate);
            
            // Show notification
            addNotification({
              title: "USDT/NGN rate updated",
              description: "Rate was refreshed by another user",
              type: "info"
            });
          }
        }
      )
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
            logger.warn("Invalid margin settings payload:", payload);
            return;
          }
          
          const newPayload = payload.new as Record<string, unknown>;
          const hasUsdMargin = 'usd_margin' in newPayload && newPayload.usd_margin !== null;
          const hasOtherMargin = 'other_currencies_margin' in newPayload && newPayload.other_currencies_margin !== null;
          
          if (hasUsdMargin && hasOtherMargin) {
            const usdMargin = Number(newPayload.usd_margin);
            const otherCurrenciesMargin = Number(newPayload.other_currencies_margin);
            
            if (!isNaN(usdMargin) && !isNaN(otherCurrenciesMargin)) {
              logger.info(`Real-time update: Margin settings changed to USD: ${usdMargin}%, Other: ${otherCurrenciesMargin}%`);
              onMarginSettingsChange(usdMargin, otherCurrenciesMargin);
              
              // Show notification
              addNotification({
                title: "Margin settings updated",
                description: "Settings changed by another user",
                type: "info"
              });
            }
          }
        }
      );
    
    // Subscribe to the channel and log the status
    channel.subscribe((status) => {
      logger.info(`Supabase real-time subscription status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        logger.info('✅ Real-time updates successfully enabled');
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('❌ Failed to enable real-time updates');
        
        // Show error notification
        addNotification({
          title: "Real-time sync error",
          description: "Changes may not update automatically",
          type: "error"
        });
      }
    });

    // Cleanup function to remove the channel when component unmounts
    return () => {
      logger.info("Cleaning up real-time updates subscription");
      supabase.removeChannel(channel);
    };
  }, [onUsdtRateChange, onMarginSettingsChange, addNotification]);
};
