
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time updates for USDT/NGN rates and margin settings
 * Optimized for performance by combining subscriptions
 */
export const useRealtimeUpdates = ({
  onUsdtRateChange,
  onMarginSettingsChange
}: {
  onUsdtRateChange: (rate: number) => void;
  onMarginSettingsChange: (usdMargin: number, otherCurrenciesMargin: number) => void;
}) => {
  useEffect(() => {
    console.log("Setting up real-time subscriptions for rates and margins");
    
    // Create a single channel for our real-time subscriptions
    // Using a combined channel reduces connection overhead
    const channel = supabase
      .channel('fx-terminal-updates')
      // Subscribe to USDT/NGN rate changes (INSERT or UPDATE)
      .on('postgres_changes', 
        {
          event: '*', // Listen for both INSERT and UPDATE
          schema: 'public',
          table: 'usdt_ngn_rates'
        }, 
        (payload) => {
          console.log("Real-time: USDT/NGN rate change detected");
          // Add proper type checking before accessing properties
          const newRate = payload.new && 'rate' in payload.new ? payload.new.rate : null;
          if (newRate && typeof newRate === 'number' && newRate > 0) {
            onUsdtRateChange(newRate);
            
            // Only show the toast once the rate actually changes (debounced)
            const debounceToast = setTimeout(() => {
              toast.info("USDT/NGN rate has been updated");
            }, 300);
            
            return () => clearTimeout(debounceToast);
          }
        }
      )
      // Subscribe to margin settings changes (combining INSERT and UPDATE)
      .on('postgres_changes', 
        {
          event: '*', // Listen for both INSERT and UPDATE
          schema: 'public',
          table: 'margin_settings'
        }, 
        (payload) => {
          console.log("Real-time: Margin settings change detected");
          // Add proper type checking before accessing properties
          const usdMargin = payload.new && 'usd_margin' in payload.new ? payload.new.usd_margin : null;
          const otherCurrenciesMargin = payload.new && 'other_currencies_margin' in payload.new 
            ? payload.new.other_currencies_margin 
            : null;
          
          if (usdMargin !== null && otherCurrenciesMargin !== null) {
            onMarginSettingsChange(Number(usdMargin), Number(otherCurrenciesMargin));
            toast.info("Margin settings have been updated");
          }
        }
      )
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log("Cleaning up real-time subscriptions");
      supabase.removeChannel(channel);
    };
  }, [onUsdtRateChange, onMarginSettingsChange]);
};
