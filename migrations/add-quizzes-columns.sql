-- Add missing columns to quizzes table for quiz creator compatibility
-- Run this in Supabase SQL Editor

-- Add hsk_level column (HSK 1-6)
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS hsk_level VARCHAR(10);

-- Add tags column for organizing questions by topic
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS tags TEXT;

-- Add index for HSK level filtering
CREATE INDEX IF NOT EXISTS idx_quizzes_hsk_level ON quizzes(hsk_level);

-- Update any existing quizzes to have a default HSK level
UPDATE quizzes SET hsk_level = 'HSK1' WHERE hsk_level IS NULL;

COMMENT ON COLUMN quizzes.hsk_level IS 'HSK difficulty level (HSK1-HSK6)';
COMMENT ON COLUMN quizzes.tags IS 'Comma-separated tags for organization (e.g., grammar,vocabulary,daily life)';
