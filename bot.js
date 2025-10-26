const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./database');

const bot = new TelegramBot(config.telegramBotToken, { polling: true });
const app = express();

// Serve static files
app.use(express.static('public'));
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
    const vocabulary = await db.getVocabulary(hskLevel);
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

// Start server
app.listen(config.port, () => {
  console.log(`✅ Bot is running...`);
  console.log(`🌐 Mini app server running on port ${config.port}`);
  console.log(`📱 Mini app URL: ${config.miniAppUrl}`);
});
