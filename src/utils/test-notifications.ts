
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logUtils';

/**
 * Utility function to test real-time notifications
 * This can be called from the browser console to test if notifications work in real-time
 */
export const testNotification = async (type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  try {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user.id;
    
    if (!userId) {
      logger.error('❌ Cannot test notifications: No user is logged in');
      return false;
    }
    
    logger.info(`Creating test ${type} notification for user ${userId}`);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([{ 
        user_id: userId,
        title: `Test ${type} notification`,
        description: `This is a test ${type} notification sent at ${new Date().toLocaleTimeString()}`,
        type: type,
        read: false
      }]);
    
    if (error) {
      logger.error('❌ Error creating test notification:', error);
      return false;
    }
    
    logger.info('✅ Test notification created successfully!');
    logger.info('If real-time is working correctly, you should see this notification without refreshing.');
    return true;
  } catch (error) {
    logger.error('❌ Error testing notifications:', error);
    return false;
  }
};

// Export function to make it available in browser console
if (typeof window !== 'undefined') {
  // @ts-expect-error - Intentionally adding to window for testing
  window.testNotification = testNotification;
} 
