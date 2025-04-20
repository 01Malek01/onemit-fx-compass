
// Import from our local implementation, not from radix
import { useToast as useShadcnToast } from "@/components/ui/use-toast";
import { toast as sonnerToast } from "sonner";

export function useToast() {
  // Get toast functions from our implementation
  const { toast, dismiss, toasts } = useShadcnToast();
  return {
    toast,
    dismiss,
    toasts
  };
}

// Re-export sonner's toast for direct usage
export { sonnerToast as toast };
