
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  useEffect(() => {
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
          if (!payload.new || typeof payload.new !== 'object') return;
          
          // Proper type checking to avoid TypeScript errors
          const newPayload = payload.new as Record<string, unknown>;
          if ('rate' in newPayload && typeof newPayload.rate === 'number' && newPayload.rate > 0) {
            const rate = newPayload.rate;
            onUsdtRateChange(rate);
            
            // Optimized toast with shorter timeout
            const debounceToast = setTimeout(() => {
              toast.info("USDT/NGN rate updated");
            }, 200);
            
            return () => clearTimeout(debounceToast);
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
          if (!payload.new || typeof payload.new !== 'object') return;
          
          // Proper type checking to avoid TypeScript errors
          const newPayload = payload.new as Record<string, unknown>;
          const hasUsdMargin = 'usd_margin' in newPayload && newPayload.usd_margin !== null;
          const hasOtherMargin = 'other_currencies_margin' in newPayload && newPayload.other_currencies_margin !== null;
          
          if (hasUsdMargin && hasOtherMargin) {
            const usdMargin = Number(newPayload.usd_margin);
            const otherCurrenciesMargin = Number(newPayload.other_currencies_margin);
            
            if (!isNaN(usdMargin) && !isNaN(otherCurrenciesMargin)) {
              onMarginSettingsChange(usdMargin, otherCurrenciesMargin);
              toast.info("Margin settings updated");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUsdtRateChange, onMarginSettingsChange]);
};
