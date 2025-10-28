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
    hskLevel: 'HSK Level',
    // Language Selection
    selectLanguage: 'Select Language',
    uzbek: "O'zbek tili",
    russian: "Русский язык",
    english: "English",
    // Level Selection
    selectLevel: 'Select Your HSK Level',
    selectLevelDesc: 'Choose the level that matches your current ability',
    beginner: 'Beginner',
    elementary: 'Elementary',
    intermediate: 'Intermediate',
    upperIntermediate: 'Upper Intermediate',
    advanced: 'Advanced',
    mastery: 'Mastery',
    hsk1Desc: 'Know around 150 common words and basic phrases',
    hsk2Desc: 'Handle simple communication on familiar topics',
    hsk3Desc: 'Communicate in everyday situations',
    hsk4Desc: 'Discuss a variety of topics fluently',
    hsk5Desc: 'Understand complex texts',
    hsk6Desc: 'Full mastery and comprehension',
    startLearning: 'Start Learning',
    // Practice Tab
    practiceDesc: 'Reinforce your knowledge with various exercises',
    flashcardsDesc: 'Memorize and review words',
    quizDesc: 'Test your knowledge',
    favorites: 'Favorites',
    favoritesDesc: 'Your saved words',
    // Writing Tab
    writing: 'Writing',
    strokeOrder: 'Stroke Order',
    yourPractice: 'Your Practice',
    guide: 'Guide',
    undo: 'Undo',
    clear: 'Clear',
    skip: 'Skip',
    check: 'Check',
    correct: 'Correct',
    attempts: 'Attempts',
    accuracy: 'Accuracy',
    replay: 'Replay',
    // Profile Tab
    learningStats: 'Learning Statistics',
    wordsLearned: 'Words Learned',
    lessonsCompleted: 'Lessons Completed',
    studyStreak: 'Study Streak',
    accuracyRate: 'Accuracy Rate',
    notifications: 'Notifications',
    logout: 'Logout',
    days: 'days',
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    yes: 'Yes',
    no: 'No',
    noLessons: 'No lessons available for this level yet'
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
    hskLevel: 'HSK darajasi',
    // Language Selection
    selectLanguage: "Til tanlang",
    uzbek: "O'zbek tili",
    russian: "Русский язык",
    english: "English",
    // Level Selection
    selectLevel: "HSK darajasini tanlang",
    selectLevelDesc: "Joriy darajangizga mos keladigan HSK darajasini tanlang",
    beginner: "Boshlang'ich",
    elementary: "Elementar",
    intermediate: "O'rta",
    upperIntermediate: "Yuqori o'rta",
    advanced: "Ilg'or",
    mastery: "Mahorat",
    hsk1Desc: "150 ta umumiy so'z va asosiy iboralarni bilish",
    hsk2Desc: "Tanish mavzularda oddiy muloqot",
    hsk3Desc: "Kundalik vaziyatlarda muloqot",
    hsk4Desc: "Turli mavzularda erkin muloqot",
    hsk5Desc: "Murakkab matnlarni tushunish",
    hsk6Desc: "To'liq mahorat va tushunish",
    startLearning: "O'rganishni boshlash",
    // Practice Tab
    practiceDesc: "Bilimingizni turli xil mashqlar orqali mustahkamlang",
    flashcardsDesc: "So'zlarni eslash va eslab qolish",
    quizDesc: "Bilimingizni sinab ko'ring",
    favorites: "Sevimlilari",
    favoritesDesc: "Saqlanacak so'zlar",
    // Writing Tab
    writing: "Yozish",
    strokeOrder: "Chiziq tartibi",
    yourPractice: "Sizning mashqingiz",
    guide: "Yo'riqnoma",
    undo: "Bekor qilish",
    clear: "Tozalash",
    skip: "O'tkazib yuborish",
    check: "Tekshirish",
    correct: "To'g'ri",
    attempts: "Urinishlar",
    accuracy: "Aniqlik",
    replay: "Qayta ko'rish",
    // Profile Tab
    learningStats: "O'rganish statistikasi",
    wordsLearned: "O'rganilgan so'zlar",
    lessonsCompleted: "Tugallangan darslar",
    studyStreak: "O'rganish seriyasi",
    accuracyRate: "Aniqlik darajasi",
    notifications: "Bildirishnomalar",
    logout: "Chiqish",
    days: "kun",
    // Common
    loading: "Yuklanmoqda...",
    error: "Xato",
    success: "Muvaffaqiyat",
    save: "Saqlash",
    cancel: "Bekor qilish",
    delete: "O'chirish",
    edit: "Tahrirlash",
    close: "Yopish",
    search: "Qidirish",
    filter: "Filter",
    all: "Hammasi",
    yes: "Ha",
    no: "Yo'q",
    noLessons: "Bu daraja uchun hali darslar yo'q"
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
    hskLevel: 'Уровень HSK',
    // Language Selection
    selectLanguage: "Выберите язык",
    uzbek: "O'zbek tili",
    russian: "Русский язык",
    english: "English",
    // Level Selection
    selectLevel: "Выберите уровень HSK",
    selectLevelDesc: "Выберите уровень HSK, соответствующий вашим текущим навыкам",
    beginner: "Начальный",
    elementary: "Элементарный",
    intermediate: "Средний",
    upperIntermediate: "Выше среднего",
    advanced: "Продвинутый",
    mastery: "Мастерство",
    hsk1Desc: "Знать около 150 общих слов и базовых фраз",
    hsk2Desc: "Простое общение на знакомые темы",
    hsk3Desc: "Общение в повседневных ситуациях",
    hsk4Desc: "Свободное общение на различные темы",
    hsk5Desc: "Понимание сложных текстов",
    hsk6Desc: "Полное владение и понимание",
    startLearning: "Начать обучение",
    // Practice Tab
    practiceDesc: "Закрепите свои знания с помощью различных упражнений",
    flashcardsDesc: "Запоминание и повторение слов",
    quizDesc: "Проверьте свои знания",
    favorites: "Избранное",
    favoritesDesc: "Сохраненные слова",
    // Writing Tab
    writing: "Письмо",
    strokeOrder: "Порядок черт",
    yourPractice: "Ваша практика",
    guide: "Подсказка",
    undo: "Отменить",
    clear: "Очистить",
    skip: "Пропустить",
    check: "Проверить",
    correct: "Правильно",
    attempts: "Попытки",
    accuracy: "Точность",
    replay: "Повтор",
    // Profile Tab
    learningStats: "Статистика обучения",
    wordsLearned: "Изучено слов",
    lessonsCompleted: "Завершено уроков",
    studyStreak: "Серия обучения",
    accuracyRate: "Процент правильных ответов",
    notifications: "Уведомления",
    logout: "Выйти",
    days: "дней",
    // Common
    loading: "Загрузка...",
    error: "Ошибка",
    success: "Успешно",
    save: "Сохранить",
    cancel: "Отмена",
    delete: "Удалить",
    edit: "Изменить",
    close: "Закрыть",
    search: "Поиск",
    filter: "Фильтр",
    all: "Все",
    yes: "Да",
    no: "Нет",
    noLessons: "Для этого уровня пока нет уроков"
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
