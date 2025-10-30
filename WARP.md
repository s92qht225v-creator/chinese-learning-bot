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
2. Required environment variables:
   ```
   TELEGRAM_BOT_TOKEN=<from @BotFather>
   MINI_APP_URL=http://localhost:3000
   PORT=3000
   
   # Optional - Database (Supabase)
   SUPABASE_URL=<your-project-url>
   SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_KEY=<service-key>
   
   # Optional - Audio Storage (Cloudflare R2)
   R2_ACCOUNT_ID=<account-id>
   R2_ACCESS_KEY_ID=<access-key>
   R2_SECRET_ACCESS_KEY=<secret-key>
   R2_BUCKET_NAME=chinese-learning-media
   R2_PUBLIC_URL=<public-url>
   ```

3. The app works in two modes:
   - **With database**: Full functionality using Supabase for lessons, dialogues, quizzes
   - **Fallback mode**: Basic vocabulary from `vocabulary-data.js` if database not configured

### Database Management

```bash
# Initial schema setup - run schema.sql in Supabase SQL Editor
# See DATABASE-SETUP.md for detailed instructions

# Apply migrations programmatically
node apply-migration.js
node run-dialogue-migration.js
node update-quiz-functions.js

# Or run migration files manually in Supabase SQL Editor:
# - migrations/update-dialogues-schema.sql
# - migrations/update-dialogues-multilang.sql
```

### Production Deployment

```bash
# Start with PM2 process manager
pm2 start ecosystem.config.js

# Monitor logs
pm2 logs chinese-learning-bot

# Restart after updates
pm2 restart chinese-learning-bot

# View status
pm2 status
```

## Architecture Overview

### Application Structure

This is a **Telegram Mini App** with three main components:

1. **Backend (bot.js)**: Express server that:
   - Runs Telegram bot with `node-telegram-bot-api` (polling mode)
   - Serves static files from `/public` directory
   - Provides REST API endpoints (public + admin)
   - Manages database operations through `database.js`
   - Handles bot commands (`/start`, `/help`, `/stats`)
   - CORS configured for Telegram Mini App origin

2. **Frontend (public/)**: Multi-page web app with:
   - Telegram WebApp API integration (`window.Telegram.WebApp`)
   - Vanilla JavaScript (no framework)
   - localStorage for user progress and preferences
   - Multi-language support (English, Russian, Uzbek) via `i18n.js`
   - Multiple learning modes (lessons, flashcards, quizzes, character writing)

3. **Admin Panel (public/admin/)**: Content management interface
   - Password-protected (default: admin123 - change in `bot.js` line ~274 and `admin/index.html`)
   - Manage lessons, dialogues, grammar points, quizzes, and vocabulary
   - Direct database integration via admin API endpoints requiring `X-Admin-Password` header

### Database Layer

**Key modules:**
- `config.js` - Centralized configuration from environment variables
- `database.js` - All Supabase operations with fallback mode
- `schema.sql` - Complete database schema

**Main tables:**
- `users` - Telegram user data
- `vocabulary` - Chinese words with HSK level, audio URLs
- `lessons` - Lesson metadata (title, HSK level, objectives, status)
- `dialogues` - Conversation scenarios linked to lessons
- `dialogue_lines` - Individual dialogue sentences with multi-language translations
- `grammar_points` - Grammar explanations with examples (stored as JSONB)
- `quizzes` - Practice questions (multiple choice, fill-blank, matching)
- `user_progress` - Tracks user learning progress and mastery levels
- `audio_files` - Audio metadata and URLs

**Database operations pattern:**
```javascript
if (!supabase) {
  // Fallback mode - return hardcoded data or empty array
  return require('./vocabulary-data');
}
// Normal operation with Supabase
```

### User Flow

The app follows a progressive navigation sequence:

1. **index.html** - Router that redirects based on localStorage state:
   - First visit → language-selection.html
   - Language selected → level-select.html
   - Setup completed → main-app.html

2. **language-selection.html** - Interface language selection (English/Uzbek/Russian)
   - Saves `selectedLanguage` flag

3. **level-select.html** - HSK level selection (1-6)
   - Saves `hskLevel` and `setupCompleted`

4. **home.html** - Main dashboard with navigation to different learning modes

5. **lessons.html** - Lesson browser filtered by HSK level
   - Shows lesson progress (not started, in progress, completed)

6. **lesson.html** - Individual lesson view with:
   - Dialogue tabs (character/pinyin/translation)
   - Vocabulary list with audio playback
   - Grammar explanations
   - Practice exercises
   - Flashcard integration

7. **Other learning modes:**
   - flashcards.html
   - quiz.html
   - character-writing.html
   - practice.html

### API Endpoints

**Public Endpoints:**
```
GET  /api/vocabulary              # Get all vocabulary (filterable by HSK level, lesson)
GET  /api/vocabulary/random       # Random vocabulary word
GET  /api/quiz                    # Generate quiz with 4 options
GET  /api/lessons                 # Get lessons (filterable by HSK level)
GET  /api/lessons/:id             # Get single lesson
GET  /api/lessons/:id/dialogues   # Get dialogues for lesson
GET  /api/user/stats              # Get user statistics (requires Telegram headers)
GET  /api/user/progress           # Get user progress
POST /api/progress/quiz           # Save quiz result
```

**Admin Endpoints (require `X-Admin-Password: admin123` header):**
```
GET    /api/admin/vocabulary      # All vocabulary
POST   /api/admin/vocabulary      # Add vocabulary
PUT    /api/admin/vocabulary/:id  # Update vocabulary
DELETE /api/admin/vocabulary/:id  # Delete vocabulary

GET    /api/admin/lessons         # All lessons
POST   /api/admin/lessons         # Add lesson
PUT    /api/admin/lessons/:id     # Update lesson
DELETE /api/admin/lessons/:id     # Delete lesson

Similar CRUD patterns for:
- /api/admin/dialogues
- /api/admin/grammar
- /api/admin/quizzes
- /api/admin/users
- /api/admin/stats
```

### Frontend Architecture

**State Management:**
- All state stored in `localStorage`
- No global state management library
- Each page independently reads/writes localStorage

**Common patterns:**
```javascript
// Telegram WebApp initialization (all pages)
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();


// User identification headers
const headers = {
  'X-Telegram-User-Id': tg.initDataUnsafe.user?.id,
  'X-Telegram-Username': tg.initDataUnsafe.user?.username,
  'X-Telegram-First-Name': tg.initDataUnsafe.user?.first_name
};
```

**Multi-language support:**
- `i18n.js` handles translations
- Supports English, Russian (ru), Uzbek (uz)
- Language stored in localStorage as `language`

### Data Storage

**Backend (Supabase):**
- Lessons, dialogues, grammar, quizzes, vocabulary
- User progress and statistics
- Audio file metadata

**Frontend (localStorage keys):**
- `setupCompleted`: Boolean
- `selectedLanguage`: String ('en', 'ru', 'uz')
- `hskLevel`: Integer (1-6)
- `flashcards`: Array of saved flashcards
- `grammar_bookmarks`: Array of bookmarked grammar points
- `lesson{N}_completed`: Boolean per lesson
- `quizScore`: User's quiz performance

### Key Files

**Backend:**
- `bot.js` - Main server, API endpoints, bot commands
- `database.js` - All database operations with fallback mode
- `config.js` - Environment configuration
- `schema.sql` - Complete database schema
- `vocabulary-data.js` - Fallback vocabulary data

**Frontend Core:**
- `public/index.html` - Entry point router
- `public/home.html` - Main dashboard
- `public/api-config.js` - API URL configuration
- `public/auth.js` - User authentication utilities
- `public/i18n.js` - Multi-language support
- `public/styles.css` - Global styles

**Learning Pages:**
- `public/lessons.html` + `lessons.js` - Lesson browser
- `public/lesson.html` + `lesson.js` - Individual lesson view
- `public/flashcards.html` - Flashcard mode
- `public/quiz.html` - Quiz mode
- `public/character-writing.html` - Character practice
- `public/practice.html` - General practice mode

**Admin:**
- `public/admin/index.html` - Admin panel UI
- `public/admin/admin.js` - Admin logic

### Admin Panel Usage

1. Access at `http://localhost:3000/admin/`
2. Default password: `admin123` (change in `bot.js` line 274 and `admin/index.html`)
3. Available tabs:
   - **Lessons**: Create/edit lessons with HSK level, objectives
   - **Dialogues**: Add conversation dialogues with multi-language translations
   - **Grammar**: Grammar points with examples (JSONB format)
   - **Quizzes**: Practice questions (multiple choice, fill-blank, matching)
   - **Vocabulary**: Manage vocabulary with audio URLs
   - **Users**: View user statistics

### Audio Integration

Audio files are hosted externally and referenced by URL:

**Supported options:**
1. **Cloudflare R2** (recommended) - Configure in `.env`
2. **Supabase Storage** - Built-in with Supabase
3. **Google Drive** - Quick testing (convert share links to direct links)
4. **Any CDN** - S3, public URL, etc.

**Adding audio:**
- Upload files to hosting service
- Add public URL to `audio_url` field in database
- See `AUDIO-GUIDE.md` for detailed instructions

## Development Workflow

### Adding New Lessons

1. **Via Admin Panel:**
   - Go to Admin → Lessons tab
   - Fill in title, HSK level, description, objectives
   - Save lesson
   - Add dialogues, grammar, quizzes linked to lesson

2. **Via Supabase directly:**
   - Table Editor → lessons → Insert row
   - Then add related content in dialogues, grammar_points, quizzes tables

### Adding Vocabulary

- Use Admin Panel → Vocabulary tab
- Required: chinese, pinyin, english
- Optional: hsk_level, difficulty, audio_url, lesson_id

### Database Migrations

1. Create migration SQL file in `migrations/`
2. Test in Supabase SQL Editor
3. Document in `migrations/README.md`
4. Update `apply-migration.js` if needed

### Common Pitfalls

- **CORS issues**: Ensure audio URLs are publicly accessible with CORS enabled
- **Telegram headers**: User endpoints require `X-Telegram-User-Id` header
- **Admin auth**: All admin endpoints need `X-Admin-Password: admin123` header
- **Database fallback**: App works without database but with limited features
- **HSK level filtering**: Always check both frontend localStorage and API filters

## Deployment

1. **Deploy backend server** to Railway, Heroku, or VPS
2. **Update environment variables** with production values:
   - `MINI_APP_URL` = production URL
   - Supabase credentials
   - R2 credentials (if using audio)
3. **Configure Telegram bot:**
   - @BotFather → Bot Settings → Menu Button
   - Set URL to your deployed app
4. **Run database schema** in production Supabase
5. **Test all endpoints** before going live
