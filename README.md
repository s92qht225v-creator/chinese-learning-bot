# Chinese Learning Telegram Mini App

A Telegram Mini App for learning Chinese vocabulary with flashcards, quizzes, and vocabulary lists.

## Features

- 📚 **Flashcards**: Learn Chinese characters with pinyin and English translations
- 🎯 **Quiz Mode**: Test your knowledge with multiple-choice questions
- 📖 **Vocabulary List**: Browse all available words
- 📊 **Score Tracking**: Keep track of your progress

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Bot with BotFather

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy your bot token

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your bot token:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
MINI_APP_URL=http://localhost:3000
PORT=3000
```

### 4. Run the Bot

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Deployment

For production, you'll need to:

1. **Deploy the web app** to a hosting service (Vercel, Netlify, Railway, etc.)
2. **Update MINI_APP_URL** in `.env` with your deployed URL
3. **Configure the Mini App** in BotFather:
   - Send `/mybots` to @BotFather
   - Select your bot
   - Go to "Bot Settings" → "Menu Button"
   - Set the URL to your deployed app

## Adding More Vocabulary

Edit the `vocabulary` array in `bot.js` to add more Chinese words:

```javascript
{
  id: 9,
  chinese: '学校',
  pinyin: 'xuéxiào',
  english: 'school',
  difficulty: 'beginner'
}
```

## Usage

1. Start a chat with your bot on Telegram
2. Send `/start` to open the mini app
3. Choose between Flashcards, Quiz, or Vocabulary tabs
4. Start learning!

## Technologies

- Node.js
- node-telegram-bot-api
- Express.js
- Telegram Mini Apps
- Vanilla JavaScript
