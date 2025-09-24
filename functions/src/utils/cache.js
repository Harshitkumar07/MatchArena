const { LRUCache } = require('lru-cache');
const functions = require('firebase-functions');

// Cache configuration
const CACHE_CONFIG = {
  live: {
    ttl: 15 * 1000, // 15 seconds
    staleWhileRevalidate: 30 * 1000 // 30 seconds
  },
  upcoming: {
    ttl: 120 * 1000, // 2 minutes
    staleWhileRevalidate: 300 * 1000 // 5 minutes
  },
  recent: {
    ttl: 300 * 1000, // 5 minutes
    staleWhileRevalidate: 600 * 1000 // 10 minutes
  },
  leagues: {
    ttl: 12 * 60 * 60 * 1000, // 12 hours
    staleWhileRevalidate: 24 * 60 * 60 * 1000 // 24 hours
  },
  standings: {
    ttl: 12 * 60 * 60 * 1000, // 12 hours
    staleWhileRevalidate: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Create LRU cache instance
const cache = new LRUCache({
  max: 500, // Maximum number of items
  ttl: 5 * 60 * 1000, // Default TTL: 5 minutes
  updateAgeOnGet: false,
  updateAgeOnHas: false
});

// In-flight requests map to prevent duplicate API calls
const inFlightRequests = new Map();

/**
 * Generate cache key from endpoint and params
 */
const generateCacheKey = (endpoint, params = {}) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return `${endpoint}${sortedParams ? '?' + sortedParams : ''}`;
};

/**
 * Get cached data or fetch from upstream
 */
const getCachedOrFetch = async (key, fetcher, cacheType = 'upcoming') => {
  const config = CACHE_CONFIG[cacheType] || CACHE_CONFIG.upcoming;
  
  // Check if request is already in flight
  if (inFlightRequests.has(key)) {
    functions.logger.info(`Waiting for in-flight request: ${key}`);
    return inFlightRequests.get(key);
  }

  // Check cache
  const cached = cache.get(key);
  if (cached) {
    const age = Date.now() - cached.timestamp;
    
    if (age < config.ttl) {
      functions.logger.info(`Cache hit (fresh): ${key}`);
      return cached.data;
    }
    
    if (age < config.staleWhileRevalidate) {
      functions.logger.info(`Cache hit (stale, revalidating): ${key}`);
      // Return stale data and revalidate in background
      revalidateInBackground(key, fetcher, config);
      return cached.data;
    }
  }

  // No cache or expired, fetch from upstream
  functions.logger.info(`Cache miss, fetching: ${key}`);
  
  try {
    const fetchPromise = fetcher();
    inFlightRequests.set(key, fetchPromise);
    
    const data = await fetchPromise;
    
    // Store in cache
    cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    functions.logger.error(`Fetch error for ${key}:`, error);
    
    // If we have stale data, return it
    if (cached) {
      functions.logger.warn(`Returning stale cache due to error: ${key}`);
      return cached.data;
    }
    
    throw error;
  } finally {
    inFlightRequests.delete(key);
  }
};

/**
 * Revalidate cache in background
 */
const revalidateInBackground = (key, fetcher, config) => {
  // Don't wait for this promise
  fetcher()
    .then(data => {
      functions.logger.info(`Background revalidation success: ${key}`);
      cache.set(key, {
        data,
        timestamp: Date.now()
      });
    })
    .catch(error => {
      functions.logger.error(`Background revalidation failed: ${key}`, error);
    });
};

/**
 * Set appropriate cache headers for response
 */
const setCacheHeaders = (res, cacheType = 'upcoming') => {
  const config = CACHE_CONFIG[cacheType] || CACHE_CONFIG.upcoming;
  const maxAge = Math.floor(config.ttl / 1000);
  const staleWhileRevalidate = Math.floor(config.staleWhileRevalidate / 1000);
  
  res.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
};

/**
 * Clear cache for specific pattern or all
 */
const clearCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    functions.logger.info('Cache cleared: all');
    return;
  }
  
  const keys = [...cache.keys()];
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
      functions.logger.info(`Cache cleared: ${key}`);
    }
  });
};

module.exports = {
  generateCacheKey,
  getCachedOrFetch,
  setCacheHeaders,
  clearCache,
  CACHE_CONFIG
};