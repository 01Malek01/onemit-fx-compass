import React, { createContext, useContext, useState, useEffect, useReducer, useMemo } from 'react';
import { toast as sonnerToast } from "sonner";
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logUtils';

// Define notification types
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  title: string;
  description?: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
}

// Define context state
interface NotificationContextState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showToasts: boolean;
  setShowToasts: (show: boolean) => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

// Actions for reducer
type NotificationAction = 
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_READ'; payload: string }
  | { type: 'MARK_ALL_READ' }
  | { type: 'REMOVE'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'INITIALIZE'; payload: Notification[] };

// Notifications reducer
const notificationsReducer = (state: Notification[], action: NotificationAction): Notification[] => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      // Limit to 20 notifications, removing oldest if needed
      const newState = [action.payload, ...state];
      return newState.slice(0, 20);
    
    case 'MARK_READ':
      return state.map(notification => 
        notification.id === action.payload 
          ? { ...notification, read: true } 
          : notification
      );
    
    case 'MARK_ALL_READ':
      return state.map(notification => ({ ...notification, read: true }));
    
    case 'REMOVE':
      return state.filter(notification => notification.id !== action.payload);
    
    case 'CLEAR_ALL':
      return [];
    
    case 'INITIALIZE':
      return action.payload;
    
    default:
      return state;
  }
};

// Generate a unique ID for notifications
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, dispatch] = useReducer(notificationsReducer, []);
  const [showToasts, setShowToasts] = useState(false);
  const { user } = useAuth();

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.read).length;
  }, [notifications]);

  // Load notifications from Supabase on mount
  useEffect(() => {
    if (!user) return;

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
          const parsedNotifications = data.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          dispatch({ type: 'INITIALIZE', payload: parsedNotifications });
        }
      } catch (error) {
        logger.error('Error loading notifications:', error);
      }
    };

    loadNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = {
              ...payload.new,
              timestamp: new Date(payload.new.timestamp)
            };
            dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Add a new notification
  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!user) {
      logger.warn('Cannot add notification: No user logged in');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            title: notification.title,
            description: notification.description,
            type: notification.type
          }
        ])
        .select()
        .single();

      if (error) {
        logger.error('Failed to save notification to Supabase:', error);
        return;
      }

      // Show as toast if enabled
      if (showToasts) {
        switch (notification.type) {
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

  // Mark a notification as read
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

  // Mark all notifications as read
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

  // Remove a notification
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

  // Clear all notifications
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

  // Context value
  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    showToasts,
    setShowToasts
  };

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
