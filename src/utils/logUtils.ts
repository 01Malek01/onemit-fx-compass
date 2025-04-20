// Define log levels
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Current log level setting - can be changed dynamically
let currentLogLevel = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

// Keep track of message counts to avoid console spam
const messageCounts: Record<string, number> = {};

// Maximum logs of the same message to show
const MAX_REPEAT_LOGS = 5;

// Cache for grouped logs (to avoid showing the same group repeatedly)
const groupCache = new Set<string>();

/**
 * Logger with filtering and grouping capabilities
 */
export const logger = {
  debug: (message: string, ...data: any[]) => {
    if (currentLogLevel <= LogLevel.DEBUG) {
      logWithDeduplication('debug', message, data);
    }
  },
  
  info: (message: string, ...data: any[]) => {
    if (currentLogLevel <= LogLevel.INFO) {
      logWithDeduplication('info', message, data);
    }
  },
  
  warn: (message: string, ...data: any[]) => {
    if (currentLogLevel <= LogLevel.WARN) {
      console.warn(message, ...data);
    }
  },
  
  error: (message: string, ...data: any[]) => {
    if (currentLogLevel <= LogLevel.ERROR) {
      console.error(message, ...data);
    }
  },
  
  // Group related logs together
  group: (key: string, message: string, callback: () => void) => {
    if (currentLogLevel !== LogLevel.NONE && !groupCache.has(key)) {
      console.groupCollapsed(message);
      callback();
      console.groupEnd();
      groupCache.add(key);
    } else if (currentLogLevel !== LogLevel.NONE) {
      callback();
    }
  },
  
  // Set the logger level
  setLevel: (level: LogLevel) => {
    currentLogLevel = level;
  }
};

// Helper function to deduplicate logs
function logWithDeduplication(method: 'log' | 'info' | 'debug', message: string, data: any[]) {
  const key = `${method}-${message}`;
  
  if (!messageCounts[key]) {
    messageCounts[key] = 1;
    console[method](message, ...data);
  } else if (messageCounts[key] < MAX_REPEAT_LOGS) {
    messageCounts[key]++;
    console[method](message, ...data);
  } else if (messageCounts[key] === MAX_REPEAT_LOGS) {
    messageCounts[key]++;
    console[method](`${message} (further logs suppressed)`, ...data);
  }
  // If over MAX_REPEAT_LOGS, don't log
}

/**
 * Apply console filters to clean up the console in production
 */
export const applyConsoleFilters = () => {
  // In production, limit console output
  if (process.env.NODE_ENV === 'production') {
    const originalConsoleLog = console.log;
    const originalConsoleDebug = console.debug;
    const originalConsoleInfo = console.info;
    
    console.log = (...args) => {
      // Only show logs in production if they contain important keywords
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('error') || 
           args[0].includes('critical') || 
           args[0].includes('warn'))) {
        originalConsoleLog.apply(console, args);
      }
    };
    
    console.debug = () => {};  // Disable debug in production
    console.info = () => {};   // Disable info in production
  } else {
    // In development, organize console output
    const seenMessages = new Set();
    const originalConsoleLog = console.log;
    
    console.log = function(...args) {
      // Detect repeated messages
      const message = JSON.stringify(args);
      if (seenMessages.has(message)) {
        return;  // Don't log repeated messages
      }
      seenMessages.add(message);
      
      // Limit the size of seenMessages to prevent memory leaks
      if (seenMessages.size > 1000) {
        seenMessages.clear();
      }
      
      originalConsoleLog.apply(console, args);
    };
  }
};
