# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Running the Application
```bash
npm start              # Start bot and web server (production)
npm run dev            # Start with nodemon for auto-reload (development)
```

The bot runs on port 3000 by default (configurable via `PORT` env var).

### Environment Setup
1. Copy `.env.example` to `.env`
2. Set `TELEGRAM_BOT_TOKEN` from [@BotFather](https://t.me/botfather)
3. Set `MINI_APP_URL` (use `http://localhost:3000` for local development)

## Architecture Overview

### Application Structure
This is a **Telegram Mini App** with two main components:

1. **Backend (bot.js)**: Node.js server that:
   - Runs the Telegram bot using `node-telegram-bot-api`
   - Serves static files from `/public`
   - Provides REST API endpoints for vocabulary data and quiz generation
   - Handles bot commands (`/start`, `/help`, `/stats`)

2. **Frontend (public/)**: Single-page web app that:
   - Integrates with Telegram WebApp API (`window.Telegram.WebApp`)
   - Uses vanilla JavaScript (no framework)
   - Stores user progress in localStorage
   - Follows a multi-step user flow (see below)

### User Flow
The app follows this navigation sequence:

1. **index.html** - Router that redirects based on completion status:
   - First visit → onboarding.html
   - Onboarding completed → level-select.html
   - Setup completed → lessons.html

2. **onboarding.html** - 4-slide introduction with swipe/tap navigation
   - Saves `onboardingCompleted` flag to localStorage

3. **level-select.html** - HSK level selection (1-6)
   - Saves `hskLevel` and `setupCompleted` to localStorage

4. **lessons.html** - Main lesson browser
   - Filters lessons by HSK level
   - Shows lesson progress (not started, in progress, completed)

5. **lesson.html** - Individual lesson content
   - Dialogue with character/pinyin/translation tabs
   - Vocabulary list with audio buttons
   - Grammar explanations
   - Practice exercises
   - Flashcard integration

### API Endpoints

```
GET /api/vocabulary        # Returns all vocabulary words
GET /api/vocabulary/random # Returns a random vocabulary word
GET /api/quiz              # Generates a quiz question with 4 options
```

### Data Storage

**Backend (bot.js)**:
- `vocabulary` array: Contains Chinese words with id, chinese, pinyin, english, difficulty

**Frontend (localStorage)**:
- `onboardingCompleted`: Boolean flag
- `setupCompleted`: Boolean flag
- `hskLevel`: Selected HSK level (1-6)
- `flashcards`: Array of user-saved flashcards
- `grammar_bookmarks`: Array of bookmarked grammar points
- `lesson{N}_completed`: Boolean flags for individual lessons

### Telegram Integration

All frontend pages initialize the Telegram WebApp with:
```javascript
const tg = window.Telegram.WebApp;
tg.expand();  // Fullscreen mode
tg.ready();   // Signal ready state
```

Haptic feedback is used throughout for user interactions:
- `impactOccurred('light')` - Light taps
- `impactOccurred('medium')` - Medium interactions
- `notificationOccurred('success')` - Success actions

### Key Files

- **bot.js** - Main server, bot logic, and API endpoints
- **public/index.html** - Entry point and router
- **public/onboarding.js** - Onboarding carousel logic
- **public/level-select.js** - HSK level selection logic
- **public/lessons.js** - Lesson browser with level filtering
- **public/lesson.js** - Individual lesson interactions (tabs, audio, flashcards)

### Adding Vocabulary

To add new vocabulary, edit the `vocabulary` array in `bot.js`:

```javascript
{
  id: 9,
  chinese: '学校',
  pinyin: 'xuéxiào',
  english: 'school',
  difficulty: 'beginner'
}
```

## Deployment Notes

- Deploy the web app to any static hosting service (Vercel, Netlify, Railway)
- Update `MINI_APP_URL` in `.env` with the deployed URL
- Configure the Mini App URL in @BotFather under Bot Settings → Menu Button
