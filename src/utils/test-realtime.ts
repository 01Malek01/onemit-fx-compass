
import { supabase } from '@/integrations/supabase/client';
import { logger } from './logUtils';

/**
 * Utility to debug Supabase real-time channels 
 * Call window.supabaseDebug() in browser console to use
 */
export const setupSupabaseDebugger = () => {
  if (typeof window === 'undefined') return;

  (window as any).supabaseDebug = {
    listChannels: () => {
      const channels = (supabase as any)._channels;
      if (!channels || channels.length === 0) {
        console.log('No active Supabase channels found');
        return 'No active Supabase channels found';
      }
      
      const channelInfo = channels.map((channel: any) => ({
        name: channel.topic,
        status: channel.status,
        params: channel.params
      }));
      
      console.table(channelInfo);
      return channelInfo;
    },
    
    sendTestNotification: async (userId: string, type = 'info') => {
      try {
        if (!userId) {
          console.error('No user ID provided');
          return 'Error: No user ID provided';
        }
        
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: `Test ${type} notification`,
            description: `This is a test notification with type: ${type} (sent at ${new Date().toLocaleTimeString()})`,
            type,
            read: false
          })
          .select();
          
        if (error) {
          console.error('Error sending test notification:', error);
          return `Error: ${error.message}`;
        }
        
        console.log('Test notification sent successfully:', data[0]);
        return `Success! Notification sent at ${new Date().toLocaleTimeString()}`;
      } catch (error) {
        console.error('Unexpected error:', error);
        return `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    },
    
    getNotificationsCount: async (userId: string) => {
      try {
        if (!userId) {
          console.error('No user ID provided');
          return 'Error: No user ID provided';
        }
        
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error counting notifications:', error);
          return `Error: ${error.message}`;
        }
        
        console.log(`User has ${count} notifications`);
        return count;
      } catch (error) {
        console.error('Unexpected error:', error);
        return `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }
  };
  
  logger.info('Supabase debugger attached to window.supabaseDebug');
  console.log('Supabase debugger available! Use window.supabaseDebug to access debugging utilities');
};

// Set up the debugger if in development mode
if (process.env.NODE_ENV !== 'production') {
  setupSupabaseDebugger();
}
