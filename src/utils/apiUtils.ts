
/**
 * Performance-optimized utilities for API requests and timeout handling
 */

type AbortablePromise<T> = Promise<T> & {
  abort: () => void;
};

/**
 * Execute a fetch request with timeout and abort controller
 * Optimized to reduce memory usage and improve response time
 */
export const fetchWithTimeout = <T>(
  url: string, 
  options?: RequestInit, 
  timeoutMs: number = 3000 // Reduced default timeout
): AbortablePromise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  const promise = fetch(url, {
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
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json() as T;
    })
    .finally(() => clearTimeout(timeoutId)) as AbortablePromise<T>;
  
  // Add abort method to the promise
  promise.abort = () => {
    clearTimeout(timeoutId);
    controller.abort();
  };
  
  return promise;
};

/**
 * Create a timeout promise with immediate cleanup
 */
export const createTimeout = (timeoutMs: number): Promise<never> & {cleanup: () => void} => {
  let timeoutId: NodeJS.Timeout;
  
  const promise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  }) as Promise<never> & {cleanup: () => void};
  
  // Add a cleanup method to the promise
  promise.cleanup = () => clearTimeout(timeoutId);
  
  return promise;
};

/**
 * Cancellable Promise wrapper
 */
export class CancellablePromise<T> {
  private controller: AbortController;
  private promise: Promise<T>;
  
  constructor(promiseFn: (signal: AbortSignal) => Promise<T>) {
    this.controller = new AbortController();
    this.promise = promiseFn(this.controller.signal);
  }
  
  cancel(): void {
    this.controller.abort();
  }
  
  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onFulfilled, onRejected);
  }
  
  catch<TResult = never>(
    onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.promise.catch(onRejected);
  }
  
  finally(onFinally?: (() => void) | null): Promise<T> {
    return this.promise.finally(onFinally);
  }
}

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

/**
 * Batch multiple fetch requests but allow early resolution
 * This helps in situations where we need multiple API calls but want to show
 * something to users as soon as possible
 */
export const batchWithEarlyResolution = async <T>(
  promises: Promise<T>[],
  earlyResolutionCount: number = 1,
  timeoutMs: number = 5000
): Promise<T[]> => {
  if (earlyResolutionCount <= 0 || earlyResolutionCount > promises.length) {
    earlyResolutionCount = 1;
  }
  
  const results: T[] = [];
  const errors: Error[] = [];
  
  // Create a promise that resolves after a minimum number of other promises resolve
  const earlyResolution = new Promise<T[]>((resolve, reject) => {
    let resolvedCount = 0;
    
    // Set up timeout for the entire batch
    const timeoutId = setTimeout(() => {
      // If we have at least one result, resolve with what we have
      if (results.length > 0) {
        resolve([...results]);
      } else {
        reject(new Error(`Batch timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
    
    // Process each promise
    promises.forEach(promise => {
      promise
        .then(result => {
          results.push(result);
          resolvedCount++;
          
          // If we've reached our early resolution threshold, resolve
          if (resolvedCount >= earlyResolutionCount) {
            clearTimeout(timeoutId);
            resolve([...results]);
          }
        })
        .catch(err => {
          errors.push(err);
          // If all promises have either resolved or rejected, see if we can resolve early
          if (results.length + errors.length === promises.length) {
            if (results.length > 0) {
              clearTimeout(timeoutId);
              resolve([...results]);
            } else {
              clearTimeout(timeoutId);
              reject(new Error('All promises failed'));
            }
          }
        });
    });
  });
  
  return earlyResolution;
};
