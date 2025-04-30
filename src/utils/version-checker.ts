
/**
 * Version checker utility for diagnosing Vite and React dependency issues
 */

import { logger } from './debug-tools';
import React from 'react';

interface PackageInfo {
  name: string;
  expectedVersion?: string;
  installedVersion?: string;
  isCompatible?: boolean;
}

// This will be populated at runtime
const criticalPackages: PackageInfo[] = [
  { name: 'vite' },
  { name: 'react' },
  { name: '@vitejs/plugin-react-swc' },
  { name: '@tanstack/react-query' },
];

/**
 * Check installed package versions against expected versions
 */
export const checkDependencyVersions = async (): Promise<void> => {
  if (!import.meta.env.DEV) return;

  logger.info('Checking critical dependency versions...');
  
  try {
    // In a browser environment, we can't directly access the package.json
    // So we'll try to infer versions from available globals or descriptive properties
    
    // Check React version
    if (React && React.version) {
      logger.info(`React version: ${React.version}`);
    }

    // Vite version - infer from env
    logger.info(`Running in ${import.meta.env.MODE} mode`);
    
    // Check for common versioning issues
    if (typeof window !== 'undefined') {
      const hasMultipleReacts = 
        Object.keys(window).filter(key => 
          key.includes('__REACT') || key.includes('React')).length > 3;
      
      if (hasMultipleReacts) {
        logger.warn('Multiple React instances detected - this can cause compatibility issues');
      }
    }

    logger.info('Dependency check complete');
  } catch (error) {
    logger.error('Failed to check dependency versions', error);
  }
};

/**
 * Clean up module cache to potentially fix dependency resolution issues
 * This is a development-only utility and will not affect production
 */
export const cleanModuleCache = (): void => {
  if (!import.meta.env.DEV) return;
  
  if (import.meta.hot) {
    logger.info('Attempting to clean HMR cache to fix potential module resolution issues');
    try {
      import.meta.hot.invalidate();
      logger.info('HMR cache invalidated');
    } catch (error) {
      logger.error('Failed to invalidate HMR cache', error);
    }
  }
};
