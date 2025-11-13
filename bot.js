const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const db = require('./database');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Telegram-User-Id, X-Telegram-Username, X-Telegram-First-Name, X-Admin-Password');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files with no caching for HTML and JS
app.use(express.static('public', {
  maxAge: 0, // No caching
  etag: false,
  lastModified: true,
  setHeaders: (res, path) => {
    // Prevent aggressive caching for HTML and JavaScript files
    if (path.endsWith('.html') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Allow short caching for assets (CSS, images, etc.)
    else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
  }
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
    console.log('[API] Quiz request received');

    // Get HSK level from query parameter
    const hskLevel = req.query.level ? parseInt(req.query.level) : null;
    console.log(`[API] Requested HSK level: ${hskLevel || 'all levels'}`);

    // Get excluded question IDs from query parameter
    const excludeIds = req.query.exclude ? req.query.exclude.split(',').map(id => parseInt(id)) : [];
    console.log(`[API] Excluding question IDs: ${excludeIds.length > 0 ? excludeIds.join(', ') : 'none'}`);

    // Get quiz questions from the quizzes table
    let allQuizQuestions = await Promise.race([
      db.getQuizzes(hskLevel),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 5000))
    ]);

    // Store total count before filtering
    const totalAvailable = allQuizQuestions ? allQuizQuestions.length : 0;

    // Filter out already used questions
    let quizQuestions = allQuizQuestions;
    if (excludeIds.length > 0) {
      quizQuestions = quizQuestions.filter(q => !excludeIds.includes(q.id));
    }

    console.log(`[API] Quiz questions loaded: ${quizQuestions ? quizQuestions.length : 0} questions (${totalAvailable} total available)`);

    if (!quizQuestions || quizQuestions.length === 0) {
      const levelMsg = hskLevel ? ` for HSK level ${hskLevel}` : '';
      return res.status(500).json({ error: `No quiz questions available${levelMsg}. Please create questions in the admin panel.` });
    }

    // Get a random question
    const question = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];

    // Parse options from JSONB if it's a string
    let options = question.options;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        console.error('Failed to parse options:', e);
        return res.status(500).json({ error: 'Invalid question format' });
      }
    }

    // Handle different question formats
    let optionsArray = [];

    // For matching, cloze_test, and error_correction questions, preserve the structure
    if (question.question_type === 'matching' || question.question_type === 'cloze_test' || question.question_type === 'error_correction') {
      optionsArray = options; // Keep structure as-is (don't shuffle)
    } else {
      // For other question types, extract text values
      if (Array.isArray(options)) {
        // If options is already an array of strings or objects
        optionsArray = options.map(opt => typeof opt === 'string' ? opt : opt.text);
      } else if (options && typeof options === 'object') {
        // If options is an object with a, b, c, d keys
        optionsArray = Object.values(options).filter(Boolean);
      }
      // Shuffle options for multiple choice questions
      optionsArray.sort(() => Math.random() - 0.5);
    }

    res.json({
      id: question.id,
      question: question.question || question.chinese_text,
      pinyin: question.pinyin || '',
      options: optionsArray,
      correctAnswer: question.correct_answer,
      questionType: question.question_type,
      audioUrl: question.audio_url,
      imageUrl: question.image_url,
      acceptable_answers: question.acceptable_answers,
      totalQuestions: totalAvailable
    });
  } catch (error) {
    console.error('[API] Error generating quiz:', error.message);
    res.status(500).json({ error: 'Failed to generate quiz', details: error.message });
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

// Get grammar for a lesson (frontend public endpoint)
app.get('/api/lessons/:lessonId/grammar', async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const grammar = await db.getGrammarByLesson(lessonId);
    res.json(grammar || []);
  } catch (error) {
    console.error('Error fetching grammar for lesson:', error);
    res.json([]);
  }
});

// Get practice exercises for a lesson (frontend public endpoint)
app.get('/api/lessons/:lessonId/quizzes', async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const quizzes = await db.getQuizzesByLesson(lessonId);
    res.json(quizzes || []);
  } catch (error) {
    console.error('Error fetching quizzes for lesson:', error);
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

// Complete lesson
app.post('/api/user-progress/complete-lesson', async (req, res) => {
  try {
    if (!req.telegramUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { lesson_id } = req.body;

    if (!lesson_id) {
      return res.status(400).json({ error: 'lesson_id is required' });
    }

    if (db.isConfigured()) {
      await db.getOrCreateUser(req.telegramUser);
      const result = await db.markLessonComplete(req.telegramUser.id, lesson_id);
      res.json({ success: true, data: result });
    } else {
      res.json({ success: false, message: 'Database not configured' });
    }
  } catch (error) {
    console.error('Error completing lesson:', error);
    res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// Get lesson progress
app.get('/api/user-progress/lessons/:lessonId?', async (req, res) => {
  try {
    if (!req.telegramUser) {
      return res.json(null);
    }

    const lessonId = req.params.lessonId ? parseInt(req.params.lessonId) : null;
    const progress = await db.getLessonProgress(req.telegramUser.id, lessonId);
    res.json(progress || null);
  } catch (error) {
    console.error('Error fetching lesson progress:', error);
    res.status(500).json({ error: 'Failed to fetch lesson progress' });
  }
});

// Update section progress
app.post('/api/user-progress/update-section', async (req, res) => {
  try {
    if (!req.telegramUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { lesson_id, section } = req.body;

    if (!lesson_id || !section) {
      return res.status(400).json({ error: 'lesson_id and section are required' });
    }

    // Validate section name
    const validSections = ['audio', 'dialogue', 'vocab', 'grammar', 'practice'];
    if (!validSections.includes(section)) {
      return res.status(400).json({ error: 'Invalid section name' });
    }

    if (db.isConfigured()) {
      await db.getOrCreateUser(req.telegramUser);
      const result = await db.updateSectionProgress(req.telegramUser.id, lesson_id, section);
      res.json({ success: true, data: result });
    } else {
      res.json({ success: false, message: 'Database not configured' });
    }
  } catch (error) {
    console.error('Error updating section progress:', error);
    res.status(500).json({ error: 'Failed to update section progress' });
  }
});

// ========== ADMIN API ENDPOINTS ==========

// ========== FAVORITES & REVIEW QUEUE API ==========
// Get user favorites
app.get('/api/favorites', async (req, res) => {
  try {
    if (!db.supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    const { user_id, vocabulary_id } = req.query;
    const { data, error } = await db.supabase
      .from('user_favorites')
      .select('*')
      .eq('user_id', user_id)
      .eq('vocabulary_id', vocabulary_id);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Get all user favorites with vocabulary details
app.get('/api/favorites/list', async (req, res) => {
  try {
    if (!db.supabase) {
      return res.json([]);
    }
    const { user_id } = req.query;
    const { data, error } = await db.supabase
      .from('user_favorites')
      .select(`
        id,
        created_at,
        vocabulary:vocabulary_id (
          id,
          chinese,
          pinyin,
          english,
          uzbek,
          russian,
          difficulty,
          audio_url
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(item => ({ ...item.vocabulary, favorite_id: item.id })));
  } catch (error) {
    console.error('Error fetching favorites list:', error);
    res.status(500).json({ error: 'Failed to fetch favorites list' });
  }
});

// Add to favorites
app.post('/api/favorites', async (req, res) => {
  try {
    if (!db.supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    const { user_id, vocabulary_id } = req.body;
    const { data, error } = await db.supabase
      .from('user_favorites')
      .insert([{ user_id, vocabulary_id }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    res.status(500).json({ error: 'Failed to add to favorites', message: error.message });
  }
});

// Remove from favorites
app.delete('/api/favorites/:id', async (req, res) => {
  try {
    if (!db.supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    const { id } = req.params;
    const { error } = await db.supabase
      .from('user_favorites')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({ error: 'Failed to remove from favorites' });
  }
});

// Add to review queue
app.post('/api/review-queue', async (req, res) => {
  try {
    if (!db.supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    const { user_id, vocabulary_id } = req.body;
    const { data, error } = await db.supabase
      .from('user_review_queue')
      .insert([{ user_id, vocabulary_id }])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error('Error adding to review queue:', error);
    res.status(500).json({ error: 'Failed to add to review queue', message: error.message });
  }
});

// Get review queue
app.get('/api/review-queue', async (req, res) => {
  try {
    if (!db.supabase) {
      return res.json([]);
    }
    const { user_id } = req.query;
    const { data, error } = await db.supabase
      .from('user_review_queue')
      .select(`
        id,
        created_at,
        vocabulary:vocabulary_id (
          id,
          chinese,
          pinyin,
          english,
          uzbek,
          russian,
          difficulty,
          audio_url
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(item => ({ ...item.vocabulary, queue_id: item.id })));
  } catch (error) {
    console.error('Error fetching review queue:', error);
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// Remove from review queue
app.delete('/api/review-queue/:id', async (req, res) => {
  try {
    if (!db.supabase) {
      return res.status(503).json({ error: 'Database not configured' });
    }
    const { id } = req.params;
    const { error } = await db.supabase
      .from('user_review_queue')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from review queue:', error);
    res.status(500).json({ error: 'Failed to remove from review queue' });
  }
});

// Study Time Tracking Endpoints
// Save study session
app.post('/api/study-time', async (req, res) => {
  try {
    const { telegram_user_id, activity, duration_minutes, session_date } = req.body;

    if (!telegram_user_id || !duration_minutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!db.isConfigured()) {
      // If database not configured, just return success (client will use localStorage)
      return res.json({ success: true, message: 'Saved locally (database not configured)' });
    }

    const { data, error } = await db.supabase
      .from('study_sessions')
      .insert([{
        telegram_user_id: telegram_user_id,
        activity: activity || 'study',
        duration_minutes: duration_minutes,
        session_date: session_date || new Date().toISOString().split('T')[0]
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error saving study session:', error);
    res.status(500).json({ error: 'Failed to save study session' });
  }
});

// Get study time for a user
app.get('/api/study-time/:telegram_user_id', async (req, res) => {
  try {
    const { telegram_user_id } = req.params;
    const { start_date, end_date } = req.query;

    if (!db.isConfigured()) {
      // If database not configured, return empty data (client will use localStorage)
      return res.json({ sessions: [], totalMinutes: 0 });
    }

    let query = db.supabase
      .from('study_sessions')
      .select('*')
      .eq('telegram_user_id', telegram_user_id)
      .order('session_date', { ascending: false });

    if (start_date) {
      query = query.gte('session_date', start_date);
    }
    if (end_date) {
      query = query.lte('session_date', end_date);
    }

    const { data: sessions, error } = await query;

    if (error) throw error;

    const totalMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

    res.json({ sessions, totalMinutes });
  } catch (error) {
    console.error('Error fetching study time:', error);
    res.status(500).json({ error: 'Failed to fetch study time' });
  }
});

// Get study stats summary for a user
app.get('/api/study-time/:telegram_user_id/summary', async (req, res) => {
  try {
    const { telegram_user_id } = req.params;

    if (!db.isConfigured()) {
      return res.json({
        totalMinutes: 0,
        weekMinutes: 0,
        todayMinutes: 0,
        streak: 0
      });
    }

    // Get all sessions for the user
    const { data: allSessions, error: allError } = await db.supabase
      .from('study_sessions')
      .select('*')
      .eq('telegram_user_id', telegram_user_id)
      .order('session_date', { ascending: false });

    if (allError) throw allError;

    // Calculate today
    const today = new Date().toISOString().split('T')[0];
    const todayMinutes = allSessions
      .filter(s => s.session_date === today)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Calculate this week (Monday - Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(now.getDate() + diff);
    const mondayStr = monday.toISOString().split('T')[0];

    const weekMinutes = allSessions
      .filter(s => s.session_date >= mondayStr)
      .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Calculate total
    const totalMinutes = allSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

    // Calculate streak
    const uniqueDates = [...new Set(allSessions.map(s => s.session_date))].sort().reverse();
    let streak = 0;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(todayDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (uniqueDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    res.json({ totalMinutes, weekMinutes, todayMinutes, streak });
  } catch (error) {
    console.error('Error fetching study summary:', error);
    res.status(500).json({ error: 'Failed to fetch study summary' });
  }
});

// Simple admin authentication middleware
const adminAuth = (req, res, next) => {
  const adminPassword = req.headers['x-admin-password'];
  const expectedPassword = 'admin123';

  console.log('[AUTH] Admin auth attempt:', {
    received: adminPassword ? `${adminPassword.substring(0, 3)}...` : 'none',
    expected: `${expectedPassword.substring(0, 3)}...`,
    match: adminPassword === expectedPassword
  });

  if (adminPassword === expectedPassword) {
    next();
  } else {
    console.log('[AUTH] Authentication failed');
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing admin password'
    });
  }
};

// Initialize Supabase client for file uploads (with service key)
const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Audio upload endpoint
app.post('/api/admin/upload-audio', adminAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase storage (quiz-audio bucket)
    const { data, error } = await supabase.storage
      .from('quiz-audio')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('quiz-audio')
      .getPublicUrl(fileName);

    res.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image upload endpoint
app.post('/api/admin/upload-image', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `image_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase storage (quiz-images bucket)
    const { data, error } = await supabase.storage
      .from('quiz-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('quiz-images')
      .getPublicUrl(fileName);

    res.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

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
// Get all dialogues with optional filters (Admin)
app.get('/api/admin/dialogues', adminAuth, async (req, res) => {
  try {
    const options = {
      search: req.query.search,
      lessonId: req.query.lesson_id,
      visible: req.query.visible === 'true' ? true : req.query.visible === 'false' ? false : undefined
    };
    const dialogues = await db.getDialogues(options);
    res.json(dialogues);
  } catch (error) {
    console.error('Error fetching dialogues:', error);
    res.status(500).json({ error: 'Failed to fetch dialogues' });
  }
});

// Get single dialogue (Admin)
app.get('/api/admin/dialogues/:id', adminAuth, async (req, res) => {
  try {
    const dialogue = await db.getDialogue(req.params.id);
    if (!dialogue) {
      return res.status(404).json({ error: 'Dialogue not found' });
    }
    res.json(dialogue);
  } catch (error) {
    console.error('Error fetching dialogue:', error);
    res.status(500).json({ error: 'Failed to fetch dialogue' });
  }
});

app.post('/api/admin/dialogues', adminAuth, async (req, res) => {
  try {
    // Validation
    const { title, chinese, pinyin, english, lesson_id } = req.body;
    if (!title || !chinese || !pinyin || !english) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: 'Title, Chinese, Pinyin, and English are required' 
      });
    }
    
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

// Bulk update dialogues (Admin)
app.patch('/api/admin/dialogues/bulk', adminAuth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'updates object is required' });
    }
    
    const result = await db.bulkUpdateDialogues(ids, updates);
    res.json({ success: true, updated: result.length });
  } catch (error) {
    console.error('Error bulk updating dialogues:', error);
    res.status(500).json({ error: 'Failed to bulk update dialogues' });
  }
});

// ========== GRAMMAR API ==========
app.get('/api/admin/grammar', adminAuth, async (req, res) => {
  try {
    const { hsk_level, lesson_id, search } = req.query;
    let grammar = await db.getGrammar();

    // Apply filters
    if (hsk_level) {
      grammar = grammar.filter(g => g.hsk_level === hsk_level);
    }
    if (lesson_id) {
      grammar = grammar.filter(g => g.lesson_id == lesson_id);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      grammar = grammar.filter(g =>
        g.title?.toLowerCase().includes(searchLower) ||
        g.subtitle?.toLowerCase().includes(searchLower) ||
        g.explanation?.toLowerCase().includes(searchLower)
      );
    }

    res.json(grammar);
  } catch (error) {
    console.error('Error fetching grammar:', error);
    res.status(500).json({ error: 'Failed to fetch grammar' });
  }
});

app.get('/api/admin/grammar/:id', adminAuth, async (req, res) => {
  try {
    const grammar = await db.getGrammarById(req.params.id);
    if (!grammar) {
      return res.status(404).json({ error: 'Grammar point not found' });
    }
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

// ========== PRACTICE EXERCISES API ==========
app.get('/api/admin/practice-exercises', adminAuth, async (req, res) => {
  try {
    const { hsk_level, lesson_id, search } = req.query;
    let exercises = await db.getPracticeExercises();

    // Apply filters
    if (hsk_level) {
      exercises = exercises.filter(e => e.hsk_level === hsk_level);
    }
    if (lesson_id) {
      exercises = exercises.filter(e => e.lesson_id == lesson_id);
    }
    if (search) {
      const searchLower = search.toLowerCase();
      exercises = exercises.filter(e =>
        e.question?.toLowerCase().includes(searchLower)
      );
    }

    res.json(exercises);
  } catch (error) {
    console.error('Error fetching practice exercises:', error);
    res.status(500).json({ error: 'Failed to fetch practice exercises' });
  }
});

app.get('/api/admin/practice-exercises/:id', adminAuth, async (req, res) => {
  try {
    const exercise = await db.getPracticeExerciseById(req.params.id);
    if (!exercise) {
      return res.status(404).json({ error: 'Practice exercise not found' });
    }
    res.json(exercise);
  } catch (error) {
    console.error('Error fetching practice exercise:', error);
    res.status(500).json({ error: 'Failed to fetch practice exercise' });
  }
});

app.post('/api/admin/practice-exercises', adminAuth, async (req, res) => {
  try {
    const exercise = await db.addPracticeExercise(req.body);
    res.json(exercise);
  } catch (error) {
    console.error('Error adding practice exercise:', error);
    res.status(500).json({ error: 'Failed to add practice exercise' });
  }
});

app.put('/api/admin/practice-exercises/:id', adminAuth, async (req, res) => {
  try {
    const exercise = await db.updatePracticeExercise(req.params.id, req.body);
    res.json(exercise);
  } catch (error) {
    console.error('Error updating practice exercise:', error);
    res.status(500).json({ error: 'Failed to update practice exercise' });
  }
});

app.delete('/api/admin/practice-exercises/:id', adminAuth, async (req, res) => {
  try {
    await db.deletePracticeExercise(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting practice exercise:', error);
    res.status(500).json({ error: 'Failed to delete practice exercise' });
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
    // First, get the quiz data to extract file URLs
    const quizzes = await db.getQuizzes();
    const quiz = quizzes.find(q => q.id == req.params.id);

    if (quiz) {
      const filesToDelete = [];

      // Extract audio URL from question text [audio: url] format
      if (quiz.question) {
        const audioMatch = quiz.question.match(/\[audio:\s*(.+?)\]/);
        if (audioMatch) {
          const audioUrl = audioMatch[1];
          // Extract filename from full URL (e.g., https://...supabase.co/storage/v1/object/public/quiz-audio/file.mp3)
          const audioPathMatch = audioUrl.match(/\/quiz-audio\/(.+)$/);
          if (audioPathMatch) {
            filesToDelete.push({ bucket: 'quiz-audio', path: audioPathMatch[1] });
          }
        }
      }

      // Extract image URL from options (for image_association questions)
      if (quiz.options) {
        let options = quiz.options;
        if (typeof options === 'string') {
          try {
            options = JSON.parse(options);
          } catch (e) {
            // ignore parse error
          }
        }

        // Check if there's an imageUrl field (might be stored differently)
        const questionData = quiz.question || '';
        const imageUrlMatch = questionData.match(/\/quiz-images\/(.+?)[\s\]"']|$/);
        if (imageUrlMatch && imageUrlMatch[1]) {
          filesToDelete.push({ bucket: 'quiz-images', path: imageUrlMatch[1] });
        }
      }

      // Delete files from Supabase storage
      for (const file of filesToDelete) {
        try {
          const { error } = await supabase.storage
            .from(file.bucket)
            .remove([file.path]);

          if (error) {
            console.error(`Failed to delete file ${file.path} from ${file.bucket}:`, error);
          } else {
            console.log(`Successfully deleted file ${file.path} from ${file.bucket}`);
          }
        } catch (err) {
          console.error(`Error deleting file ${file.path}:`, err);
          // Continue even if file deletion fails
        }
      }
    }

    // Delete the quiz record from database
    await db.deleteQuiz(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Failed to delete quiz' });
  }
});

// Start server with error handling
const server = app.listen(config.port, () => {
  console.log(`✅ Bot is running...`);
  console.log(`🌐 Mini app server running on port ${config.port}`);
  console.log(`📱 Mini app URL: ${config.miniAppUrl}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${config.port} is already in use. Waiting before retry...`);
    // Wait 5 seconds before exiting to allow PM2 restart delay to kick in
    setTimeout(() => {
      process.exit(1);
    }, 5000);
  } else {
    console.error('Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('🛑 Shutting down gracefully...');

  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed');

    // Stop Telegram bot polling
    try {
      await bot.stopPolling();
      console.log('✅ Bot polling stopped');
    } catch (error) {
      console.error('Error stopping bot polling:', error);
    }

    console.log('✅ Shutdown complete');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});
