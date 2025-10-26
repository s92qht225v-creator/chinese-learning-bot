// API Configuration - automatically detects environment
const API_CONFIG = {
  getBaseUrl() {
    // Check if we're in production (on Cloudflare Pages)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Production - use HTTPS API subdomain
      return 'https://api.lingo.uz';
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

// Export for use in HTML files
window.API_CONFIG = API_CONFIG;
