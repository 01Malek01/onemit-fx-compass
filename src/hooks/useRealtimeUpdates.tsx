
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to subscribe to real-time updates for USDT/NGN rates and margin settings
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
    
    // Create a channel for our real-time subscriptions
    const channel = supabase
      .channel('fx-terminal-updates')
      // Subscribe to USDT/NGN rate changes (INSERT or UPDATE)
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'usdt_ngn_rates'
        }, 
        (payload) => {
          console.log("Real-time: New USDT/NGN rate received:", payload);
          const newRate = payload.new?.rate;
          if (newRate && typeof newRate === 'number' && newRate > 0) {
            onUsdtRateChange(newRate);
            toast.info("USDT/NGN rate has been updated");
          }
        }
      )
      // Subscribe to margin settings changes
      .on('postgres_changes', 
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'margin_settings'
        }, 
        (payload) => {
          console.log("Real-time: Margin settings updated:", payload);
          const usdMargin = payload.new?.usd_margin;
          const otherCurrenciesMargin = payload.new?.other_currencies_margin;
          
          if (usdMargin !== undefined && otherCurrenciesMargin !== undefined) {
            onMarginSettingsChange(Number(usdMargin), Number(otherCurrenciesMargin));
            toast.info("Margin settings have been updated");
          }
        }
      )
      // Also listen for new margin settings
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'margin_settings'
        }, 
        (payload) => {
          console.log("Real-time: New margin settings received:", payload);
          const usdMargin = payload.new?.usd_margin;
          const otherCurrenciesMargin = payload.new?.other_currencies_margin;
          
          if (usdMargin !== undefined && otherCurrenciesMargin !== undefined) {
            onMarginSettingsChange(Number(usdMargin), Number(otherCurrenciesMargin));
            toast.info("Margin settings have been updated");
          }
        }
      )
      .subscribe();

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log("Cleaning up real-time subscriptions");
      supabase.removeChannel(channel);
    };
  }, [onUsdtRateChange, onMarginSettingsChange]);
};
