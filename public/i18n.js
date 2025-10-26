// Internationalization (i18n) - Translation system
const translations = {
  en: {
    // Part of speech
    pos: {
      'n': 'noun',
      'v': 'verb',
      'adj': 'adjective',
      'adv': 'adverb',
      'pron': 'pronoun',
      'prep': 'preposition',
      'conj': 'conjunction',
      'interj': 'interjection',
      'mw': 'measure word',
      'particle': 'particle'
    },
    // Common UI labels
    home: 'Home',
    learn: 'Learn',
    practice: 'Practice',
    profile: 'Profile',
    lessons: 'Lessons',
    vocabulary: 'Vocabulary',
    flashcards: 'Flashcards',
    quiz: 'Quiz',
    characterWriting: 'Character Writing',
    dailyGoal: 'Daily Goal',
    streak: 'Day Streak',
    progress: 'Progress',
    completed: 'Completed',
    inProgress: 'In Progress',
    start: 'Start',
    continue: 'Continue',
    review: 'Review',
    back: 'Back',
    next: 'Next',
    settings: 'Settings',
    language: 'Language',
    hskLevel: 'HSK Level'
  },
  uz: {
    // Part of speech
    pos: {
      'n': 'ot',
      'v': 'fe\'l',
      'adj': 'sifat',
      'adv': 'ravish',
      'pron': 'olmosh',
      'prep': 'predlog',
      'conj': 'bog\'lovchi',
      'interj': 'undov',
      'mw': 'o\'lchov so\'zi',
      'particle': 'yuklamcha'
    },
    // Common UI labels
    home: 'Bosh sahifa',
    learn: 'O\'rganish',
    practice: 'Mashq qilish',
    profile: 'Profil',
    lessons: 'Darslar',
    vocabulary: 'Lug\'at',
    flashcards: 'Kartalar',
    quiz: 'Test',
    characterWriting: 'Yozish',
    dailyGoal: 'Kunlik maqsad',
    streak: 'Kun ketma-ketligi',
    progress: 'Jarayon',
    completed: 'Tugallandi',
    inProgress: 'Jarayonda',
    start: 'Boshlash',
    continue: 'Davom etish',
    review: 'Ko\'rib chiqish',
    back: 'Orqaga',
    next: 'Keyingi',
    settings: 'Sozlamalar',
    language: 'Til',
    hskLevel: 'HSK darajasi'
  },
  ru: {
    // Part of speech
    pos: {
      'n': 'сущ.',
      'v': 'глагол',
      'adj': 'прил.',
      'adv': 'нареч.',
      'pron': 'мест.',
      'prep': 'предлог',
      'conj': 'союз',
      'interj': 'межд.',
      'mw': 'счётное слово',
      'particle': 'частица'
    },
    // Common UI labels
    home: 'Главная',
    learn: 'Учить',
    practice: 'Практика',
    profile: 'Профиль',
    lessons: 'Уроки',
    vocabulary: 'Словарь',
    flashcards: 'Карточки',
    quiz: 'Тест',
    characterWriting: 'Письмо',
    dailyGoal: 'Дневная цель',
    streak: 'Дней подряд',
    progress: 'Прогресс',
    completed: 'Завершено',
    inProgress: 'В процессе',
    start: 'Начать',
    continue: 'Продолжить',
    review: 'Повторить',
    back: 'Назад',
    next: 'Далее',
    settings: 'Настройки',
    language: 'Язык',
    hskLevel: 'Уровень HSK'
  }
};

// Language manager
const i18n = {
  currentLanguage: localStorage.getItem('appLanguage') || 'en',
  
  // Set language
  setLanguage(lang) {
    if (translations[lang]) {
      this.currentLanguage = lang;
      localStorage.setItem('appLanguage', lang);
      // Dispatch event so other parts of the app can react
      window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    }
  },
  
  // Get translation
  t(key, subkey = null) {
    const lang = this.currentLanguage;
    if (subkey) {
      return translations[lang]?.[key]?.[subkey] || translations['en'][key]?.[subkey] || subkey;
    }
    return translations[lang]?.[key] || translations['en'][key] || key;
  },
  
  // Get part of speech translation
  pos(abbreviation) {
    return this.t('pos', abbreviation);
  },
  
  // Get current language
  getLanguage() {
    return this.currentLanguage;
  },
  
  // Get available languages
  getLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'uz', name: 'Uzbek', nativeName: 'O\'zbekcha' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' }
    ];
  }
};

// Export for use in HTML files
window.i18n = i18n;
