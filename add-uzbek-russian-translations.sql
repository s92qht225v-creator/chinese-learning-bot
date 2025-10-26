-- Add Uzbek, Russian, and Part of Speech columns to all content tables
-- Run this in Supabase SQL Editor

-- ========== VOCABULARY ==========
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS uzbek TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS russian TEXT;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS part_of_speech VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_vocabulary_uzbek ON vocabulary(uzbek);
CREATE INDEX IF NOT EXISTS idx_vocabulary_russian ON vocabulary(russian);
CREATE INDEX IF NOT EXISTS idx_vocabulary_pos ON vocabulary(part_of_speech);

COMMENT ON COLUMN vocabulary.uzbek IS 'Uzbek translation';
COMMENT ON COLUMN vocabulary.russian IS 'Russian translation';
COMMENT ON COLUMN vocabulary.part_of_speech IS 'Part of speech: n, v, adj, adv, pron, prep, conj, interj, mw, particle';

-- ========== LESSONS ==========
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS title_uz TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS title_ru TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description_uz TEXT;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description_ru TEXT;

COMMENT ON COLUMN lessons.title_uz IS 'Uzbek lesson title';
COMMENT ON COLUMN lessons.title_ru IS 'Russian lesson title';
COMMENT ON COLUMN lessons.description_uz IS 'Uzbek lesson description';
COMMENT ON COLUMN lessons.description_ru IS 'Russian lesson description';

-- ========== DIALOGUES ==========
ALTER TABLE dialogues ADD COLUMN IF NOT EXISTS title_uz TEXT;
ALTER TABLE dialogues ADD COLUMN IF NOT EXISTS title_ru TEXT;

COMMENT ON COLUMN dialogues.title_uz IS 'Uzbek dialogue title';
COMMENT ON COLUMN dialogues.title_ru IS 'Russian dialogue title';

-- ========== DIALOGUE LINES ==========
ALTER TABLE dialogue_lines ADD COLUMN IF NOT EXISTS uzbek TEXT;
ALTER TABLE dialogue_lines ADD COLUMN IF NOT EXISTS russian TEXT;

COMMENT ON COLUMN dialogue_lines.uzbek IS 'Uzbek translation of dialogue line';
COMMENT ON COLUMN dialogue_lines.russian IS 'Russian translation of dialogue line';

-- ========== GRAMMAR POINTS ==========
ALTER TABLE grammar_points ADD COLUMN IF NOT EXISTS title_uz TEXT;
ALTER TABLE grammar_points ADD COLUMN IF NOT EXISTS title_ru TEXT;
ALTER TABLE grammar_points ADD COLUMN IF NOT EXISTS explanation_uz TEXT;
ALTER TABLE grammar_points ADD COLUMN IF NOT EXISTS explanation_ru TEXT;

COMMENT ON COLUMN grammar_points.title_uz IS 'Uzbek grammar title';
COMMENT ON COLUMN grammar_points.title_ru IS 'Russian grammar title';
COMMENT ON COLUMN grammar_points.explanation_uz IS 'Uzbek grammar explanation';
COMMENT ON COLUMN grammar_points.explanation_ru IS 'Russian grammar explanation';

-- ========== QUIZZES ==========
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS question_uz TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS question_ru TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS explanation_uz TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS explanation_ru TEXT;

COMMENT ON COLUMN quizzes.question_uz IS 'Uzbek quiz question';
COMMENT ON COLUMN quizzes.question_ru IS 'Russian quiz question';
COMMENT ON COLUMN quizzes.explanation_uz IS 'Uzbek answer explanation';
COMMENT ON COLUMN quizzes.explanation_ru IS 'Russian answer explanation';
