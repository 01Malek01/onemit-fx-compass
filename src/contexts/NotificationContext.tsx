
import React, { createContext, useContext, useState, useEffect, useReducer, useMemo } from 'react';
import { toast as sonnerToast } from "sonner";
import { useAuth } from './AuthContext';

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

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (!user) return;
    
    try {
      const storedNotifications = localStorage.getItem(`notifications-${user.id}`);
      
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        
        dispatch({ type: 'INITIALIZE', payload: parsedNotifications });
      }
    } catch (error) {
      console.error('Failed to load notifications from localStorage:', error);
    }
  }, [user]);

  // Save notifications to localStorage when they change
  useEffect(() => {
    if (!user) return;
    
    try {
      localStorage.setItem(`notifications-${user.id}`, JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications to localStorage:', error);
    }
  }, [notifications, user]);

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    
    // Also show as toast if enabled
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
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_READ', payload: id });
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_READ' });
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE', payload: id });
  };

  // Clear all notifications
  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
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
