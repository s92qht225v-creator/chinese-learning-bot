-- Complete Database Schema for Chinese Learning Bot
-- Run this in Supabase SQL Editor

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  hsk_level INTEGER NOT NULL CHECK (hsk_level BETWEEN 1 AND 6),
  lesson_number INTEGER NOT NULL,
  description TEXT,
  objectives TEXT[],
  status VARCHAR(50) DEFAULT 'draft', -- draft, published
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(hsk_level, lesson_number)
);

-- Dialogues table
CREATE TABLE IF NOT EXISTS dialogues (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  dialogue_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dialogue lines (individual sentences in a dialogue)
CREATE TABLE IF NOT EXISTS dialogue_lines (
  id SERIAL PRIMARY KEY,
  dialogue_id INTEGER REFERENCES dialogues(id) ON DELETE CASCADE,
  speaker VARCHAR(100),
  chinese TEXT NOT NULL,
  pinyin TEXT NOT NULL,
  english TEXT NOT NULL,
  line_order INTEGER NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grammar points table
CREATE TABLE IF NOT EXISTS grammar_points (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  explanation TEXT NOT NULL,
  examples JSONB, -- Array of {chinese, pinyin, english}
  grammar_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- multiple_choice, fill_blank, matching
  options JSONB, -- Array of options for multiple choice
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  quiz_order INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audio files table
CREATE TABLE IF NOT EXISTS audio_files (
  id SERIAL PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- dialogue, vocabulary, grammar
  reference_id INTEGER, -- ID of related dialogue_line, vocabulary, etc.
  duration INTEGER, -- in seconds
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Update existing vocabulary table to add audio support (if not exists)
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_hsk ON lessons(hsk_level);
CREATE INDEX IF NOT EXISTS idx_dialogues_lesson ON dialogues(lesson_id);
CREATE INDEX IF NOT EXISTS idx_dialogue_lines_dialogue ON dialogue_lines(dialogue_id);
CREATE INDEX IF NOT EXISTS idx_grammar_lesson ON grammar_points(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes(lesson_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for lessons table
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample lesson
INSERT INTO lessons (title, hsk_level, lesson_number, description, objectives, status)
VALUES (
  'Greetings and Introductions',
  1,
  1,
  'Learn basic greetings and how to introduce yourself in Chinese',
  ARRAY['Say hello and goodbye', 'Introduce yourself', 'Ask someone''s name'],
  'published'
) ON CONFLICT (hsk_level, lesson_number) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE lessons IS 'Main lessons table with HSK level and basic info';
COMMENT ON TABLE dialogues IS 'Dialogue scenarios for each lesson';
COMMENT ON TABLE dialogue_lines IS 'Individual lines within dialogues with translations';
COMMENT ON TABLE grammar_points IS 'Grammar explanations and examples for lessons';
COMMENT ON TABLE quizzes IS 'Practice questions and exercises for lessons';
COMMENT ON TABLE audio_files IS 'Audio file metadata and URLs';
