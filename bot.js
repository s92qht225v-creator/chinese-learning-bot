require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const app = express();

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// Chinese vocabulary data
const vocabulary = [
  { id: 1, chinese: '你好', pinyin: 'nǐ hǎo', english: 'hello', difficulty: 'beginner' },
  { id: 2, chinese: '谢谢', pinyin: 'xièxie', english: 'thank you', difficulty: 'beginner' },
  { id: 3, chinese: '再见', pinyin: 'zàijiàn', english: 'goodbye', difficulty: 'beginner' },
  { id: 4, chinese: '学习', pinyin: 'xuéxí', english: 'to study', difficulty: 'beginner' },
  { id: 5, chinese: '中文', pinyin: 'zhōngwén', english: 'Chinese language', difficulty: 'beginner' },
  { id: 6, chinese: '朋友', pinyin: 'péngyou', english: 'friend', difficulty: 'beginner' },
  { id: 7, chinese: '吃饭', pinyin: 'chīfàn', english: 'to eat', difficulty: 'beginner' },
  { id: 8, chinese: '喝水', pinyin: 'hēshuǐ', english: 'to drink water', difficulty: 'beginner' },
];

// Bot commands
bot.onText(/\/start/, (msg) => {
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

bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '📊 Your Statistics:\n\n' +
    '• Words learned: 0\n' +
    '• Study streak: 0 days\n' +
    '• Quiz accuracy: 0%\n\n' +
    'Open the app to start learning!'
  );
});

// API endpoints for the mini app
app.get('/api/vocabulary', (req, res) => {
  res.json(vocabulary);
});

app.get('/api/vocabulary/random', (req, res) => {
  const randomWord = vocabulary[Math.floor(Math.random() * vocabulary.length)];
  res.json(randomWord);
});

app.get('/api/quiz', (req, res) => {
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
    question: question.chinese,
    pinyin: question.pinyin,
    options: options,
    correctAnswer: question.english
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Bot is running...`);
  console.log(`🌐 Mini app server running on port ${PORT}`);
});
