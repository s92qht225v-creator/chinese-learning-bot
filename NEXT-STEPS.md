# Next Steps - Complete Your Production Setup

Your bot is running! Now add database and media storage:

## ✅ What's Working Now
- Bot connected to Telegram
- Mini app loads at http://159.65.11.158:3000
- Basic vocabulary and quizzes work

## 🚀 Next: Add Database (5 minutes)

### 1. Create Supabase Account
Go to [supabase.com](https://supabase.com) → Sign up → New Project

**Save these:**
- Project URL: `https://xxx.supabase.co`
- Anon key: `eyJhbG...` (public)
- Service role key: `eyJhbG...` (secret!)

### 2. Create Tables
In Supabase Dashboard → SQL Editor, paste and run:

```sql
-- Users
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  hsk_level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vocabulary
CREATE TABLE vocabulary (
  id SERIAL PRIMARY KEY,
  chinese TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  difficulty TEXT,
  hsk_level INT,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert existing words
INSERT INTO vocabulary (chinese, pinyin, english, difficulty, hsk_level) VALUES
  ('你好', 'nǐ hǎo', 'hello', 'beginner', 1),
  ('谢谢', 'xièxie', 'thank you', 'beginner', 1),
  ('再见', 'zàijiàn', 'goodbye', 'beginner', 1),
  ('学习', 'xuéxí', 'to study', 'beginner', 1),
  ('中文', 'zhōngwén', 'Chinese language', 'beginner', 1),
  ('朋友', 'péngyou', 'friend', 'beginner', 1),
  ('吃饭', 'chīfàn', 'to eat', 'beginner', 1),
  ('喝水', 'hēshuǐ', 'to drink water', 'beginner', 1);

-- User progress
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id),
  vocabulary_id INT REFERENCES vocabulary(id),
  mastery_level INT DEFAULT 0,
  last_reviewed TIMESTAMP,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  UNIQUE(user_id, vocabulary_id)
);
```

### 3. Update Your Droplet
SSH into your droplet:

```bash
ssh root@159.65.11.158
cd /var/www/chinese-learning-bot
nano .env
```

Add these lines:
```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

Save (Ctrl+X, Y, Enter), then restart:
```bash
pm2 restart chinese-learning-bot
pm2 logs
```

You should see: `✅ Database connected`

---

## 📦 Later: Add Media Storage (Cloudflare R2)

When you have audio/video files ready:

1. [dash.cloudflare.com](https://dash.cloudflare.com) → R2 → Create Bucket
2. Name: `chinese-learning-media`
3. Get API tokens
4. Add to `.env`:
```
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
```

Upload files via dashboard or API, get URLs like:
```
https://pub-xxx.r2.dev/audio/nihao.mp3
```

Add to database:
```sql
UPDATE vocabulary 
SET audio_url = 'https://pub-xxx.r2.dev/audio/nihao.mp3'
WHERE chinese = '你好';
```

---

## 🎯 Current Status

**Cost:** $6/month (just the droplet)
**What works:**
- ✅ Telegram bot
- ✅ Mini app
- ✅ Flashcards
- ✅ Quizzes  
- ✅ Character writing
- ✅ Text-to-speech

**What's next:**
- 🔄 Database (user tracking, real stats)
- 🔄 Media storage (real audio files)
- 🔄 More vocabulary
- 🔄 More lessons

---

## 📚 Add More Vocabulary

In Supabase → Table Editor → vocabulary → Insert row:
- chinese: 你
- pinyin: nǐ
- english: you
- difficulty: beginner
- hsk_level: 1

Or bulk insert via SQL!

---

## Need Help?

Check logs:
```bash
ssh root@159.65.11.158
pm2 logs chinese-learning-bot
```

Restart bot:
```bash
pm2 restart chinese-learning-bot
```

Update code:
```bash
# On your Mac
cd /Users/ali/chinese-learning-bot
scp -r * root@159.65.11.158:/var/www/chinese-learning-bot/

# Then restart
ssh root@159.65.11.158 "cd /var/www/chinese-learning-bot && pm2 restart chinese-learning-bot"
```
