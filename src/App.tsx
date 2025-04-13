
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProtectedRoute, AuthRoute } from "./components/auth/ProtectedRoute";

const App = () => (
  <TooltipProvider>
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster />
      <Sonner />
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/auth" 
          element={
            <AuthRoute>
              <Auth />
            </AuthRoute>
          } 
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  </TooltipProvider>
);

export default App;
