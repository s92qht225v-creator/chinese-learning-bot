// Telegram WebApp user authentication
class TelegramAuth {
  constructor() {
    this.tg = window.Telegram?.WebApp;
    this.user = null;
    this.init();
  }

  init() {
    if (this.tg && this.tg.initDataUnsafe?.user) {
      this.user = this.tg.initDataUnsafe.user;
      console.log('User authenticated:', this.user.id);
    } else {
      console.warn('Telegram WebApp not available or no user data');
    }
  }

  getUserId() {
    return this.user?.id || null;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.user !== null;
  }

  // Add user ID to API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.user) {
      headers['X-Telegram-User-Id'] = this.user.id.toString();
      headers['X-Telegram-Username'] = this.user.username || '';
      headers['X-Telegram-First-Name'] = this.user.first_name || '';
    }
    
    return headers;
  }
}

// Global instance
const telegramAuth = new TelegramAuth();
window.telegramAuth = telegramAuth;
