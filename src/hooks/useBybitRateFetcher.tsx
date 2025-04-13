
import { toast } from "sonner";
import { fetchBybitRateWithRetry } from '@/services/bybit/bybit-utils';
import { saveUsdtNgnRate } from '@/services/usdt-ngn-service';
import { useCallback } from 'react';

interface BybitRateFetcherProps {
  setUsdtNgnRate: (rate: number) => void;
  setLastUpdated: (date: Date | null) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useBybitRateFetcher = ({
  setUsdtNgnRate,
  setLastUpdated,
  setIsLoading
}: BybitRateFetcherProps) => {
  
  const fetchBybitRate = useCallback(async (): Promise<number | null> => {
    try {
      console.log("[useBybitRateFetcher] Fetching Bybit P2P rate with improved retry logic");
      // Increase max retries to 5 with 3s delay for better reliability
      const { rate, error } = await fetchBybitRateWithRetry(7, 3000);
      
      if (!rate || rate <= 0) {
        console.warn(`[useBybitRateFetcher] Failed to get valid Bybit rate: ${error || "Unknown error"}`);
        return null;
      }
      
      console.log("[useBybitRateFetcher] Bybit P2P rate fetched successfully:", rate);
      
      // Save to the standard rate service for compatibility
      await saveUsdtNgnRate(rate).catch(err => {
        console.error("[useBybitRateFetcher] Failed to save Bybit rate to database:", err);
        // Continue execution even if save fails
      });
      
      return rate;
    } catch (error) {
      console.error("[useBybitRateFetcher] Error in fetchBybitRate:", error);
      return null;
    }
  }, []);

  const refreshBybitRate = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    toast.dismiss(); // Clear any existing toasts first
    
    try {
      console.log("[useBybitRateFetcher] Starting Bybit rate refresh");
      const startTime = Date.now();
      
      // Show immediate feedback with longer timeout
      const toastId = toast.loading("Updating USDT/NGN rate...", { 
        duration: 20000 // Increase timeout for slow connections
      });
      
      const bybitRate = await fetchBybitRate();
      
      const elapsedMs = Date.now() - startTime;
      console.log(`[useBybitRateFetcher] Bybit rate fetch completed in ${elapsedMs}ms`);
      
      if (bybitRate && bybitRate > 0) {
        console.log("[useBybitRateFetcher] Refreshed Bybit USDT/NGN rate:", bybitRate);
        setUsdtNgnRate(bybitRate);
        setLastUpdated(new Date());
        
        toast.dismiss(toastId);
        toast.success("USDT/NGN rate updated from Bybit");
        return true;
      } else {
        console.warn("[useBybitRateFetcher] Could not refresh Bybit rate");
        
        toast.dismiss(toastId);
        toast.error("Failed to update USDT/NGN rate from Bybit", {
          description: "Network connection issue. Using last saved rate instead.",
          duration: 6000 // Show error longer
        });
        
        return false;
      }
    } catch (error) {
      console.error("[useBybitRateFetcher] Error refreshing Bybit rate:", error);
      
      toast.dismiss();
      toast.error("Failed to update USDT/NGN rate", {
        description: "Check your network connection and try again",
        duration: 6000
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchBybitRate, setIsLoading, setLastUpdated, setUsdtNgnRate]);

  return {
    fetchBybitRate,
    refreshBybitRate
  };
};
