
/**
 * Utility for more organized console logging
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 99
}

// Default minimum level for production and development
const DEFAULT_PROD_LEVEL = LogLevel.WARN;
const DEFAULT_DEV_LEVEL = LogLevel.DEBUG;

// Current minimum log level
let currentLogLevel = process.env.NODE_ENV === 'production' 
  ? DEFAULT_PROD_LEVEL 
  : DEFAULT_DEV_LEVEL;

// Log counts for grouping repeated logs
const logCounts: Record<string, number> = {};

// Generate a string hash from any log content
const getLogHash = (args: any[]): string => {
  try {
    return JSON.stringify(args)
      .replace(/\s+/g, '')
      .slice(0, 100);
  } catch (e) {
    return String(args[0]);
  }
};

/**
 * Set the minimum log level
 */
export const setLogLevel = (level: LogLevel): void => {
  currentLogLevel = level;
};

/**
 * Structured logger with deduplication
 */
export const logger = {
  debug: (message: string, ...args: any[]): void => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      if (shouldSkipDuplicateLog('debug', message, args)) return;
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]): void => {
    if (currentLogLevel <= LogLevel.INFO) {
      if (shouldSkipDuplicateLog('info', message, args)) return;
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]): void => {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]): void => {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  
  // For measuring performance
  time: (label: string): void => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.time(`⏱️ ${label}`);
    }
  },
  
  timeEnd: (label: string): void => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      console.timeEnd(`⏱️ ${label}`);
    }
  }
};

/**
 * Check if we should skip a duplicate log
 */
const shouldSkipDuplicateLog = (level: string, message: string, args: any[]): boolean => {
  // Generate a unique key for this log message
  const logHash = `${level}:${message}:${getLogHash(args)}`;
  
  // Check if we've seen this log before
  if (logCounts[logHash]) {
    logCounts[logHash]++;
    
    // Only show repeated messages every 5th occurrence
    if (logCounts[logHash] % 5 !== 0) {
      return true;
    } else {
      console.log(`[Repeated ${logCounts[logHash]} times] ${message}`);
      return true;
    }
  } else {
    // First time seeing this log
    logCounts[logHash] = 1;
    return false;
  }
};

/**
 * Apply console filters to clean up production logs
 */
export const applyConsoleFilters = (): void => {
  if (process.env.NODE_ENV !== 'production') return;
  
  // Store original methods
  const originalLog = console.log;
  const originalDebug = console.debug;
  const originalInfo = console.info;
  
  // Replace with filtered versions
  console.debug = function(...args: any[]) {
    // Disable in production
  };
  
  console.info = function(...args: any[]) {
    // Disable in production
  };
  
  console.log = function(...args: any[]) {
    // Only allow important logs in production
    if (args[0] && typeof args[0] === 'string' && 
       (args[0].includes('[ERROR]') || 
        args[0].includes('[WARN]') || 
        args[0].includes('error:') || 
        args[0].includes('warning:') ||
        args[0].includes('critical'))) {
      originalLog.apply(console, args);
    }
  };
};
