
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NotificationProvider } from './contexts/NotificationContext';

// Import our logging and debugging utilities
import { applyConsoleFilters } from './utils/logUtils';
import { checkViteEnv, logger } from './utils/debug-tools';
import { checkDependencyVersions, cleanModuleCache } from './utils/version-checker';
import { ViteDiagnostics } from './utils/vite-diagnostics';

// Global error handler to catch rendering errors
const handleGlobalError = (event: ErrorEvent) => {
  logger.error('Uncaught error:', event.error);
  // Prevent the default error handling
  event.preventDefault();
  
  // If the error is related to module loading, attempt to clean cache
  if (event.error?.message?.includes('Cannot find module') && 
      import.meta.env.DEV) {
    logger.warn('Module resolution error detected. Attempting to clean module cache...');
    cleanModuleCache();
    
    // Also register with Vite diagnostics for enhanced recovery
    ViteDiagnostics.registerIssue(event.error?.message || 'unknown module', event.error);
  }
};

// Setup error handlers in development mode only
if (import.meta.env.DEV) {
  window.addEventListener('error', handleGlobalError);
  
  // Initialize Vite diagnostics for module resolution issues
  ViteDiagnostics.init();
  
  // Check Vite environment and dependencies
  checkViteEnv();
  checkDependencyVersions().catch(err => 
    logger.error('Failed to check dependencies', err));
    
  logger.info('Application starting in development mode');
  
  // Add fallback handler for uncaught promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason);
    
    // Check if this is a module resolution issue
    if (event.reason?.message?.includes('Cannot find module')) {
      ViteDiagnostics.registerIssue(
        event.reason.message.match(/Cannot find module '([^']+)'/)?.[1] || 'unknown',
        event.reason
      );
    }
  });
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

// Root element where React will mount
const rootElement = document.getElementById('root');

// Safeguard against missing root element
if (!rootElement) {
  console.error('Failed to find root element. Check your HTML template.');
} else {
  try {
    ReactDOM.createRoot(rootElement).render(
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
    
    if (import.meta.env.DEV) {
      logger.info('Application rendered successfully');
    }
  } catch (error) {
    console.error('Failed to render application:', error);
    
    // Attempt recovery for certain types of errors
    if (import.meta.env.DEV && 
        (String(error).includes('Cannot find module') || 
         String(error).includes('node_modules/vite'))) {
      logger.warn(`
        Rendering failed due to module resolution issues.
        Try the following:
        1. Refresh the page
        2. Restart the dev server with 'npm run dev'
        3. Clear node_modules and reinstall with 'rm -rf node_modules && npm install'
      `);
    }
  }
}

// Clean up error handlers on module disposal (for HMR)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (import.meta.env.DEV) {
      window.removeEventListener('error', handleGlobalError);
    }
  });
}
