
import { toast } from "sonner";
import { fetchBybitRateWithRetry } from '@/services/bybit/bybit-utils';
import { saveUsdtNgnRate } from '@/services/usdt-ngn-service';
import { AlertCircle, WifiOff } from "lucide-react";
import { useRef } from "react";

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
  // Track consecutive failures to detect persistent network issues
  const failureCount = useRef(0);
  const lastErrorRef = useRef<string | null>(null);
  
  const fetchBybitRate = async (): Promise<number | null> => {
    try {
      console.log("[useBybitRateFetcher] Fetching Bybit P2P rate with improved retry logic");
      const { rate, error } = await fetchBybitRateWithRetry(3, 2000);
      
      if (!rate || rate <= 0) {
        console.warn(`[useBybitRateFetcher] Failed to get valid Bybit rate: ${error || "Unknown error"}`);
        lastErrorRef.current = error || "Unknown error";
        failureCount.current += 1;
        return null;
      }
      
      console.log("[useBybitRateFetcher] Bybit P2P rate fetched successfully:", rate);
      
      // Reset failure count on success
      failureCount.current = 0;
      lastErrorRef.current = null;
      
      // Save to the standard rate service for compatibility
      await saveUsdtNgnRate(rate).catch(err => {
        console.error("[useBybitRateFetcher] Failed to save Bybit rate to database:", err);
        // Continue execution even if save fails
      });
      
      return rate;
    } catch (error) {
      console.error("[useBybitRateFetcher] Error in fetchBybitRate:", error);
      lastErrorRef.current = error instanceof Error ? error.message : "Unknown error";
      failureCount.current += 1;
      return null;
    }
  };

  const refreshBybitRate = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const bybitRate = await fetchBybitRate();
      
      if (bybitRate && bybitRate > 0) {
        console.log("[useBybitRateFetcher] Refreshed Bybit USDT/NGN rate:", bybitRate);
        setUsdtNgnRate(bybitRate);
        setLastUpdated(new Date());
        
        toast.success("USDT/NGN rate updated from Bybit");
        return true;
      } else {
        console.warn("[useBybitRateFetcher] Could not refresh Bybit rate");
        
        // Determine if this is a network issue or other type of error
        const isNetworkError = 
          failureCount.current >= 2 || 
          (lastErrorRef.current && (
            lastErrorRef.current.includes("Network") || 
            lastErrorRef.current.includes("connection") ||
            lastErrorRef.current.includes("timeout") ||
            lastErrorRef.current.includes("ECONNABORTED") ||
            lastErrorRef.current.includes("ERR_NETWORK")
          ));
        
        // Enhanced error toast with more information and icon
        toast.error(
          isNetworkError 
            ? "Network connectivity issue" 
            : "Failed to update USDT/NGN rate from Bybit", 
          {
            description: "Using last saved rate instead",
            icon: isNetworkError 
              ? <WifiOff className="h-4 w-4" />
              : <AlertCircle className="h-4 w-4" />,
            duration: 5000 // Show for longer so user can see it
          }
        );
        
        return false;
      }
    } catch (error) {
      console.error("[useBybitRateFetcher] Error refreshing Bybit rate:", error);
      
      // More detailed error toast with icon
      toast.error("Failed to update USDT/NGN rate", {
        description: "Check your network connection and try again",
        icon: <WifiOff className="h-4 w-4" />,
        duration: 5000
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchBybitRate,
    refreshBybitRate,
    getCurrentFailureCount: () => failureCount.current,
    getLastError: () => lastErrorRef.current
  };
};
