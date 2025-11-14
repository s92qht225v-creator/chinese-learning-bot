-- Create character_writing_list table for dedicated character writing practice
-- This table stores individual characters (not words) with their meanings

CREATE TABLE IF NOT EXISTS character_writing_list (
  id SERIAL PRIMARY KEY,
  character TEXT NOT NULL UNIQUE,           -- Single Chinese character (e.g., '你', '好')
  pinyin TEXT NOT NULL,                      -- Character-specific pinyin (e.g., 'nǐ', 'hǎo')
  uzbek_meaning TEXT NOT NULL,               -- Character-specific Uzbek translation
  vocabulary_id INTEGER,                     -- Optional: reference to vocabulary table
  practice_order INTEGER NOT NULL DEFAULT 0, -- Order in which characters appear
  difficulty_rating INTEGER,                 -- 1-5 difficulty rating
  hsk_level INTEGER,                         -- HSK level (1-6)
  enabled BOOLEAN DEFAULT true,              -- Whether to show in practice
  notes TEXT,                                -- Optional notes about the character
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_character_writing_enabled ON character_writing_list(enabled);
CREATE INDEX IF NOT EXISTS idx_character_writing_order ON character_writing_list(practice_order);
CREATE INDEX IF NOT EXISTS idx_character_writing_hsk ON character_writing_list(hsk_level);

-- Add foreign key constraint (optional - only if vocabulary_id is set)
ALTER TABLE character_writing_list
  ADD CONSTRAINT fk_character_writing_vocabulary
  FOREIGN KEY (vocabulary_id)
  REFERENCES vocabulary(id)
  ON DELETE SET NULL;

-- Insert some sample data (common HSK1 characters)
INSERT INTO character_writing_list (character, pinyin, uzbek_meaning, practice_order, hsk_level, enabled) VALUES
  ('你', 'nǐ', 'sen', 1, 1, true),
  ('好', 'hǎo', 'yaxshi', 2, 1, true),
  ('我', 'wǒ', 'men', 3, 1, true),
  ('是', 'shì', 'bo''lmoq (hisoblanmoq)', 4, 1, true),
  ('的', 'de', 'ning (egalik)', 5, 1, true),
  ('不', 'bù', 'emas', 6, 1, true),
  ('人', 'rén', 'odam', 7, 1, true),
  ('们', 'men', 'lar (ko''plik)', 8, 1, true),
  ('大', 'dà', 'katta', 9, 1, true),
  ('小', 'xiǎo', 'kichik', 10, 1, true)
ON CONFLICT (character) DO NOTHING;

COMMENT ON TABLE character_writing_list IS 'Individual Chinese characters for writing practice with stroke order';
COMMENT ON COLUMN character_writing_list.character IS 'Single Chinese character (not compound words)';
COMMENT ON COLUMN character_writing_list.uzbek_meaning IS 'Character-specific meaning (not word meaning)';
COMMENT ON COLUMN character_writing_list.practice_order IS 'Order in practice sessions (lower = earlier)';
