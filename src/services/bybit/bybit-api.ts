
import { supabase } from '@/integrations/supabase/client';
import type { BybitP2PResponse, BybitRequestParams } from './types';

/**
 * Calls the Bybit P2P API through our Supabase Edge Function proxy
 * to avoid CORS issues and protect API credentials
 */
export const getBybitP2PRate = async (
  currencyId: string = "NGN",
  tokenId: string = "USDT",
  verifiedOnly: boolean = true
): Promise<BybitP2PResponse | null> => {
  console.log("[BybitAPI] Initiating request for", tokenId, "to", currencyId);

  try {
    // Add client-side timeout handling with AbortController
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 25000); // 25 second timeout
    
    const requestTimestamp = Date.now();
    console.log("[BybitAPI] Calling Supabase Edge Function proxy at", new Date(requestTimestamp).toISOString());
    
    // Get connection info if available, without causing TypeScript errors
    const connectionInfo = getConnectionInfo();
    
    // Call our Supabase Edge Function with a unique timestamp to prevent caching issues
    const { data, error } = await supabase.functions.invoke('bybit-proxy', {
      body: {
        currencyId,
        tokenId,
        verifiedOnly,
        requestTimestamp, // Add timestamp for cache busting
        clientInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          connection: connectionInfo
        }
      }
    });
    
    clearTimeout(timeoutId);
    
    // Log elapsed time
    const elapsedMs = Date.now() - requestTimestamp;
    console.log(`[BybitAPI] Edge function responded after ${elapsedMs}ms`);
    
    if (error) {
      console.error("[BybitAPI] Edge function error:", error);
      return {
        traders: [],
        market_summary: {
          total_traders: 0,
          price_range: {
            min: 0,
            max: 0,
            average: 0,
            median: 0,
            mode: 0,
          },
        },
        timestamp: new Date().toISOString(),
        success: false,
        error: `Edge function error: ${error.message || "Unknown error"}`
      };
    }
    
    console.log("[BybitAPI] Received response from Edge Function:", 
      data ? `success=${data.success}, traders=${data.traders?.length || 0}` : "No data");
    
    // The Edge Function returns the data in the same format we expect
    if (data && data.success && data.market_summary && data.traders) {
      return data as BybitP2PResponse;
    }
    
    // Handle unsuccessful responses from the Edge Function
    console.warn("[BybitAPI] Edge function returned unsuccessful response:", data?.error || "Unknown error");
    return {
      traders: [],
      market_summary: {
        total_traders: 0,
        price_range: {
          min: 0,
          max: 0,
          average: 0,
          median: 0,
          mode: 0,
        },
      },
      timestamp: new Date().toISOString(),
      success: false,
      error: data?.error || "Invalid response from Edge Function"
    };
  } catch (error: any) {
    console.error("[BybitAPI] Error fetching Bybit P2P rate:", error);
    
    // Determine if it's a network error, timeout, or other issue
    let errorMessage = "Unknown error occurred";
    
    if (error.name === "AbortError") {
      errorMessage = "Request timed out after 25 seconds";
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "Request timed out";
    } else if (error.code === "ERR_NETWORK") {
      errorMessage = "Network error - check your internet connection";
    } else if (error.message && typeof error.message === 'string') {
      if (error.message.includes("Failed to fetch")) {
        errorMessage = "Network connection error - edge function may be unavailable";
      } else if (error.message.includes("AbortError")) {
        errorMessage = "Request timed out";
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      traders: [],
      market_summary: {
        total_traders: 0,
        price_range: {
          min: 0,
          max: 0,
          average: 0,
          median: 0,
          mode: 0,
        },
      },
      timestamp: new Date().toISOString(),
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Helper function to safely get connection information without TypeScript errors
 */
const getConnectionInfo = () => {
  if (typeof navigator === 'undefined') {
    return {
      type: null,
      effectiveType: null,
      downlink: null,
      saveData: null
    };
  }
  
  // Use type assertion with the Navigator Network Information API
  // @ts-ignore - Accessing non-standard browser API
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return {
      type: null,
      effectiveType: null,
      downlink: null,
      saveData: null
    };
  }
  
  return {
    type: connection.type || null,
    effectiveType: connection.effectiveType || null,
    downlink: connection.downlink || null,
    saveData: connection.saveData || null
  };
};
