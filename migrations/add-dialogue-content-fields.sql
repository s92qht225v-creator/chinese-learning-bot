-- Add content fields to dialogues table
-- This allows storing dialogue content directly in the dialogues table

ALTER TABLE dialogues
ADD COLUMN IF NOT EXISTS speaker VARCHAR(100),
ADD COLUMN IF NOT EXISTS chinese TEXT,
ADD COLUMN IF NOT EXISTS pinyin TEXT,
ADD COLUMN IF NOT EXISTS english TEXT,
ADD COLUMN IF NOT EXISTS uzbek TEXT,
ADD COLUMN IF NOT EXISTS russian TEXT;

-- Update the existing dialogue to add sample data
-- UPDATE dialogues SET
--   speaker = 'Person A',
--   chinese = '你好',
--   pinyin = 'Nǐ hǎo',
--   english = 'Hello',
--   uzbek = 'Salom',
--   russian = 'Привет'
-- WHERE id = 2;
