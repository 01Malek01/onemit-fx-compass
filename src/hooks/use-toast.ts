
// src/hooks/use-toast.ts
import { useToast as useToastShadcn } from "@/components/ui/use-toast";

// Re-export the hook and the toast function
export { toast } from 'sonner';
export const useToast = useToastShadcn;
