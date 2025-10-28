// Internationalization (i18n) - Translation system
// Prevent re-execution if already loaded
if (window._i18nLoaded) {
  console.log('📚 [i18n.js] Already loaded, skipping...');
  // Exit early - this script has already been executed
  throw new Error('SKIP_SCRIPT_EXECUTION');
}

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
    selectLevel: 'Choose Your Level',
    selectLevelDesc: 'Select your HSK proficiency level',
    changeLater: 'You can change this later in settings',
    beginner: 'Beginner',
    elementary: 'Elementary',
    intermediate: 'Intermediate',
    upperIntermediate: 'Upper-Int.',
    advanced: 'Advanced',
    mastery: 'Master',
    hsk1Desc: '150 words · Basic phrases · Greetings & introductions',
    hsk2Desc: '300 words · Daily conversations · Basic exchanges',
    hsk3Desc: '600 words · Work & study topics · Complex sentences',
    hsk4Desc: '1200 words · Wide range of topics · Fluent communication',
    hsk5Desc: '2500 words · Academic & professional · Chinese media',
    hsk6Desc: '5000+ words · Native-like fluency · Complex literature',
    notSure: 'Not sure?',
    notSureDesc: 'Start with HSK 1. You can change your level anytime in Profile settings.',
    startLearning: 'Start Learning',
    // HSK Level Topics
    greetings: 'Greetings',
    selfIntro: 'Self-intro',
    numbers: 'Numbers',
    dailyLife: 'Daily life',
    shopping: 'Shopping',
    time: 'Time',
    work: 'Work',
    study: 'Study',
    hobbies: 'Hobbies',
    discussions: 'Discussions',
    news: 'News',
    culture: 'Culture',
    academic: 'Academic',
    media: 'Media',
    articles: 'Articles',
    literature: 'Literature',
    movies: 'Movies',
    native: 'Native',
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
    selectLevel: "Darajangizni tanlang",
    selectLevelDesc: "HSK malaka darajangizni tanlang",
    changeLater: "Buni keyinroq sozlamalarda o'zgartirishingiz mumkin",
    beginner: "Boshlang'ich",
    elementary: "Elementar",
    intermediate: "O'rta",
    upperIntermediate: "Yuqori-O'rta",
    advanced: "Ilg'or",
    mastery: "Mahir",
    hsk1Desc: "150 so'z · Asosiy iboralar · Salomlashish va tanishish",
    hsk2Desc: "300 so'z · Kundalik suhbatlar · Oddiy muloqot",
    hsk3Desc: "600 so'z · Ish va o'qish mavzulari · Murakkab gaplar",
    hsk4Desc: "1200 so'z · Keng mavzular · Ravon muloqot",
    hsk5Desc: "2500 so'z · Akademik va professional · Xitoy ommaviy axboroti",
    hsk6Desc: "5000+ so'z · Ona tilidek erkinlik · Murakkab adabiyot",
    notSure: "Ishonchingiz komilmi?",
    notSureDesc: "HSK 1 dan boshlang. Darajangizni istalgan vaqtda Profil sozlamalarida o'zgartirishingiz mumkin.",
    startLearning: "O'rganishni boshlash",
    // HSK Level Topics
    greetings: 'Salomlashish',
    selfIntro: "O'zini tanishtirish",
    numbers: 'Raqamlar',
    dailyLife: 'Kundalik hayot',
    shopping: 'Xarid qilish',
    time: 'Vaqt',
    work: 'Ish',
    study: "O'qish",
    hobbies: 'Sevimli mashg\'ulotlar',
    discussions: 'Muhokamalar',
    news: 'Yangiliklar',
    culture: 'Madaniyat',
    academic: 'Akademik',
    media: 'Ommaviy axborot',
    articles: 'Maqolalar',
    literature: 'Adabiyot',
    movies: 'Filmlar',
    native: 'Ona tili',
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
    selectLevel: "Выберите свой уровень",
    selectLevelDesc: "Выберите свой уровень владения HSK",
    changeLater: "Вы можете изменить это позже в настройках",
    beginner: "Начальный",
    elementary: "Элементарный",
    intermediate: "Средний",
    upperIntermediate: "Выше-Сред.",
    advanced: "Продвинутый",
    mastery: "Мастер",
    hsk1Desc: "150 слов · Базовые фразы · Приветствия и знакомство",
    hsk2Desc: "300 слов · Повседневные разговоры · Простой обмен",
    hsk3Desc: "600 слов · Рабочие и учебные темы · Сложные предложения",
    hsk4Desc: "1200 слов · Широкий круг тем · Свободное общение",
    hsk5Desc: "2500 слов · Академическое и профессиональное · Китайские СМИ",
    hsk6Desc: "5000+ слов · Почти родной уровень · Сложная литература",
    notSure: "Не уверены?",
    notSureDesc: "Начните с HSK 1. Вы можете изменить свой уровень в любое время в настройках профиля.",
    startLearning: "Начать обучение",
    // HSK Level Topics
    greetings: 'Приветствия',
    selfIntro: 'Самопредставление',
    numbers: 'Числа',
    dailyLife: 'Повседневная жизнь',
    shopping: 'Покупки',
    time: 'Время',
    work: 'Работа',
    study: 'Учёба',
    hobbies: 'Хобби',
    discussions: 'Дискуссии',
    news: 'Новости',
    culture: 'Культура',
    academic: 'Академическое',
    media: 'СМИ',
    articles: 'Статьи',
    literature: 'Литература',
    movies: 'Фильмы',
    native: 'Носитель',
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
  },

  // Initialize i18n and apply translations to page
  init() {
    // Load language from localStorage
    const savedLang = localStorage.getItem('appLanguage') || localStorage.getItem('selectedLanguage') || 'en';
    this.currentLanguage = savedLang;

    // Apply translations to all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        element.textContent = translation;
      }
    });
  }
};

// Export for use in HTML files
window.i18n = i18n;

// Mark as loaded to prevent re-execution
window._i18nLoaded = true;
console.log('✅ [i18n.js] Loaded and initialized');
