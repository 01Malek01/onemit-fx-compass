
/**
 * High-performance caching utilities for in-memory and localStorage
 * with optimized expiration and memory management
 */

type CacheItem = {
  value: any;
  expiry: number;
};

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
    if (value === undefined || value === null) {
      console.warn(`[Cache] Attempted to cache undefined/null value for key: ${key}`);
      return;
    }
    
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
    this.timestamps[key] = expiryMs > 0 ? Date.now() + expiryMs : Infinity;
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
      this.remove(key);
    }
    
    return null;
  },
  
  /**
   * Remove a specific item from cache
   */
  remove(key: string) {
    delete this.data[key];
    delete this.timestamps[key];
    const index = this.keyOrder.indexOf(key);
    if (index !== -1) {
      this.keyOrder.splice(index, 1);
    }
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
      if (this.timestamps[key] !== Infinity && now >= this.timestamps[key]) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      this.remove(key);
    }
    
    return expiredKeys.length; // Return number of items cleaned up
  },
  
  /**
   * Clear all cache entries
   */
  clear() {
    this.data = {};
    this.timestamps = {};
    this.keyOrder = [];
  }
};

// Optimized browser storage with batch operations support
export const browserStorage = {
  /**
   * Get an item from localStorage with expiry check and error handling
   */
  getItem(key: string) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item) as CacheItem;
      if (!parsed.expiry || Date.now() > parsed.expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.value;
    } catch {
      // Silent failure for better performance
      return null;
    }
  },
  
  /**
   * Set an item in localStorage with expiry
   */
  setItem(key: string, value: any, ttlMs = 3600000) { // 1 hour default TTL
    if (value === undefined || value === null) {
      console.warn(`[browserStorage] Attempted to cache undefined/null value for key: ${key}`);
      return false;
    }
    
    try {
      const item: CacheItem = {
        value,
        expiry: ttlMs > 0 ? Date.now() + ttlMs : Infinity
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch (error) {
      // Handle quota exceeded errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('[browserStorage] Storage quota exceeded, trying to clean up');
        this.cleanup();
        
        // Try again after cleanup
        try {
          const item: CacheItem = { value, expiry: Date.now() + ttlMs };
          localStorage.setItem(key, JSON.stringify(item));
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  },
  
  /**
   * Set multiple items at once to reduce localStorage operations
   */
  setItems(items: Record<string, any>, ttlMs = 3600000) {
    try {
      const expiry = Date.now() + ttlMs;
      
      for (const [key, value] of Object.entries(items)) {
        if (value === undefined || value === null) continue;
        
        const item: CacheItem = {
          value,
          expiry
        };
        localStorage.setItem(key, JSON.stringify(item));
      }
      return true;
    } catch (error) {
      // Handle quota exceeded errors
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanup();
        return this.setItems(items, ttlMs); // Retry after cleanup
      }
      return false;
    }
  },
  
  /**
   * Remove a specific item
   */
  removeItem(key: string) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Clean up expired items to free localStorage space
   * Returns the number of items removed
   */
  cleanup() {
    try {
      const now = Date.now();
      let cleanupCount = 0;
      
      const keysToDelete: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        try {
          const parsed = JSON.parse(item) as CacheItem;
          if (parsed.expiry && parsed.expiry !== Infinity && now > parsed.expiry) {
            keysToDelete.push(key);
          }
        } catch {
          // Skip invalid items
        }
      }
      
      // Batch remove to improve performance
      for (const key of keysToDelete) {
        localStorage.removeItem(key);
        cleanupCount++;
      }
      
      return cleanupCount;
    } catch {
      // Silent failure
      return 0;
    }
  },
  
  /**
   * Clear all items
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }
};

// Improved initialization - Run cleanup once on module import with error handling
setTimeout(() => {
  try {
    const memoryItemsCleared = cacheWithExpiration.cleanup();
    const storageItemsCleared = browserStorage.cleanup();
    
    if (memoryItemsCleared + storageItemsCleared > 0) {
      console.log(`[Cache] Initial cleanup: removed ${memoryItemsCleared} memory items and ${storageItemsCleared} storage items`);
    }
  } catch (error) {
    console.error('[Cache] Error during initial cleanup:', error);
  }
}, 0);
