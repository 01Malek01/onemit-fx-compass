
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logUtils';

/**
 * Utility function to test sending a notification via Supabase
 * Can be called from the browser console: window.sendTestNotification()
 */
export const sendTestNotification = async (userId: string, options?: {
  title?: string; 
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}) => {
  try {
    if (!userId) {
      console.error('[Test] No user ID provided');
      return 'Error: No user ID provided';
    }

    const notification = {
      user_id: userId,
      title: options?.title || 'Test Notification',
      description: options?.description || 'This is a test notification to verify real-time updates',
      type: options?.type || 'info',
      read: false
    };

    logger.info('[Test] Sending test notification:', notification);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();

    if (error) {
      console.error('[Test] Error sending test notification:', error);
      return `Error: ${error.message}`;
    }

    logger.info('[Test] Test notification sent successfully:', data);
    return `Success! Notification ID: ${data.id} sent at ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error('[Test] Unexpected error:', error);
    return `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
};

// Export to window for testing in browser console
if (typeof window !== 'undefined') {
  (window as any).sendTestNotification = sendTestNotification;
}
