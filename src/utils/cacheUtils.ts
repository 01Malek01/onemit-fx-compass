
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

// Optimized browser storage with batch operations support
export const browserStorage = {
  /**
   * Get an item from localStorage with expiry check and error handling
   */
  getItem(key: string) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { value, expiry } = JSON.parse(item);
      if (expiry && Date.now() > expiry) {
        localStorage.removeItem(key);
        return null;
      }
      return value;
    } catch {
      // Silent failure for better performance
      return null;
    }
  },
  
  /**
   * Set an item in localStorage with expiry
   */
  setItem(key: string, value: any, ttlMs = 3600000) { // 1 hour default TTL
    try {
      const item = {
        value,
        expiry: Date.now() + ttlMs
      };
      localStorage.setItem(key, JSON.stringify(item));
      return true;
    } catch {
      // Silent failure for better performance
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
        const item = {
          value,
          expiry
        };
        localStorage.setItem(key, JSON.stringify(item));
      }
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Clean up expired items to free localStorage space
   */
  cleanup() {
    try {
      const now = Date.now();
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        
        const item = localStorage.getItem(key);
        if (!item) continue;
        
        try {
          const parsed = JSON.parse(item);
          if (parsed.expiry && now > parsed.expiry) {
            localStorage.removeItem(key);
          }
        } catch {
          // Skip invalid items
        }
      }
    } catch {
      // Silent failure
    }
  }
};

// Run cleanup once on module import
setTimeout(() => {
  cacheWithExpiration.cleanup();
  browserStorage.cleanup();
}, 0);
