-- Supabase Database Schema for Chinese Learning Bot

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  hsk_level INT DEFAULT 1,
  daily_goal INT DEFAULT 20,
  interface_language TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id SERIAL PRIMARY KEY,
  chinese TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  difficulty TEXT,
  hsk_level INT,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  vocabulary_id INT REFERENCES vocabulary(id) ON DELETE CASCADE,
  mastery_level INT DEFAULT 0,
  last_reviewed TIMESTAMP WITH TIME ZONE,
  next_review TIMESTAMP WITH TIME ZONE,
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, vocabulary_id)
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  hsk_level INT NOT NULL,
  lesson_number INT NOT NULL,
  title TEXT NOT NULL,
  dialogue JSONB,
  vocabulary_ids INT[],
  grammar JSONB,
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(hsk_level, lesson_number)
);

-- User lesson progress
CREATE TABLE IF NOT EXISTS user_lesson_progress (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  progress INT DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_hsk_level ON vocabulary(hsk_level);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_vocabulary_id ON user_progress(vocabulary_id);
CREATE INDEX IF NOT EXISTS idx_lessons_hsk_level ON lessons(hsk_level);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON user_lesson_progress(user_id);

-- Insert sample vocabulary data
INSERT INTO vocabulary (chinese, pinyin, english, difficulty, hsk_level) VALUES
  ('你好', 'nǐ hǎo', 'hello', 'beginner', 1),
  ('谢谢', 'xièxie', 'thank you', 'beginner', 1),
  ('再见', 'zàijiàn', 'goodbye', 'beginner', 1),
  ('学习', 'xuéxí', 'to study', 'beginner', 1),
  ('中文', 'zhōngwén', 'Chinese language', 'beginner', 1),
  ('朋友', 'péngyou', 'friend', 'beginner', 1),
  ('吃饭', 'chīfàn', 'to eat', 'beginner', 1),
  ('喝水', 'hēshuǐ', 'to drink water', 'beginner', 1),
  ('学校', 'xuéxiào', 'school', 'beginner', 1),
  ('老师', 'lǎoshī', 'teacher', 'beginner', 1),
  ('学生', 'xuésheng', 'student', 'beginner', 1),
  ('家', 'jiā', 'home/family', 'beginner', 1),
  ('工作', 'gōngzuò', 'work/job', 'beginner', 1),
  ('时间', 'shíjiān', 'time', 'beginner', 2),
  ('今天', 'jīntiān', 'today', 'beginner', 1),
  ('明天', 'míngtiān', 'tomorrow', 'beginner', 1),
  ('昨天', 'zuótiān', 'yesterday', 'beginner', 1),
  ('现在', 'xiànzài', 'now', 'beginner', 1),
  ('喜欢', 'xǐhuan', 'to like', 'beginner', 1),
  ('爱', 'ài', 'to love', 'beginner', 1)
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (adjust as needed for your security requirements)
CREATE POLICY "Allow public read access to vocabulary" ON vocabulary FOR SELECT USING (true);
CREATE POLICY "Allow public read access to lessons" ON lessons FOR SELECT USING (true);

-- Create policies for authenticated users
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert their own progress" ON user_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own progress" ON user_progress FOR UPDATE USING (true);
CREATE POLICY "Users can view their lesson progress" ON user_lesson_progress FOR SELECT USING (true);
CREATE POLICY "Users can insert their lesson progress" ON user_lesson_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their lesson progress" ON user_lesson_progress FOR UPDATE USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON vocabulary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_lesson_progress_updated_at BEFORE UPDATE ON user_lesson_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
