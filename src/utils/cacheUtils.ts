/**
 * High-performance caching utilities for in-memory and localStorage
 * with optimized expiration and memory management
 */

// A memory-efficient in-memory cache with LRU features
export const cacheWithExpiration = {
  data: {} as Record<string, any>,
  timestamps: {} as Record<string, number>,
  maxEntries: 50, // Limit cache size for memory efficiency
  keyOrder: [] as string[], // Track key insertion order for LRU
  
  /**
   * Set a value in the cache with expiration and LRU management
   */
  set(key: string, value: any, expiryMs = 300000) { // Default 5 minute expiry
    // Check if we need to evict entries
    if (!this.timestamps[key] && this.keyOrder.length >= this.maxEntries) {
      const oldestKey = this.keyOrder.shift();
      if (oldestKey) {
        delete this.data[oldestKey];
        delete this.timestamps[oldestKey];
      }
    }
    
    // Remove existing key from order if it exists
    if (this.timestamps[key]) {
      const index = this.keyOrder.indexOf(key);
      if (index !== -1) {
        this.keyOrder.splice(index, 1);
      }
    }
    
    // Add the new key to the end of the order (most recently used)
    this.keyOrder.push(key);
    
    // Set data and timestamp
    this.data[key] = value;
    this.timestamps[key] = Date.now() + expiryMs;
  },
  
  /**
   * Get a value from the cache, with LRU update
   */
  get(key: string) {
    const now = Date.now();
    if (this.timestamps[key] && now < this.timestamps[key]) {
      // Move this key to the end of the order (most recently used)
      const index = this.keyOrder.indexOf(key);
      if (index !== -1) {
        this.keyOrder.splice(index, 1);
        this.keyOrder.push(key);
      }
      return this.data[key];
    }
    
    // Remove expired item
    if (this.timestamps[key]) {
      delete this.data[key];
      delete this.timestamps[key];
      const index = this.keyOrder.indexOf(key);
      if (index !== -1) {
        this.keyOrder.splice(index, 1);
      }
    }
    
    return null;
  },
  
  /**
   * Check if a cache entry is valid
   */
  isValid(key: string) {
    const now = Date.now();
    return this.timestamps[key] && now < this.timestamps[key];
  },
  
  /**
   * Clear expired cache entries to free memory
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const key of this.keyOrder) {
      if (now >= this.timestamps[key]) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      delete this.data[key];
      delete this.timestamps[key];
      const index = this.keyOrder.indexOf(key);
      if (index !== -1) {
        this.keyOrder.splice(index, 1);
      }
    }
  }
};

// Define types for our cache structures
type CacheItem<T> = {
  value: T;
  expiry?: number;
};

// Optimized browser storage with batch operations support
export const browserStorage = {
  /**
   * Get an item from localStorage with expiry check and error handling
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      // Safely parse JSON with validation
      let parsed: CacheItem<T> | null = null;
      try {
        const rawParsed = JSON.parse(item);
        // Validate object structure to prevent JSON injection attacks
        if (typeof rawParsed === 'object' && rawParsed !== null) {
          // Only accept expected properties
          parsed = {
            value: rawParsed.value as T,
            expiry: typeof rawParsed.expiry === 'number' ? rawParsed.expiry : undefined
          };
        }
      } catch (e) {
        console.warn(`Invalid JSON in localStorage for key: ${key}`);
        localStorage.removeItem(key);
        return null;
      }
      
      if (!parsed) {
        localStorage.removeItem(key);
        return null;
      }
      
      if (parsed.expiry && Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      // Log error but fail silently to the user
      console.warn('Error accessing localStorage:', error);
      return null;
    }
  },
  
  /**
   * Set an item in localStorage with expiry
   */
  setItem<T>(key: string, value: T, ttlMs = 3600000): boolean { // 1 hour default TTL
    try {
      // Safely store primitives, arrays and plain objects only
      const safeValue = this.sanitizeForStorage(value);
      
      const item: CacheItem<typeof safeValue> = {
        value: safeValue,
        expiry: Date.now() + ttlMs
      };
      
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
      return false;
    }
  },
  
  /**
   * Set multiple items at once to reduce localStorage operations
   */
  setItems<T extends Record<string, unknown>>(items: T, ttlMs = 3600000): boolean {
    try {
      const expiry = Date.now() + ttlMs;
      
      for (const [key, value] of Object.entries(items)) {
        // Safely store primitives, arrays and plain objects only
        const safeValue = this.sanitizeForStorage(value);
        
        const item: CacheItem<typeof safeValue> = {
          value: safeValue,
          expiry
        };
        
        localStorage.setItem(key, JSON.stringify(item));
      }
      return true;
    } catch (error) {
      console.warn('Error in batch localStorage operation:', error);
      return false;
    }
  },
  
  /**
   * Clean up expired items to free localStorage space
   */
  cleanup(): void {
    try {
      const now = Date.now();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        try {
          const parsed = JSON.parse(item);
          // Validate object structure
          if (typeof parsed === 'object' && 
              parsed !== null &&
              typeof parsed.expiry === 'number' &&
              now > parsed.expiry) {
            localStorage.removeItem(key);
          }
        } catch {
          // Skip invalid items
        }
      }
    } catch {
      // Silent failure
    }
  },
  
  /**
   * Sanitize values for safe storage
   * Only allows primitives, plain objects, and arrays
   */
  sanitizeForStorage<T>(value: T): unknown {
    const type = typeof value;
    
    // Allow primitive types directly
    if (type === 'string' || type === 'number' || type === 'boolean' || value === null) {
      return value;
    }
    
    // Handle arrays recursively
    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeForStorage(item));
    }
    
    // Handle plain objects recursively
    if (type === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
        // Skip functions, symbols, etc.
        const valType = typeof val;
        if (valType === 'function' || valType === 'symbol' || valType === 'undefined') {
          continue;
        }
        result[key] = this.sanitizeForStorage(val);
      }
      return result;
    }
    
    // For other types (functions, symbols, etc.), return null
    return null;
  }
};

// Run cleanup once on module import
setTimeout(() => {
  cacheWithExpiration.cleanup();
  browserStorage.cleanup();
}, 0);
