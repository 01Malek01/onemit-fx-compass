
// src/hooks/use-toast.ts
import { useToast as useToastShadcn } from "@/components/ui/use-toast";

// Re-export the toast function from sonner
export { toast } from 'sonner';

// Re-export the useToast hook from shadcn UI with a different name to avoid circular references
export const useToast = useToastShadcn;
