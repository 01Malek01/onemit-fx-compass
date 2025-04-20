
import { useToast as useShadcnToast } from "@radix-ui/react-toast";
import { toast as sonnerToast } from "sonner";

export function useToast() {
  const { toast, dismiss } = useShadcnToast();
  return {
    toast,
    dismiss
  };
}

// Re-export sonner's toast for direct usage
export { sonnerToast as toast };
