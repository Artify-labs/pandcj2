// Honda Civic level optimization: In-memory caching layer
// Reduces database queries for frequently accessed data

class DataCache {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
  }

  set(key, data, ttlMs = 3600000) { // Default 1 hour
    // Clear old timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })

    // Auto-expire after TTL
    const timer = setTimeout(() => {
      this.cache.delete(key)
      this.timers.delete(key)
    }, ttlMs)
    
    this.timers.set(key, timer)
  }

  get(key) {
    if (!this.cache.has(key)) return null

    const entry = this.cache.get(key)
    const age = Date.now() - entry.timestamp

    if (age > entry.ttl) {
      this.cache.delete(key)
      this.timers.delete(key)
      return null
    }

    return entry.data
  }

  clear(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    this.cache.delete(key)
  }

  clearAll() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.cache.clear()
    this.timers.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

const globalCache = new DataCache()

// Cache keys for common data
const CACHE_KEYS = {
  // Settings cache (1 hour)
  BANNER_SETTINGS: 'banner:settings',
  PAGEINTRO_SETTINGS: 'pageintro:settings',
  STORE_SETTINGS: (storeId) => `store:settings:${storeId}`,
  
  // Product cache (30 minutes)
  POPULAR_PRODUCTS: 'products:popular',
  PRODUCTS_BY_STORE: (storeId) => `products:store:${storeId}`,
  
  // Store cache (1 hour)
  STORES_LIST: 'stores:list',
  STORE_DETAILS: (storeId) => `store:${storeId}`,
  
  // Analytics cache (1 hour)
  ORDER_SUMMARY: (storeId) => `orders:summary:${storeId || 'all'}`,
  REVENUE_STATS: (storeId) => `orders:revenue:${storeId || 'all'}`,
  
  // Category cache (2 hours)
  CATEGORIES_LIST: 'categories:list'
}

const CACHE_TTL = {
  SHORT: 900000,      // 15 minutes - frequently changing data
  MEDIUM: 1800000,    // 30 minutes - product/category data
  LONG: 3600000,      // 1 hour - settings, store data
  VERYLONG: 7200000   // 2 hours - categories, static data
}

export { globalCache, CACHE_KEYS, CACHE_TTL }
