-- Migration: Update dialogues schema for multi-language support
-- This aligns the schema with the multi-language dialogue management spec

-- Step 1: Add missing columns to dialogues table
ALTER TABLE dialogues
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Step 2: Add Russian and Uzbek translation columns to dialogue_lines table
-- Note: The table currently has 'english' column, we'll keep it and add new ones
ALTER TABLE dialogue_lines
ADD COLUMN IF NOT EXISTS translation_en TEXT,
ADD COLUMN IF NOT EXISTS translation_ru TEXT,
ADD COLUMN IF NOT EXISTS translation_uz TEXT,
ADD COLUMN IF NOT EXISTS uzbek TEXT,
ADD COLUMN IF NOT EXISTS russian TEXT;

-- Step 3: Migrate existing 'english' data to 'translation_en' if needed
UPDATE dialogue_lines
SET translation_en = english
WHERE translation_en IS NULL AND english IS NOT NULL;

-- Step 4: Migrate uzbek to translation_uz if needed
UPDATE dialogue_lines
SET translation_uz = uzbek
WHERE translation_uz IS NULL AND uzbek IS NOT NULL;

-- Step 5: Migrate russian to translation_ru if needed
UPDATE dialogue_lines
SET translation_ru = russian
WHERE translation_ru IS NULL AND russian IS NOT NULL;

-- Step 6: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dialogues_visible ON dialogues(visible);
CREATE INDEX IF NOT EXISTS idx_dialogues_display_order ON dialogues(display_order);
CREATE INDEX IF NOT EXISTS idx_dialogue_lines_order ON dialogue_lines(line_order);

-- Step 7: Add unique constraint for dialogue_id and line_order
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'dialogue_lines_dialogue_id_line_order_key'
    ) THEN
        ALTER TABLE dialogue_lines
        ADD CONSTRAINT dialogue_lines_dialogue_id_line_order_key
        UNIQUE (dialogue_id, line_order);
    END IF;
END $$;

-- Step 8: Create trigger for auto-updating updated_at timestamp on dialogues
CREATE OR REPLACE FUNCTION update_dialogues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dialogues_updated_at ON dialogues;
CREATE TRIGGER trigger_dialogues_updated_at
    BEFORE UPDATE ON dialogues
    FOR EACH ROW
    EXECUTE FUNCTION update_dialogues_updated_at();

-- Step 9: Set display_order for existing dialogues if not set
UPDATE dialogues
SET display_order = id
WHERE display_order IS NULL OR display_order = 0;

-- Comments for documentation
COMMENT ON COLUMN dialogues.visible IS 'Controls whether dialogue is shown to users';
COMMENT ON COLUMN dialogues.display_order IS 'Order in which dialogues are displayed';
COMMENT ON COLUMN dialogue_lines.translation_en IS 'English translation of the dialogue line';
COMMENT ON COLUMN dialogue_lines.translation_ru IS 'Russian (Русский) translation of the dialogue line';
COMMENT ON COLUMN dialogue_lines.translation_uz IS 'Uzbek (O''zbek) translation of the dialogue line';
COMMENT ON COLUMN dialogue_lines.line_order IS 'Order of line within dialogue';
