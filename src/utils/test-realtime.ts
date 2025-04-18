import { supabase } from '@/integrations/supabase/client';
import { logger } from './logUtils';

/**
 * Utility function to test if real-time functionality is working
 * This can be called from the browser console to diagnose issues
 */
export const testRealtimeConnection = () => {
  // Create a test channel
  const channel = supabase
    .channel('test-connection')
    .on('system', { event: 'test' }, (payload) => {
      logger.info('Received test system message:', payload);
    })
    .subscribe((status) => {
      logger.info(`Test channel status: ${status}`);
      
      if (status === 'SUBSCRIBED') {
        // Test is successful if we reach this point
        logger.info('✅ Supabase real-time connection test SUCCESS');
        logger.info('Channel is correctly subscribed to Supabase real-time');
        
        // Clean up after test
        setTimeout(() => {
          supabase.removeChannel(channel);
        }, 2000);
        
        return true;
      } else if (status === 'CHANNEL_ERROR') {
        logger.error('❌ Supabase real-time connection test FAILED');
        logger.error('Could not establish a connection to Supabase real-time');
        return false;
      }
      
      return false;
    });
};

/**
 * Test function to manually insert a USDT/NGN rate to trigger real-time updates
 * This can be called from the browser console to simulate a refresh from another user
 */
export const testInsertRate = async (rate: number = 1595.75) => {
  try {
    logger.info(`Inserting test USDT/NGN rate: ${rate}`);
    
    const { data, error } = await supabase
      .from('usdt_ngn_rates')
      .insert([{ 
        rate: Number(rate),
        source: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }]);
    
    if (error) {
      logger.error('Error inserting test rate:', error);
      return false;
    }
    
    logger.info('✅ Test rate inserted successfully, real-time update should trigger');
    return true;
  } catch (error) {
    logger.error('Error testing real-time update:', error);
    return false;
  }
};

// Export functions to make them available in browser console
if (typeof window !== 'undefined') {
  // @ts-expect-error - Intentionally adding to window for testing
  window.testRealtimeConnection = testRealtimeConnection;
  // @ts-expect-error - Intentionally adding to window for testing
  window.testInsertRate = testInsertRate;
} 