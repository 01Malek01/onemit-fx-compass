
/**
 * Debug tools for development environment
 * Includes utilities for troubleshooting Vite-related issues
 */

// Console logger with different severity levels
export const logger = {
  info: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(`📘 [INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(`⚠️ [WARNING] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(`🔥 [ERROR] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEBUG === 'true') {
      console.debug(`🔍 [DEBUG] ${message}`, ...args);
    }
  }
};

// Utility to check if running in development mode
export const isDev = (): boolean => {
  return import.meta.env.DEV === true;
};

// Function to verify Vite environment
export const checkViteEnv = (): void => {
  if (isDev()) {
    logger.info('Vite environment check started');
    try {
      // Log Vite-related environment variables
      logger.info('Vite mode:', import.meta.env.MODE);
      logger.info('Vite base URL:', import.meta.env.BASE_URL);
      
      // Check if we can access essential Vite environment variables
      if (!import.meta.env.BASE_URL) {
        logger.warn('BASE_URL is not defined in Vite environment');
      }
      
      logger.info('Vite environment check completed successfully');
    } catch (error) {
      logger.error('Vite environment check failed', error);
    }
  }
};

// Expose a global debug function in dev mode
if (isDev()) {
  (window as any).__DEBUG_TOOLS = {
    logger,
    checkViteEnv,
    printEnv: () => console.log('Environment:', import.meta.env)
  };
  
  logger.info('Debug tools initialized');
}
