// Settings utility (check if already declared to prevent duplicate)
if (typeof Settings === 'undefined') {
class Settings {
  constructor() {
    this.initDarkMode();
  }

  // Initialize dark mode from localStorage or system preference
  initDarkMode() {
    const stored = localStorage.getItem('darkMode');
    const isDark = stored === 'true' || 
                   (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    this.setDarkMode(isDark, false);
  }

  // Toggle dark mode
  toggleDarkMode() {
    const isDark = document.documentElement.classList.contains('dark');
    this.setDarkMode(!isDark, true);
  }

  // Set dark mode
  setDarkMode(enabled, save = true) {
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    if (save) {
      localStorage.setItem('darkMode', enabled.toString());
    }
  }

  // Get dark mode status
  isDarkMode() {
    return document.documentElement.classList.contains('dark');
  }

  // Get HSK level
  getHSKLevel() {
    return localStorage.getItem('hskLevel') || '1';
  }

  // Set HSK level
  setHSKLevel(level) {
    localStorage.setItem('hskLevel', level);
  }

  // Get daily goal (in minutes)
  getDailyGoal() {
    return parseInt(localStorage.getItem('dailyGoal') || '20');
  }

  // Set daily goal
  setDailyGoal(minutes) {
    localStorage.setItem('dailyGoal', minutes.toString());
  }

  // Get notifications enabled status
  getNotificationsEnabled() {
    return localStorage.getItem('notificationsEnabled') !== 'false';
  }

  // Set notifications enabled
  setNotificationsEnabled(enabled) {
    localStorage.setItem('notificationsEnabled', enabled.toString());
  }

  // Get interface language
  getInterfaceLanguage() {
    return localStorage.getItem('interfaceLanguage') || 'en';
  }

  // Set interface language
  setInterfaceLanguage(language) {
    localStorage.setItem('interfaceLanguage', language);
  }
}

// Create global instance
var settings = new Settings();
}
