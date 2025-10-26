-- Add Uzbek, Russian, and Part of Speech columns to vocabulary table
-- Run this in Supabase SQL Editor

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS uzbek TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS russian TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS part_of_speech VARCHAR(50);

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_vocabulary_uzbek ON vocabulary(uzbek);
CREATE INDEX IF NOT EXISTS idx_vocabulary_russian ON vocabulary(russian);
CREATE INDEX IF NOT EXISTS idx_vocabulary_pos ON vocabulary(part_of_speech);

-- Add comments
COMMENT ON COLUMN vocabulary.uzbek IS 'Uzbek translation of the Chinese word';
COMMENT ON COLUMN vocabulary.russian IS 'Russian translation of the Chinese word';
COMMENT ON COLUMN vocabulary.part_of_speech IS 'Part of speech: n (noun), v (verb), adj (adjective), adv (adverb), pron (pronoun), prep (preposition), conj (conjunction), etc.';
