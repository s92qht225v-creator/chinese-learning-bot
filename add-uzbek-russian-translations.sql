-- Add Uzbek and Russian translation columns to vocabulary table
-- Run this in Supabase SQL Editor

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS uzbek TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS russian TEXT;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_uzbek ON vocabulary(uzbek);
CREATE INDEX IF NOT EXISTS idx_vocabulary_russian ON vocabulary(russian);

-- Add comments
COMMENT ON COLUMN vocabulary.uzbek IS 'Uzbek translation of the Chinese word';
COMMENT ON COLUMN vocabulary.russian IS 'Russian translation of the Chinese word';
