
import { NotificationType } from './types';
import { logger } from '@/utils/logUtils';

export const validateNotificationType = (type: string | null): NotificationType => {
  if (type === 'success' || type === 'error' || type === 'info' || type === 'warning') {
    return type;
  }
  return 'info';
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export const setupNotificationChannel = (userId: string, onNotification: (notification: any) => void) => {
  logger.info("Setting up notifications system for user:", userId);
  
  return {
    event: 'postgres_changes',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
    onNotification
  };
};
