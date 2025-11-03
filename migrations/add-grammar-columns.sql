-- ==========================================
-- ADD NEW COLUMNS TO GRAMMAR_POINTS TABLE
-- ==========================================
-- This migration adds new columns to support enhanced grammar features:
-- subtitle, hsk_level, difficulty, structure, keywords, note, common_mistake

-- Add new columns if they don't exist
ALTER TABLE grammar_points
ADD COLUMN IF NOT EXISTS subtitle VARCHAR(255),
ADD COLUMN IF NOT EXISTS hsk_level VARCHAR(10),
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20),
ADD COLUMN IF NOT EXISTS structure TEXT,
ADD COLUMN IF NOT EXISTS keywords JSONB,
ADD COLUMN IF NOT EXISTS note TEXT,
ADD COLUMN IF NOT EXISTS common_mistake TEXT;

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_grammar_hsk_level ON grammar_points(hsk_level);
CREATE INDEX IF NOT EXISTS idx_grammar_difficulty ON grammar_points(difficulty);

-- Update existing records to have default HSK level based on lesson
UPDATE grammar_points g
SET hsk_level = l.hsk_level
FROM lessons l
WHERE g.lesson_id = l.id
AND g.hsk_level IS NULL;

COMMENT ON COLUMN grammar_points.subtitle IS 'Brief description of the grammar point';
COMMENT ON COLUMN grammar_points.hsk_level IS 'HSK level (HSK1-HSK6)';
COMMENT ON COLUMN grammar_points.difficulty IS 'Difficulty level (easy, medium, hard)';
COMMENT ON COLUMN grammar_points.structure IS 'Grammar structure pattern (e.g., Subject + 也 + Verb)';
COMMENT ON COLUMN grammar_points.keywords IS 'Array of keywords to highlight in examples';
COMMENT ON COLUMN grammar_points.note IS 'Key point or important note about usage';
COMMENT ON COLUMN grammar_points.common_mistake IS 'Common mistake students make with this grammar';
