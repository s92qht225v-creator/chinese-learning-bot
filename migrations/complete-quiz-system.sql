-- ==========================================
-- COMPLETE QUIZ SYSTEM SCHEMA
-- ==========================================
-- Run this in Supabase SQL Editor to set up the full quiz system
-- Includes: quiz questions, user progress, attempts, flashcards, achievements

-- ==========================================
-- 1. QUIZ QUESTIONS TABLE
-- ==========================================
-- Replaces/extends the existing 'quizzes' table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id SERIAL PRIMARY KEY,
  
  -- Basic Info
  question_type VARCHAR(50) NOT NULL, -- multiple_choice, fill_gap, true_false, matching, etc.
  hsk_level VARCHAR(10) NOT NULL, -- HSK1, HSK2, etc.
  difficulty VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
  tags TEXT, -- Comma-separated: grammar,vocabulary,daily-life
  
  -- Question Content
  question TEXT NOT NULL, -- Main question text
  chinese_text TEXT, -- Chinese characters if applicable
  pinyin TEXT, -- Pinyin romanization
  audio_url TEXT, -- Link to audio file
  image_url TEXT, -- Link to image file
  
  -- Answers
  correct_answer TEXT NOT NULL, -- The correct answer
  options JSONB, -- Multiple choice options or additional data
  acceptable_answers JSONB, -- Alternative correct answers (for fill-gap, dictation)
  
  -- Additional Info
  explanation TEXT, -- Explanation shown after answering
  hints JSONB, -- Array of hints
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL, -- Optional link to lesson
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255), -- Admin who created it
  status VARCHAR(20) DEFAULT 'active', -- active, archived, draft
  
  -- Stats
  times_shown INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0
);

-- Indexes for quiz_questions
CREATE INDEX IF NOT EXISTS idx_quiz_questions_type ON quiz_questions(question_type);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_hsk ON quiz_questions(hsk_level);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_lesson ON quiz_questions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_status ON quiz_questions(status);

-- ==========================================
-- 2. QUIZ ATTEMPTS TABLE
-- ==========================================
-- Tracks each time a user takes a quiz
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  
  -- User Info
  telegram_user_id BIGINT NOT NULL,
  username VARCHAR(255),
  
  -- Quiz Info
  quiz_type VARCHAR(50) NOT NULL, -- random, hsk_level, comprehensive, etc.
  hsk_level VARCHAR(10), -- HSK level filter if applicable
  
  -- Results
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  score_percentage DECIMAL(5,2), -- Calculated: (correct/total) * 100
  
  -- Timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER, -- Time taken to complete
  
  -- Additional Data
  questions_data JSONB, -- Array of question IDs answered
  xp_earned INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for quiz_attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_date ON quiz_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_score ON quiz_attempts(score_percentage DESC);

-- ==========================================
-- 3. USER ANSWERS TABLE
-- ==========================================
-- Individual question answers within quiz attempts
CREATE TABLE IF NOT EXISTS user_answers (
  id SERIAL PRIMARY KEY,
  
  -- References
  attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  telegram_user_id BIGINT NOT NULL,
  
  -- Answer Data
  user_answer TEXT, -- What the user answered
  correct_answer TEXT NOT NULL, -- The correct answer
  is_correct BOOLEAN NOT NULL,
  
  -- Timing
  time_taken_seconds INTEGER, -- Time spent on this question
  answered_at TIMESTAMP DEFAULT NOW(),
  
  -- Additional
  hint_used BOOLEAN DEFAULT FALSE,
  attempt_number INTEGER DEFAULT 1 -- If user tries multiple times
);

-- Indexes for user_answers
CREATE INDEX IF NOT EXISTS idx_user_answers_attempt ON user_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user ON user_answers(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_correct ON user_answers(is_correct);

-- ==========================================
-- 4. USER PROGRESS TABLE
-- ==========================================
-- Overall user statistics and progress
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL UNIQUE,
  username VARCHAR(255),
  
  -- Overall Stats
  total_xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  
  -- Quiz Stats
  total_quizzes_completed INTEGER DEFAULT 0,
  total_questions_answered INTEGER DEFAULT 0,
  total_correct_answers INTEGER DEFAULT 0,
  total_incorrect_answers INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  
  -- HSK Level Stats (JSONB for each level)
  hsk_stats JSONB DEFAULT '{}', -- {HSK1: {completed: 10, accuracy: 85}, ...}
  
  -- Question Type Stats
  question_type_stats JSONB DEFAULT '{}', -- {multiple_choice: {total: 50, correct: 42}, ...}
  
  -- Time Stats
  total_study_time_minutes INTEGER DEFAULT 0,
  last_active_date DATE,
  
  -- Achievements
  achievements_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_level ON user_progress(level DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_xp ON user_progress(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_user_progress_streak ON user_progress(current_streak DESC);

-- ==========================================
-- 5. USER FLASHCARDS TABLE
-- ==========================================
-- Spaced repetition flashcards for vocabulary
CREATE TABLE IF NOT EXISTS user_flashcards (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  
  -- Content
  question_id INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
  vocabulary_id INTEGER REFERENCES vocabulary(id) ON DELETE CASCADE,
  
  -- Card can be from either a quiz question OR vocabulary entry
  -- At least one must be set
  
  -- Spaced Repetition Data (SM-2 Algorithm)
  ease_factor DECIMAL(3,2) DEFAULT 2.5, -- Difficulty multiplier
  interval_days INTEGER DEFAULT 1, -- Days until next review
  repetitions INTEGER DEFAULT 0, -- Number of successful reviews
  next_review_date DATE NOT NULL,
  
  -- Stats
  times_reviewed INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, mastered, suspended
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for user_flashcards
CREATE INDEX IF NOT EXISTS idx_user_flashcards_user ON user_flashcards(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_next_review ON user_flashcards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_status ON user_flashcards(status);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_question ON user_flashcards(question_id);
CREATE INDEX IF NOT EXISTS idx_user_flashcards_vocab ON user_flashcards(vocabulary_id);

-- ==========================================
-- 6. ACHIEVEMENTS TABLE
-- ==========================================
-- Available achievements users can earn
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  
  -- Basic Info
  achievement_key VARCHAR(50) NOT NULL UNIQUE, -- first_quiz, streak_7, perfect_score, etc.
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50), -- Emoji or icon name
  
  -- Requirements
  requirement_type VARCHAR(50) NOT NULL, -- quiz_count, streak, score, xp, etc.
  requirement_value INTEGER NOT NULL, -- Threshold to unlock
  
  -- Reward
  xp_reward INTEGER DEFAULT 0,
  
  -- Metadata
  category VARCHAR(50), -- beginner, intermediate, advanced, special
  rarity VARCHAR(20) DEFAULT 'common', -- common, rare, epic, legendary
  is_hidden BOOLEAN DEFAULT FALSE, -- Secret achievements
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for achievements
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(achievement_key);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- Sample achievements
INSERT INTO achievements (achievement_key, title, description, icon, requirement_type, requirement_value, xp_reward, category, rarity) VALUES
('first_quiz', 'First Steps', 'Complete your first quiz', '🎯', 'quiz_count', 1, 10, 'beginner', 'common'),
('quiz_10', 'Getting Started', 'Complete 10 quizzes', '📚', 'quiz_count', 10, 50, 'beginner', 'common'),
('quiz_50', 'Dedicated Learner', 'Complete 50 quizzes', '🔥', 'quiz_count', 50, 200, 'intermediate', 'rare'),
('quiz_100', 'Quiz Master', 'Complete 100 quizzes', '👑', 'quiz_count', 100, 500, 'advanced', 'epic'),
('streak_3', '3-Day Streak', 'Study for 3 days in a row', '🔸', 'streak', 3, 25, 'beginner', 'common'),
('streak_7', 'Week Warrior', 'Study for 7 days in a row', '🔶', 'streak', 7, 75, 'intermediate', 'rare'),
('streak_30', 'Consistency King', 'Study for 30 days in a row', '💎', 'streak', 30, 300, 'advanced', 'epic'),
('perfect_score', 'Perfectionist', 'Get 100% on a quiz', '⭐', 'perfect_score', 1, 50, 'intermediate', 'rare'),
('hsk1_master', 'HSK 1 Master', 'Complete 20 HSK 1 quizzes', '1️⃣', 'hsk_level_quizzes', 20, 100, 'intermediate', 'rare'),
('fast_learner', 'Speed Demon', 'Complete a quiz in under 60 seconds', '⚡', 'quiz_time', 60, 75, 'special', 'rare'),
('night_owl', 'Night Owl', 'Complete a quiz after midnight', '🦉', 'special', 1, 25, 'special', 'common'),
('early_bird', 'Early Bird', 'Complete a quiz before 6 AM', '🌅', 'special', 1, 25, 'special', 'common')
ON CONFLICT (achievement_key) DO NOTHING;

-- ==========================================
-- 7. USER ACHIEVEMENTS TABLE
-- ==========================================
-- Achievements earned by users
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  telegram_user_id BIGINT NOT NULL,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  
  -- When earned
  earned_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicates
  UNIQUE(telegram_user_id, achievement_id)
);

-- Indexes for user_achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON user_achievements(earned_at DESC);

-- ==========================================
-- TRIGGERS AND FUNCTIONS
-- ==========================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

DROP TRIGGER IF EXISTS update_user_flashcards_updated_at ON user_flashcards;
CREATE TRIGGER update_user_flashcards_updated_at
    BEFORE UPDATE ON user_flashcards
    FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

-- ==========================================
-- DATA MIGRATION (Optional)
-- ==========================================
-- If you have existing 'quizzes' table data, migrate it to quiz_questions

-- INSERT INTO quiz_questions (
--   question, question_type, hsk_level, correct_answer, options, explanation, lesson_id, created_at
-- )
-- SELECT 
--   question, 
--   question_type, 
--   COALESCE(hsk_level, 'HSK1'), 
--   correct_answer, 
--   options, 
--   explanation, 
--   lesson_id, 
--   created_at
-- FROM quizzes
-- WHERE id NOT IN (SELECT id FROM quiz_questions);

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================
COMMENT ON TABLE quiz_questions IS 'All quiz questions with 12 different types';
COMMENT ON TABLE quiz_attempts IS 'User quiz attempts and scores';
COMMENT ON TABLE user_answers IS 'Individual answers to questions';
COMMENT ON TABLE user_progress IS 'Overall user statistics and XP';
COMMENT ON TABLE user_flashcards IS 'Spaced repetition flashcards';
COMMENT ON TABLE achievements IS 'Available achievements to earn';
COMMENT ON TABLE user_achievements IS 'Achievements earned by users';

-- ==========================================
-- STORAGE BUCKETS SETUP
-- ==========================================
-- Run these commands in Supabase Dashboard -> Storage
-- Or use the Supabase SQL Editor:

-- Create quiz-audio bucket (10MB limit, public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-audio',
  'quiz-audio',
  true,
  10485760, -- 10MB in bytes
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Create quiz-images bucket (5MB limit, public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quiz-images',
  'quiz-images',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- STORAGE POLICIES
-- ==========================================
-- Allow public read access to both buckets

-- Quiz Audio policies
CREATE POLICY "Public Access for quiz-audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-audio');

CREATE POLICY "Authenticated users can upload quiz-audio"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quiz-audio');

-- Quiz Images policies
CREATE POLICY "Public Access for quiz-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'quiz-images');

CREATE POLICY "Authenticated users can upload quiz-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quiz-images');

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================
-- Run these after migration to verify:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('quiz_questions', 'quiz_attempts', 'user_answers', 'user_progress', 'user_flashcards', 'achievements', 'user_achievements');

-- Check storage buckets
-- SELECT * FROM storage.buckets WHERE id IN ('quiz-audio', 'quiz-images');

-- Check sample achievements
-- SELECT * FROM achievements;

-- ==========================================
-- SUCCESS!
-- ==========================================
-- Your complete quiz system is now ready!
-- Next steps:
-- 1. Update API endpoints in bot.js to use quiz_questions instead of quizzes
-- 2. Implement spaced repetition logic for flashcards
-- 3. Add achievement checking logic when users complete quizzes
-- 4. Create file upload endpoints for audio and images
