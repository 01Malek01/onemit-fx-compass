
/**
 * Utilities for caching data in memory and localStorage with expiration
 */

// A simple in-memory cache with cache expiry
export const cacheWithExpiration = {
  data: {} as Record<string, any>,
  timestamps: {} as Record<string, number>,
  
  /**
   * Set a value in the cache with expiration
   */
  set(key: string, value: any, expiryMs = 300000) { // Default 5 minute expiry
    this.data[key] = value;
    this.timestamps[key] = Date.now() + expiryMs;
  },
  
  /**
   * Get a value from the cache, returns null if expired
   */
  get(key: string) {
    const now = Date.now();
    if (this.timestamps[key] && now < this.timestamps[key]) {
      return this.data[key];
    }
    return null;
  },
  
  /**
   * Check if a cache entry is valid
   */
  isValid(key: string) {
    const now = Date.now();
    return this.timestamps[key] && now < this.timestamps[key];
  }
};

// Browser storage for frequently accessed data with TTL
export const browserStorage = {
  /**
   * Get an item from localStorage with expiry check
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
    } catch (e) {
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
    } catch (e) {
      return false;
    }
  }
};
