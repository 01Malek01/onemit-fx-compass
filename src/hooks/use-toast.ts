
// This file re-exports Sonner's toast functionality for backward compatibility
import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

// For backward compatibility with any code still using useToast
export const useToast = () => {
  return {
    toast: sonnerToast,
    // Basic implementation to maintain compatibility with old useToast consumers
    // that might expect these methods
    dismiss: (id?: string) => {
      if (id) {
        sonnerToast.dismiss(id);
      } else {
        sonnerToast.dismiss();
      }
    },
    toasts: [] // Empty array as Sonner manages its own state
  };
};
