const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./database');

const bot = new TelegramBot(config.telegramBotToken, { 
  polling: {
    interval: 300,
    autoStart: true,
    params: {
      timeout: 10
    }
  }
});

// Handle polling errors
bot.on('polling_error', (error) => {
  console.error('Telegram polling error:', error.code, error.message);
  // Don't crash on polling errors
});
const app = express();

// CORS middleware - allow requests from Telegram Mini Apps
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-User-Id, X-Telegram-Username, X-Telegram-First-Name');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files with caching
app.use(express.static('public', {
  maxAge: '1d', // Cache static files for 1 day
  etag: true,
  lastModified: true
}));
app.use(express.json());

// Log database status
if (db.isConfigured()) {
  console.log('✅ Database connected');
} else {
  console.log('⚠️  Database not configured, using fallback data');
}

// Bot commands
bot.onText(/\/start/, async (msg) => {
  // Track user
  if (db.isConfigured()) {
    await db.getOrCreateUser(msg.from);
  }
  const chatId = msg.chat.id;
  const opts = {
    reply_markup: {
      inline_keyboard: [[
        { text: '🚀 Open Learning App', web_app: { url: process.env.MINI_APP_URL || 'http://localhost:3000' } }
      ]]
    }
  };
  
  bot.sendMessage(
    chatId,
    '欢迎! Welcome to Chinese Learning Bot!\n\nClick the button below to start learning Chinese vocabulary, practice flashcards, and test your knowledge.',
    opts
  );
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Commands:\n' +
    '/start - Open the learning app\n' +
    '/help - Show this help message\n' +
    '/stats - View your learning statistics'
  );
});

bot.onText(/\/stats/, async (msg) => {
  const chatId = msg.chat.id;
  
  if (db.isConfigured()) {
    const stats = await db.getUserStats(msg.from.id);
    bot.sendMessage(
      chatId,
      '📊 Your Statistics:\n\n' +
      `• Words learned: ${stats.wordsLearned}\n` +
      `• Study streak: ${stats.streak} days\n` +
      `• Quiz accuracy: ${stats.accuracy}%\n\n` +
      'Keep it up! 🎉'
    );
  } else {
    bot.sendMessage(
      chatId,
      '📊 Your Statistics:\n\n' +
      '• Words learned: 0\n' +
      '• Study streak: 0 days\n' +
      '• Quiz accuracy: 0%\n\n' +
      'Open the app to start learning!'
    );
  }
});

// API endpoints for the mini app
app.get('/api/vocabulary', async (req, res) => {
  try {
    const hskLevel = req.query.hsk_level ? parseInt(req.query.hsk_level) : null;
    const lessonId = req.query.lesson_id ? parseInt(req.query.lesson_id) : null;
    const vocabulary = await db.getVocabulary(hskLevel, lessonId);
    res.json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

app.get('/api/vocabulary/random', async (req, res) => {
  try {
    const vocabulary = await db.getVocabulary();
    const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    res.json(randomWord);
  } catch (error) {
    console.error('Error fetching random vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

app.get('/api/quiz', async (req, res) => {
  try {
    const vocabulary = await db.getVocabulary();
    const question = vocabulary[Math.floor(Math.random() * vocabulary.length)];
    const options = [question.english];
    
    // Add 3 random wrong answers
    while (options.length < 4) {
      const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
      if (!options.includes(randomWord.english)) {
        options.push(randomWord.english);
      }
    }
    
    // Shuffle options
    options.sort(() => Math.random() - 0.5);
    
    res.json({
      id: question.id,
      question: question.chinese,
      pinyin: question.pinyin,
      options: options,
      correctAnswer: question.english
    });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Get lessons (frontend public endpoint)
app.get('/api/lessons', async (req, res) => {
  try {
    const hskLevel = req.query.hsk_level ? parseInt(req.query.hsk_level) : null;
    console.log(`[API] Fetching lessons for HSK level: ${hskLevel}`);
    const lessons = await db.getLessons(hskLevel);
    console.log(`[API] Found ${lessons ? lessons.length : 0} lessons`);
    res.json(lessons || []);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.json([]);
  }
});

// Get single lesson (frontend public endpoint)
app.get('/api/lessons/:id', async (req, res) => {
  try {
    const lesson = await db.getLesson(req.params.id);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    res.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    res.status(500).json({ error: 'Failed to fetch lesson' });
  }
});

// Get dialogues for a lesson (frontend public endpoint)
app.get('/api/lessons/:lessonId/dialogues', async (req, res) => {
  try {
    const dialogues = await db.getDialoguesByLesson(req.params.lessonId);
    res.json(dialogues || []);
  } catch (error) {
    console.error('Error fetching dialogues:', error);
    res.json([]);
  }
});

// Middleware to extract Telegram user from headers
app.use((req, res, next) => {
  const userId = req.headers['x-telegram-user-id'];
  const username = req.headers['x-telegram-username'];
  const firstName = req.headers['x-telegram-first-name'];
  
  if (userId) {
    req.telegramUser = {
      id: parseInt(userId),
      username,
      first_name: firstName
    };
  }
  next();
});

// Get user stats
app.get('/api/user/stats', async (req, res) => {
  try {
    if (!req.telegramUser) {
      return res.json({ wordsLearned: 0, streak: 0, accuracy: 0 });
    }
    
    const stats = await db.getUserStats(req.telegramUser.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Save quiz result
app.post('/api/progress/quiz', async (req, res) => {
  try {
    if (!req.telegramUser) {
      return res.json({ success: false, message: 'User not authenticated' });
    }
    
    const { vocabularyId, correct } = req.body;
    
    if (db.isConfigured()) {
      await db.getOrCreateUser(req.telegramUser);
      await db.updateProgress(req.telegramUser.id, vocabularyId, correct);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving progress:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Get user progress
app.get('/api/user/progress', async (req, res) => {
  try {
    if (!req.telegramUser) {
      return res.json([]);
    }

    const progress = await db.getUserProgress(req.telegramUser.id);
    res.json(progress || []);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// ========== ADMIN API ENDPOINTS ==========

// Simple admin authentication middleware
const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  if (adminPassword === 'admin123') { // Match the password in admin.js
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get all vocabulary (admin)
app.get('/api/admin/vocabulary', adminAuth, async (req, res) => {
  try {
    const vocabulary = await db.getVocabulary();
    res.json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ error: 'Failed to fetch vocabulary' });
  }
});

// Add new vocabulary (admin)
app.post('/api/admin/vocabulary', adminAuth, async (req, res) => {
  try {
    const { chinese, pinyin, english, hsk_level, difficulty } = req.body;

    if (!chinese || !pinyin || !english) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newWord = await db.addVocabulary({ chinese, pinyin, english, hsk_level, difficulty });
    res.json(newWord);
  } catch (error) {
    console.error('Error adding vocabulary:', error);
    res.status(500).json({ error: 'Failed to add vocabulary' });
  }
});

// Update vocabulary (admin)
app.put('/api/admin/vocabulary/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { chinese, pinyin, english, hsk_level, difficulty } = req.body;

    const updated = await db.updateVocabulary(id, { chinese, pinyin, english, hsk_level, difficulty });
    res.json(updated);
  } catch (error) {
    console.error('Error updating vocabulary:', error);
    res.status(500).json({ error: 'Failed to update vocabulary' });
  }
});

// Delete vocabulary (admin)
app.delete('/api/admin/vocabulary/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.deleteVocabulary(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting vocabulary:', error);
    res.status(500).json({ error: 'Failed to delete vocabulary' });
  }
});

// Get all users (admin)
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get admin statistics (admin)
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await db.getAdminStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ========== LESSONS API ==========
app.get('/api/admin/lessons', adminAuth, async (req, res) => {
  try {
    const lessons = await db.getLessons();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

app.post('/api/admin/lessons', adminAuth, async (req, res) => {
  try {
    const lesson = await db.addLesson(req.body);
    res.json(lesson);
  } catch (error) {
    console.error('Error adding lesson:', error);
    res.status(500).json({ error: 'Failed to add lesson' });
  }
});

app.put('/api/admin/lessons/:id', adminAuth, async (req, res) => {
  try {
    const lesson = await db.updateLesson(req.params.id, req.body);
    res.json(lesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

app.delete('/api/admin/lessons/:id', adminAuth, async (req, res) => {
  try {
    await db.deleteLesson(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// ========== DIALOGUES API ==========
app.get('/api/admin/dialogues', adminAuth, async (req, res) => {
  try {
    const dialogues = await db.getDialogues();
    res.json(dialogues);
  } catch (error) {
    console.error('Error fetching dialogues:', error);
    res.status(500).json({ error: 'Failed to fetch dialogues' });
  }
});

app.post('/api/admin/dialogues', adminAuth, async (req, res) => {
  try {
    const dialogue = await db.addDialogue(req.body);
    res.json(dialogue);
  } catch (error) {
    console.error('Error adding dialogue:', error);
    res.status(500).json({ error: 'Failed to add dialogue' });
  }
});

app.put('/api/admin/dialogues/:id', adminAuth, async (req, res) => {
  try {
    const dialogue = await db.updateDialogue(req.params.id, req.body);
    res.json(dialogue);
  } catch (error) {
    console.error('Error updating dialogue:', error);
    res.status(500).json({ error: 'Failed to update dialogue' });
  }
});

app.delete('/api/admin/dialogues/:id', adminAuth, async (req, res) => {
  try {
    await db.deleteDialogue(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dialogue:', error);
    res.status(500).json({ error: 'Failed to delete dialogue' });
  }
});

// ========== GRAMMAR API ==========
app.get('/api/admin/grammar', adminAuth, async (req, res) => {
  try {
    const grammar = await db.getGrammar();
    res.json(grammar);
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({ error: 'Failed to fetch grammar' });
  }
});

app.post('/api/admin/grammar', adminAuth, async (req, res) => {
  try {
    const grammar = await db.addGrammar(req.body);
    res.json(grammar);
  } catch (error) {
    console.error('Error adding grammar:', error);
    res.status(500).json({ error: 'Failed to add grammar' });
  }
});

app.put('/api/admin/grammar/:id', adminAuth, async (req, res) => {
  try {
    const grammar = await db.updateGrammar(req.params.id, req.body);
    res.json(grammar);
  } catch (error) {
    console.error('Error updating grammar:', error);
    res.status(500).json({ error: 'Failed to update grammar' });
  }
});

app.delete('/api/admin/grammar/:id', adminAuth, async (req, res) => {
  try {
    await db.deleteGrammar(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting grammar:', error);
    res.status(500).json({ error: 'Failed to delete grammar' });
  }
});

// ========== QUIZZES API ==========
app.get('/api/admin/quizzes', adminAuth, async (req, res) => {
  try {
    const quizzes = await db.getQuizzes();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

app.post('/api/admin/quizzes', adminAuth, async (req, res) => {
  try {
    const quiz = await db.addQuiz(req.body);
    res.json(quiz);
  } catch (error) {
    console.error('Error adding quiz:', error);
    res.status(500).json({ error: 'Failed to add quiz' });
  }
});

app.put('/api/admin/quizzes/:id', adminAuth, async (req, res) => {
  try {
    const quiz = await db.updateQuiz(req.params.id, req.body);
    res.json(quiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Failed to update quiz' });
  }
});

app.delete('/api/admin/quizzes/:id', adminAuth, async (req, res) => {
  try {
    await db.deleteQuiz(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Start server
app.listen(config.port, () => {
  console.log(`✅ Bot is running...`);
  console.log(`🌐 Mini app server running on port ${config.port}`);
  console.log(`📱 Mini app URL: ${config.miniAppUrl}`);
});
