
import { Notification, NotificationAction } from './types';

export const notificationsReducer = (state: Notification[], action: NotificationAction): Notification[] => {
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
