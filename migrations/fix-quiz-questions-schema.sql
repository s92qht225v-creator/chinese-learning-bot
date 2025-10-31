-- ==========================================
-- FIX QUIZ_QUESTIONS TABLE SCHEMA
-- ==========================================
-- This migration:
-- 1. Backs up data from existing quiz_questions table
-- 2. Drops the incorrectly structured quiz_questions table
-- 3. Recreates it with the correct schema from complete-quiz-system.sql
-- 4. Migrates data from the old 'quizzes' table

-- ==========================================
-- STEP 1: BACKUP EXISTING DATA (Optional)
-- ==========================================
-- Create temporary backup table if quiz_questions has data
CREATE TABLE IF NOT EXISTS quiz_questions_backup AS 
SELECT * FROM quiz_questions;

-- ==========================================
-- STEP 2: DROP INCORRECT TABLE
-- ==========================================
DROP TABLE IF EXISTS quiz_questions CASCADE;

-- ==========================================
-- STEP 3: CREATE CORRECT SCHEMA
-- ==========================================
CREATE TABLE quiz_questions (
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
CREATE INDEX idx_quiz_questions_type ON quiz_questions(question_type);
CREATE INDEX idx_quiz_questions_hsk ON quiz_questions(hsk_level);
CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX idx_quiz_questions_lesson ON quiz_questions(lesson_id);
CREATE INDEX idx_quiz_questions_status ON quiz_questions(status);

-- ==========================================
-- STEP 4: MIGRATE DATA FROM OLD QUIZZES TABLE
-- ==========================================
-- Copy existing quiz data from 'quizzes' table to 'quiz_questions'
INSERT INTO quiz_questions (
  question_type,
  hsk_level,
  question,
  chinese_text,
  pinyin,
  audio_url,
  correct_answer,
  options,
  explanation,
  lesson_id,
  created_at,
  difficulty
)
SELECT 
  question_type,
  COALESCE('HSK' || hsk_level, 'HSK1') as hsk_level,
  question,
  NULL as chinese_text, -- Not available in old schema
  NULL as pinyin, -- Not available in old schema
  audio_url,
  correct_answer,
  options,
  explanation,
  lesson_id,
  created_at,
  CASE difficulty
    WHEN 1 THEN 'easy'
    WHEN 2 THEN 'easy'
    WHEN 3 THEN 'medium'
    WHEN 4 THEN 'hard'
    WHEN 5 THEN 'hard'
    ELSE 'medium'
  END as difficulty
FROM quizzes
WHERE id NOT IN (SELECT id FROM quiz_questions WHERE id < 1000000); -- Avoid duplicates

-- ==========================================
-- STEP 5: UPDATE TRIGGER
-- ==========================================
-- Create the trigger function FIRST
CREATE OR REPLACE FUNCTION update_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Then create the trigger
DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();

-- ==========================================
-- STEP 6: VERIFY MIGRATION
-- ==========================================
-- Check row counts
-- SELECT 'Old quizzes table' as source, COUNT(*) as count FROM quizzes
-- UNION ALL
-- SELECT 'New quiz_questions table' as source, COUNT(*) as count FROM quiz_questions;

-- Sample data check
-- SELECT id, question_type, hsk_level, question, correct_answer FROM quiz_questions LIMIT 5;

-- ==========================================
-- OPTIONAL: DROP OLD QUIZZES TABLE
-- ==========================================
-- Uncomment these lines ONLY after verifying data migration:
-- DROP TABLE IF EXISTS quizzes CASCADE;
-- DROP TABLE IF EXISTS quiz_questions_backup CASCADE;

COMMENT ON TABLE quiz_questions IS 'Quiz questions with 12 different types - migrated from old quizzes table';
