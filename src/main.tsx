
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './contexts/NotificationContext';

// Import our logging utility
import { applyConsoleFilters } from './utils/logUtils';
// Import Vite helpers
import { initViteEnvironment, checkViteSetup } from './utils/vite-helpers';

// Initialize Vite environment checks
initViteEnvironment();

// Check Vite setup
if (import.meta.env.DEV) {
  checkViteSetup();
}

// Apply console filters in production
applyConsoleFilters();

// Setup React Query client with optimal settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
