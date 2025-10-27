-- Quick update to add multi-language support columns
-- This is a minimal migration that won't break existing functionality

-- Add columns to dialogues table
ALTER TABLE dialogues
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add translation columns to dialogue_lines table
ALTER TABLE dialogue_lines
ADD COLUMN IF NOT EXISTS translation_en TEXT,
ADD COLUMN IF NOT EXISTS translation_ru TEXT,
ADD COLUMN IF NOT EXISTS translation_uz TEXT;

-- Set display_order for existing dialogues
UPDATE dialogues
SET display_order = COALESCE(dialogue_order, id),
    visible = true
WHERE display_order IS NULL OR display_order = 0;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_dialogues_visible ON dialogues(visible);
CREATE INDEX IF NOT EXISTS idx_dialogues_display_order ON dialogues(display_order);
