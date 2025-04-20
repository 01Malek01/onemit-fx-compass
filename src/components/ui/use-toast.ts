
// Import from shadcn/ui toast component
import { Toast, ToastActionElement, ToastProps } from "@/components/ui/toast";

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToastState = {
  toasts: ToasterToast[];
};

let count = 0;
const toastState: ToasterToastState = { toasts: [] };

const listeners: Array<(state: ToasterToastState) => void> = [];

function update(state: ToasterToastState) {
  toastState.toasts = state.toasts;
  listeners.forEach((listener) => {
    listener(toastState);
  });
}

function emitChange() {
  listeners.forEach((listener) => {
    listener(toastState);
  });
}

export function useToast() {
  return {
    toasts: toastState.toasts,
    toast: (props: Omit<ToasterToast, "id">) => {
      const id = count++;
      const toast: ToasterToast = { id: id.toString(), ...props };
      
      update({
        toasts: [toast, ...toastState.toasts].slice(0, TOAST_LIMIT),
      });

      return toast;
    },
    dismiss: (toastId: string) => {
      update({
        toasts: toastState.toasts.filter(
          (t) => t.id !== toastId
        ),
      });
    },
  };
}

export const toast = {
  dismiss: (toastId: string) => {
    update({
      toasts: toastState.toasts.filter((t) => t.id !== toastId),
    });
  },
  // Standard toast variants
  default: (props: Omit<ToasterToast, "id">) => {
    return useToast().toast({ ...props, variant: "default" });
  },
  destructive: (props: Omit<ToasterToast, "id">) => {
    return useToast().toast({ ...props, variant: "destructive" });
  },
  // For compatibility with components that expect a simple function
  error: (title: string, description?: string) => {
    return useToast().toast({ 
      title, 
      description, 
      variant: "destructive" 
    });
  },
  success: (title: string, description?: string) => {
    return useToast().toast({ 
      title, 
      description, 
      variant: "default" 
    });
  },
};
