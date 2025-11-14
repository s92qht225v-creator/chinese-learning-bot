// API Configuration - automatically detects environment
if (typeof window.API_CONFIG === 'undefined') {
  window.API_CONFIG = {
    getBaseUrl() {
      // Check if we're in production
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Production - use same domain
        return window.location.origin;
      }
      // Development - use local backend
      return 'http://localhost:3000';
    },

    // API endpoints
    endpoints: {
      vocabulary: '/api/vocabulary',
      vocabularyRandom: '/api/vocabulary/random',
      quiz: '/api/quiz'
    },

    // Helper to build full URL
    url(endpoint) {
      return this.getBaseUrl() + endpoint;
    },

    // Cache configuration (TTL in milliseconds)
    cacheTTL: {
      lessons: 30 * 60 * 1000,        // 30 minutes - lesson content rarely changes
      vocabulary: 30 * 60 * 1000,     // 30 minutes - vocabulary rarely changes
      dialogues: 30 * 60 * 1000,      // 30 minutes - dialogues rarely changes
      grammar: 30 * 60 * 1000,        // 30 minutes - grammar rarely changes
      characterWriting: 30 * 60 * 1000, // 30 minutes - character list rarely changes
      default: 5 * 60 * 1000          // 5 minutes - default for other endpoints
    },

    // Get cache key from URL
    getCacheKey(url) {
      return 'api_cache_' + url;
    },

    // Check if cached data is still valid
    isCacheValid(cacheEntry) {
      if (!cacheEntry || !cacheEntry.timestamp) return false;
      const now = Date.now();
      const age = now - cacheEntry.timestamp;
      return age < (cacheEntry.ttl || this.cacheTTL.default);
    },

    // Get cached data if valid
    getCached(url) {
      try {
        const key = this.getCacheKey(url);
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const cacheEntry = JSON.parse(cached);
        if (this.isCacheValid(cacheEntry)) {
          console.log('📦 Cache HIT:', url);
          return cacheEntry.data;
        } else {
          console.log('⏰ Cache EXPIRED:', url);
          localStorage.removeItem(key);
          return null;
        }
      } catch (error) {
        console.error('Cache read error:', error);
        return null;
      }
    },

    // Store data in cache
    setCached(url, data, ttl) {
      try {
        const key = this.getCacheKey(url);
        const cacheEntry = {
          data: data,
          timestamp: Date.now(),
          ttl: ttl || this.cacheTTL.default
        };
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        console.log('💾 Cached:', url);
      } catch (error) {
        console.error('Cache write error:', error);
        // If quota exceeded, clear old cache entries
        if (error.name === 'QuotaExceededError') {
          this.clearOldCache();
        }
      }
    },

    // Clear old cache entries
    clearOldCache() {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('api_cache_')) {
            const cached = localStorage.getItem(key);
            if (cached) {
              const entry = JSON.parse(cached);
              if (!this.isCacheValid(entry)) {
                localStorage.removeItem(key);
              }
            }
          }
        });
      } catch (error) {
        console.error('Cache cleanup error:', error);
      }
    },

    // Determine TTL based on URL
    getTTL(url) {
      if (url.includes('/api/lessons/') && url.includes('/dialogues')) {
        return this.cacheTTL.dialogues;
      } else if (url.includes('/api/lessons/') && url.includes('/grammar')) {
        return this.cacheTTL.grammar;
      } else if (url.includes('/api/lessons/')) {
        return this.cacheTTL.lessons;
      } else if (url.includes('/api/vocabulary')) {
        return this.cacheTTL.vocabulary;
      } else if (url.includes('/api/character-writing')) {
        return this.cacheTTL.characterWriting;
      }
      return this.cacheTTL.default;
    },

    // Enhanced fetch with caching
    async cachedFetch(url, options = {}) {
      // Only cache GET requests
      if (options.method && options.method !== 'GET') {
        return fetch(url, options);
      }

      // Check cache first
      const cached = this.getCached(url);
      if (cached) {
        return {
          ok: true,
          json: async () => cached,
          clone: function() { return this; }
        };
      }

      // Fetch from server
      const response = await fetch(url, options);

      // Cache successful GET responses
      if (response.ok && (!options.method || options.method === 'GET')) {
        const clone = response.clone();
        const data = await clone.json();
        const ttl = this.getTTL(url);
        this.setCached(url, data, ttl);
      }

      return response;
    }
  };
}
