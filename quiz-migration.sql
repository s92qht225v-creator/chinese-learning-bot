-- Migration: Add missing columns to existing quizzes table

-- First, let's add any missing columns to the existing quizzes table
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS question_type TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS question TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS correct_answer TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS pairs JSONB;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS difficulty INT DEFAULT 1;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS hsk_level INT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS lesson_id INT;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'quizzes_lesson_id_fkey'
    ) THEN
        ALTER TABLE quizzes
        ADD CONSTRAINT quizzes_lesson_id_fkey
        FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_question_type ON quizzes(question_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_hsk_level ON quizzes(hsk_level);

-- Create user_quiz_attempts table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_quiz_id ON user_quiz_attempts(quiz_id);

-- Enable RLS if not already enabled
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'quizzes' AND policyname = 'Allow public read access to quizzes'
    ) THEN
        CREATE POLICY "Allow public read access to quizzes" ON quizzes FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_quiz_attempts' AND policyname = 'Users can view their own quiz attempts'
    ) THEN
        CREATE POLICY "Users can view their own quiz attempts" ON user_quiz_attempts FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'user_quiz_attempts' AND policyname = 'Users can insert their own quiz attempts'
    ) THEN
        CREATE POLICY "Users can insert their own quiz attempts" ON user_quiz_attempts FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- Now insert sample quiz data (will only insert if no conflicts)
INSERT INTO quizzes (lesson_id, question_type, question, correct_answer, options, pairs, hsk_level, explanation) VALUES
  -- 1. Chinese to Uzbek
  (NULL, 'chinese_to_uzbek', '你好', 'Salom',
   '["Salom", "Xayr", "Rahmat", "Kechirasiz"]'::jsonb, NULL, 1,
   '"你好" (nǐ hǎo) - bu "Salom" degani. Xitoycha eng keng tarqalgan salomlashish.'),

  -- 2. Uzbek to Chinese
  (NULL, 'uzbek_to_chinese', 'Rahmat', '谢谢',
   '["谢谢", "你好", "再见", "对不起"]'::jsonb, NULL, 1,
   '"谢谢" (xièxie) - bu "Rahmat" degani.'),

  -- 3. Pinyin to Chinese
  (NULL, 'pinyin_to_chinese', 'nǐ hǎo', '你好',
   '["你好", "再见", "谢谢", "学习"]'::jsonb, NULL, 1,
   '"你好" - "nǐ hǎo" deb o''qiladi. "Salom" degani.'),

  -- 4. Chinese to Pinyin
  (NULL, 'chinese_to_pinyin', '谢谢', 'xièxie',
   '["xièxie", "nǐ hǎo", "zàijiàn", "xuéxí"]'::jsonb, NULL, 1,
   '"谢谢" - "xièxie" deb o''qiladi. Ikkalasi ham to''rtinchi ohangda.'),

  -- 5. Audio to Character
  (NULL, 'audio_to_character', 'Talaffuzni tinglang va to''g''ri belgini tanlang', '你好',
   '["你好", "再见", "谢谢", "学习"]'::jsonb, NULL, 1,
   'Audio: "nǐ hǎo" - bu "你好" belgisi, "Salom" degani.'),

  -- 6. Fill in the Blank
  (NULL, 'fill_blank', '我___学生 (Men talabaman)', '是',
   '["是", "在", "有", "要"]'::jsonb, NULL, 1,
   '"是" (shì) - "hisoblanmoq/bo''lmoq" degani. To''liq gap: "我是学生" (Wǒ shì xuésheng) - Men talabaman.'),

  -- 7. Multiple Choice
  (NULL, 'multiple_choice', '"老师" ning ma''nosi nima?', 'O''qituvchi',
   '["O''qituvchi", "Talaba", "Do''st", "Oila"]'::jsonb, NULL, 1,
   '"老师" (lǎoshī) - "O''qituvchi" degani.'),

  -- 8. True/False
  (NULL, 'true_false', '"你好" so''zi "Xayr" degan ma''noni bildiradi', 'Noto''g''ri',
   '["To''g''ri", "Noto''g''ri"]'::jsonb, NULL, 1,
   'Noto''g''ri! "你好" (nǐ hǎo) - "Salom" degani, "Xayr" esa "再见" (zàijiàn).'),

  -- 9. Typing
  (NULL, 'typing', '"Salom" ni xitoycha yozing', '你好', NULL, NULL, 1,
   '"你好" (nǐ hǎo) - bu "Salom" ning xitoycha ko''rinishi.'),

  -- 10. Match Pairs
  (NULL, 'match_pairs', 'Xitoycha so''zlarni o''zbek ma''nolari bilan tutashtiring', 'matches', NULL,
   '[{"left": "你好", "right": "Salom"}, {"left": "谢谢", "right": "Rahmat"}, {"left": "再见", "right": "Xayr"}, {"left": "学生", "right": "Talaba"}]'::jsonb,
   1, 'Har bir xitoy so''zini to''g''ri o''zbek tarjimasi bilan tutashtiring.')
ON CONFLICT DO NOTHING;
