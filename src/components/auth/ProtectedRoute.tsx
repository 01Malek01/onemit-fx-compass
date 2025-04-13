
import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Add a debug log to help with troubleshooting
  useEffect(() => {
    console.log('Protected route check:', { 
      path: location.pathname, 
      isAuthenticated: !!user, 
      isLoading 
    });
  }, [user, location.pathname, isLoading]);

  if (isLoading) {
    // While we're checking authentication status, show a loading state
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse font-medium">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // If not authenticated, redirect to login page
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected content
  return <>{children}</>;
}

export function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse font-medium">Loading...</div>
      </div>
    );
  }

  if (user) {
    // If already authenticated, redirect to home page
    return <Navigate to="/" replace />;
  }

  // If not authenticated, render the auth content
  return <>{children}</>;
}
