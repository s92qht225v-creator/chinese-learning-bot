-- Add section_progress column to track individual section completion
ALTER TABLE lesson_progress
ADD COLUMN IF NOT EXISTS section_progress JSONB DEFAULT '{"audio": false, "dialogue": false, "vocab": false, "grammar": false, "practice": false}'::jsonb;

-- Update existing rows to have the default section_progress
UPDATE lesson_progress
SET section_progress = '{"audio": false, "dialogue": false, "vocab": false, "grammar": false, "practice": false}'::jsonb
WHERE section_progress IS NULL;
