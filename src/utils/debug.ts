import { supabase } from '@/integrations/supabase/client';
import { logger } from './logUtils';
import { saveUsdtNgnRate } from '@/services/usdt-ngn-service';

// Define a type for the Supabase channel
interface ChannelInfo {
  name: string;
  state: string;
  topic: string;
  timestamp: string;
}

/**
 * Debug function to check the status of the Supabase connection
 * Can be called from the browser console
 */
export const checkSupabaseConnection = () => {
  logger.info('Checking Supabase connection status...');
  
  try {
    // Check if supabase object exists
    if (!supabase) {
      logger.error('❌ Supabase client not found!');
      return false;
    }
    
    // Check realtime config
    const hasRealtime = supabase.realtime && typeof supabase.channel === 'function';
    
    if (!hasRealtime) {
      logger.error('❌ Supabase realtime not configured correctly!');
      return false;
    }

    logger.info('✅ Supabase client initialized correctly');
    
    // Test creating a channel
    const testChannel = supabase.channel('debug-test');
    
    if (!testChannel) {
      logger.error('❌ Failed to create Supabase channel');
      return false;
    }
    
    logger.info('✅ Channel creation successful');
    logger.info('Testing channel subscription...');
    
    // Try subscribing
    testChannel.subscribe((status) => {
      logger.info(`Channel subscription status: ${status}`);
      
      // Clean up
      setTimeout(() => {
        supabase.removeChannel(testChannel);
      }, 2000);
      
      return status === 'SUBSCRIBED';
    });
    
    return true;
  } catch (error) {
    logger.error('❌ Error checking Supabase connection:', error);
    return false;
  }
};

/**
 * Debug function to manually refresh the rate
 * This simulates clicking the refresh button
 */
export const debugRefreshRate = async (rate?: number) => {
  try {
    // Generate a random rate variation if not provided
    const newRate = rate || Math.round((1590 + (Math.random() * 10)) * 100) / 100;
    
    logger.info(`Manually refreshing rate to: ${newRate}`);
    
    // Save to database with bybit source
    const success = await saveUsdtNgnRate(newRate, 'bybit', false);
    
    if (success) {
      logger.info('✅ Rate manually refreshed successfully');
      logger.info('This should trigger real-time updates across all connected clients');
      return true;
    } else {
      logger.error('❌ Failed to refresh rate');
      return false;
    }
  } catch (error) {
    logger.error('❌ Error in debug refresh:', error);
    return false;
  }
};

/**
 * Debug function to show current channel subscriptions
 */
export const listActiveChannels = () => {
  try {
    // Access the Supabase realtime channels
    // The property exists but TypeScript doesn't know about it
    // @ts-expect-error - Accessing internal Supabase property
    const channels: unknown[] = supabase.realtime?.channels || [];
    
    if (channels.length === 0) {
      logger.info('No active channel subscriptions found');
      return [];
    }
    
    // Map the channels to a more structured format
    const channelInfo: ChannelInfo[] = channels.map((channel) => {
      const channelObj = channel as { 
        name: string; 
        state: string; 
        topic: string;
      };
      
      return {
        name: channelObj.name || 'unknown',
        state: channelObj.state || 'unknown',
        topic: channelObj.topic || 'unknown',
        timestamp: new Date().toISOString()
      };
    });
    
    logger.info(`Active channels (${channelInfo.length}):`, channelInfo);
    return channelInfo;
  } catch (error) {
    logger.error('Error listing channels:', error);
    return [];
  }
};

// Expose debug functions to the browser console
if (typeof window !== 'undefined') {
  // @ts-expect-error - Intentionally adding to window for debugging
  window.checkSupabaseConnection = checkSupabaseConnection;
  // @ts-expect-error - Intentionally adding to window for debugging
  window.debugRefreshRate = debugRefreshRate;
  // @ts-expect-error - Intentionally adding to window for debugging
  window.listActiveChannels = listActiveChannels;
} 