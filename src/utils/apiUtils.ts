/**
 * Performance-optimized utilities for API requests and timeout handling
 */

/**
 * Execute a fetch request with timeout and abort controller
 * Optimized to reduce memory usage and improve response time
 */
export const fetchWithTimeout = async <T>(
  url: string, 
  options?: RequestInit, 
  timeoutMs: number = 3000 // Reduced default timeout
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Set high priority fetch for critical resources
      priority: 'high',
      // Disable keep-alive for faster connection setup
      headers: {
        ...options?.headers,
        'Connection': 'close'
      },
      cache: 'default' // Let browser handle caching for performance
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json() as T;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Create a timeout promise with immediate cleanup
 */
export const createTimeout = (timeoutMs: number): Promise<never> => {
  let timeoutId: NodeJS.Timeout;
  
  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  // Add a cleanup method to the promise
  (promise as any).cleanup = () => clearTimeout(timeoutId);
  
  return promise;
};

/**
 * Race with timeout and auto-cleanup to prevent memory leaks
 */
export const raceWithTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage?: string
): Promise<T> => {
  const timeoutPromise = createTimeout(timeoutMs);
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    // Clean up the timeout to prevent memory leaks
    if ((timeoutPromise as any).cleanup) {
      (timeoutPromise as any).cleanup();
    }
  }
};
