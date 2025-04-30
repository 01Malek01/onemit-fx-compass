
// Helper functions for Vite-related operations and troubleshooting

import { debugViteModules, checkRuntimeEnvironment } from './debug-tools';

/**
 * Initialize Vite environment checks and debug tools
 * This can be called early in the application bootstrap process
 */
export const initViteEnvironment = () => {
  console.log('Initializing Vite environment checks');
  
  try {
    // Run diagnostic checks
    debugViteModules();
    checkRuntimeEnvironment();
    
    console.log('Vite environment initialization complete');
    return true;
  } catch (error) {
    console.error('Failed to initialize Vite environment:', error);
    return false;
  }
};

/**
 * Check if Vite is properly configured
 */
export const checkViteSetup = () => {
  console.log('Checking Vite setup');
  
  // Log some information about the environment that might help diagnose Vite-related issues
  console.log('BASE_URL:', import.meta.env.BASE_URL);
  console.log('MODE:', import.meta.env.MODE);
  console.log('DEV:', import.meta.env.DEV);
  console.log('PROD:', import.meta.env.PROD);
  
  return true;
};
