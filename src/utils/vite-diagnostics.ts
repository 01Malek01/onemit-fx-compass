
/**
 * Vite-specific diagnostics tool for handling module resolution issues
 */

import { logger } from './debug-tools';

interface ViteIssueReport {
  moduleId: string;
  error: Error | null;
  timestamp: number;
  resolved: boolean;
}

// Track module resolution issues
const moduleIssues: Map<string, ViteIssueReport> = new Map();

/**
 * Register a module resolution issue
 */
export function registerModuleIssue(moduleId: string, error: Error): void {
  if (import.meta.env.DEV) {
    moduleIssues.set(moduleId, {
      moduleId,
      error,
      timestamp: Date.now(),
      resolved: false,
    });
    
    logger.error(`Module resolution issue: ${moduleId}`, error);
    
    // Attempt automated recovery
    attemptModuleRecovery(moduleId);
  }
}

/**
 * Attempt to recover from module resolution issues
 */
async function attemptModuleRecovery(moduleId: string): Promise<void> {
  if (!import.meta.env.DEV) return;
  
  logger.info(`Attempting to recover module: ${moduleId}`);
  
  // For Vite internal modules, suggest HMR restart
  if (moduleId.includes('node_modules/vite')) {
    logger.warn(`
      ⚠️ Vite internal module resolution issue detected.
      This might be fixed by:
      1. Refreshing the page
      2. Restarting the dev server
      3. Clearing browser cache
      4. Reinstalling node_modules
    `);
    
    // If HMR is available, try to force update
    if (import.meta.hot) {
      logger.info('Attempting HMR recovery...');
      try {
        // Force an HMR update to potentially resolve the issue
        import.meta.hot.invalidate();
      } catch (err) {
        logger.error('HMR recovery failed', err);
      }
    }
  }
}

/**
 * Check for potential Vite configuration issues
 */
export function diagnosePotentialViteIssues(): void {
  if (!import.meta.env.DEV) return;

  logger.info('Diagnosing potential Vite configuration issues...');
  
  // Check for specific environment variables that might help debugging
  const debugInfo = {
    mode: import.meta.env.MODE,
    base: import.meta.env.BASE_URL,
    platform: typeof window !== 'undefined' ? window.navigator.platform : 'unknown',
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : 'unknown',
  };
  
  logger.info('Vite environment:', debugInfo);
  
  // Check for version compatibility issues
  if (typeof process !== 'undefined' && process.versions) {
    logger.info('Node version:', process.versions.node);
  }
}

/**
 * Initialize the Vite diagnostics tool
 */
export function initViteDiagnostics(): void {
  if (import.meta.env.DEV) {
    logger.info('Initializing Vite diagnostics tool');
    
    // Run diagnostics on startup
    diagnosePotentialViteIssues();
    
    // Set up global error handler to catch Vite-specific errors
    const originalOnError = window.onerror;
    window.onerror = (event, source, lineno, colno, error) => {
      // Check if this is a Vite-related error
      if (source?.includes('vite') || error?.message?.includes('vite') || 
          error?.stack?.includes('vite') || error?.message?.includes('node_modules')) {
        registerModuleIssue(source || 'unknown', error || new Error(String(event)));
      }
      
      // Call original handler if it exists
      if (typeof originalOnError === 'function') {
        return originalOnError(event, source, lineno, colno, error);
      }
      return false;
    };
  }
}

// Export a utility object for developer usage
export const ViteDiagnostics = {
  diagnose: diagnosePotentialViteIssues,
  registerIssue: registerModuleIssue,
  init: initViteDiagnostics,
};

// Initialize automatically in development mode
if (import.meta.env.DEV) {
  initViteDiagnostics();
}
