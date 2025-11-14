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
    }
  };
}
