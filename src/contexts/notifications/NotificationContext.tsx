
import React, { createContext, useContext, useState, useEffect, useReducer, useMemo } from 'react';
import { toast as sonnerToast } from "sonner";
import { useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logUtils';
import { notificationsReducer } from './notificationReducer';
import { validateNotificationType, setupNotificationChannel } from './utils';
import type { Notification, NotificationContextState, NotificationType } from './types';

// Create the context
const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationsReducer, []);
  const [showToasts, setShowToasts] = useState(false);
  const { user } = useAuth();

  // Calculate unread count using useMemo for better performance
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.read).length;
  }, [notifications]);

  // Load notifications from Supabase on mount and setup real-time subscription
  useEffect(() => {
    if (!user) return;

    // Load initial notifications
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(20);

        if (error) {
          logger.error('Failed to load notifications from Supabase:', error);
          return;
        }

        if (data) {
          logger.info(`Loaded ${data.length} notifications from database`);
          const parsedNotifications: Notification[] = data.map(n => ({
            id: n.id,
            title: n.title,
            description: n.description || undefined,
            type: validateNotificationType(n.type),
            timestamp: new Date(n.timestamp),
            read: Boolean(n.read),
            user_id: n.user_id
          }));
          
          dispatch({ type: 'INITIALIZE', payload: parsedNotifications });
        }
      } catch (error) {
        logger.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Set up dedicated channel for real-time notification updates
    logger.info("Setting up real-time notification subscription");
    const channel = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          logger.debug('Real-time notification received:', payload);
          
          try {
            const newNotification: Notification = {
              id: payload.new.id,
              title: payload.new.title,
              description: payload.new.description || undefined,
              type: validateNotificationType(payload.new.type),
              timestamp: new Date(payload.new.timestamp),
              read: Boolean(payload.new.read),
              user_id: payload.new.user_id
            };
            
            logger.info(`Real-time notification received: ${newNotification.title}`);
            dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

            if (showToasts) {
              switch (newNotification.type) {
                case 'success':
                  sonnerToast.success(newNotification.title, { description: newNotification.description });
                  break;
                case 'error':
                  sonnerToast.error(newNotification.title, { description: newNotification.description });
                  break;
                case 'warning':
                  sonnerToast.warning(newNotification.title, { description: newNotification.description });
                  break;
                case 'info':
                default:
                  sonnerToast.info(newNotification.title, { description: newNotification.description });
              }
            }
          } catch (error) {
            logger.error('Error processing real-time notification:', error);
          }
        }
      )
      .subscribe((status) => {
        logger.info(`Notification channel subscription status: ${status}`);
      });

    return () => {
      logger.info("Cleaning up notification channel subscription");
      supabase.removeChannel(channel);
    };
  }, [user, showToasts]);

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!user) {
      logger.warn('Cannot add notification: No user logged in');
      return;
    }

    try {
      logger.info(`Adding new notification: ${notification.title}`);
      
      // Ensure notification type is valid
      const validType = validateNotificationType(notification.type);
      
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: user.id,
          title: notification.title,
          description: notification.description,
          type: validType
        }])
        .select()
        .single();

      if (error) {
        logger.error('Failed to save notification to Supabase:', error);
        return;
      }

      logger.info('Notification added to database successfully');

      if (showToasts) {
        switch (validType) {
          case 'success':
            sonnerToast.success(notification.title, { description: notification.description });
            break;
          case 'error':
            sonnerToast.error(notification.title, { description: notification.description });
            break;
          case 'warning':
            sonnerToast.warning(notification.title, { description: notification.description });
            break;
          case 'info':
          default:
            sonnerToast.info(notification.title, { description: notification.description });
        }
      }
    } catch (error) {
      logger.error('Error adding notification:', error);
    }
  };

  // CRUD operations for notifications
  const markAsRead = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        logger.error('Failed to mark notification as read:', error);
        return;
      }

      dispatch({ type: 'MARK_READ', payload: id });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        logger.error('Failed to mark all notifications as read:', error);
        return;
      }

      dispatch({ type: 'MARK_ALL_READ' });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  };

  const removeNotification = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        logger.error('Failed to delete notification:', error);
        return;
      }

      dispatch({ type: 'REMOVE', payload: id });
    } catch (error) {
      logger.error('Error removing notification:', error);
    }
  };

  const clearAll = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        logger.error('Failed to clear all notifications:', error);
        return;
      }

      dispatch({ type: 'CLEAR_ALL' });
    } catch (error) {
      logger.error('Error clearing all notifications:', error);
    }
  };

  // Context value with memoized properties
  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    showToasts,
    setShowToasts
  }), [notifications, unreadCount, showToasts]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotifications = (): NotificationContextState => {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};
