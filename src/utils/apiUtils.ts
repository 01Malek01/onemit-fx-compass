
/**
 * Utilities for API requests and timeout handling
 */

/**
 * Execute a fetch request with timeout
 * @param url The URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise with response
 */
export const fetchWithTimeout = async <T>(
  url: string, 
  options?: RequestInit, 
  timeoutMs: number = 5000
): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Set high priority fetch for critical resources
      priority: 'high'
    });
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    return await response.json() as T;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Create a promise that rejects after a timeout
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that rejects after timeout
 */
export const createTimeout = (timeoutMs: number): Promise<never> => {
  return new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
  );
};

/**
 * Race a promise against a timeout
 * @param promise Promise to race
 * @param timeoutMs Timeout in milliseconds
 * @param timeoutMessage Optional message for timeout error
 * @returns Promise result or timeout error
 */
export const raceWithTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage?: string
): Promise<T> => {
  const timeoutError = new Error(timeoutMessage || `Request timed out after ${timeoutMs}ms`);
  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(timeoutError), timeoutMs)
  );
  
  return Promise.race([promise, timeoutPromise]);
};
