
// This file adapts Sonner's toast functionality to our notification system
import { toast as sonnerToast } from "sonner";
import { useNotifications, NotificationType } from "@/contexts/NotificationContext";

// Create our enhanced toast API that works with both systems
export const useToast = () => {
  const { addNotification, showToasts } = useNotifications();
  
  // Create our toast object that routes to both systems
  const toast = {
    // Basic toast types
    success: (title: string, options?: { description?: string }) => {
      addNotification({ 
        title, 
        description: options?.description,
        type: 'success'
      });
      return null; // Return ID for consistency with Sonner
    },
    
    error: (title: string, options?: { description?: string }) => {
      addNotification({ 
        title, 
        description: options?.description,
        type: 'error'
      });
      return null;
    },
    
    info: (title: string, options?: { description?: string }) => {
      addNotification({ 
        title, 
        description: options?.description,
        type: 'info'
      });
      return null;
    },
    
    warning: (title: string, options?: { description?: string }) => {
      addNotification({ 
        title, 
        description: options?.description,
        type: 'warning'
      });
      return null;
    },
    
    // For backward compatibility
    custom: (title: string, options?: { description?: string, type?: NotificationType }) => {
      const type = options?.type || 'info';
      addNotification({
        title,
        description: options?.description,
        type
      });
      return null;
    },
    
    // For dismissal and other Sonner functionality, pass through
    dismiss: sonnerToast.dismiss,
    promise: sonnerToast.promise,
    loading: sonnerToast.loading
  };
  
  return {
    toast,
    dismiss: sonnerToast.dismiss,
    toasts: [] // Empty array for backward compatibility
  };
};

// Export the toast directly for convenience
// Use the Sonner toast directly for now - it will be replaced when the app initializes
export const toast = sonnerToast;
