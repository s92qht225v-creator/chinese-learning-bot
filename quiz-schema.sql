-- Enhanced Quiz System for Chinese Learning Bot (For Uzbek Speakers)

-- Quiz table with multiple question types
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL,
  -- Savol turlari / Quiz Types:
  -- 'chinese_to_uzbek' - Xitoycha ko'rsatiladi 你好, javob "Salom" tanlanadi
  -- 'uzbek_to_chinese' - O'zbekcha "Salom" ko'rsatiladi, javob 你好 tanlanadi
  -- 'pinyin_to_chinese' - Pinyin "nǐ hǎo" ko'rsatiladi, javob 你好 tanlanadi
  -- 'chinese_to_pinyin' - Xitoycha 你好 ko'rsatiladi, javob "nǐ hǎo" tanlanadi
  -- 'audio_to_character' - Talaffuzni tinglang, to'g'ri belgini tanlang
  -- 'fill_blank' - Bo'sh joyni to'ldiring: "我___学生" (man)
  -- 'multiple_choice' - Har bir savolda 4 ta variant
  -- 'true_false' - Tez to'g'ri/noto'g'ri savollari
  -- 'typing' - Javobni qo'lda yozing
  -- 'match_pairs' - Bog'liq narsalarni tutashtiring

  question TEXT NOT NULL, -- Foydalanuvchiga ko'rsatiladigan savol
  correct_answer TEXT NOT NULL, -- To'g'ri javob
  options JSONB, -- Ko'p tanlovli javob variantlari: ["variant1", "variant2", "variant3", "variant4"]
  pairs JSONB, -- match_pairs uchun: [{"left": "你好", "right": "Salom"}, {"left": "谢谢", "right": "Rahmat"}]
  audio_url TEXT, -- audio_to_character turi uchun audio fayl
  explanation TEXT, -- O'zbekcha tushuntirish
  difficulty INT DEFAULT 1, -- Qiyinlik darajasi 1-5
  hsk_level INT, -- HSK daraja
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User quiz attempts
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INT, -- seconds
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_question_type ON quizzes(question_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_hsk_level ON quizzes(hsk_level);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_user_id ON user_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quiz_attempts_quiz_id ON user_quiz_attempts(quiz_id);

-- Enable RLS
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access to quizzes" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Users can view their own quiz attempts" ON user_quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Users can insert their own quiz attempts" ON user_quiz_attempts FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Turli savol turlari uchun namunalar (O'zbekcha → Xitoycha)
INSERT INTO quizzes (lesson_id, question_type, question, correct_answer, options, pairs, hsk_level, explanation) VALUES
  -- 1. Chinese to Uzbek - Xitoycha ko'rsatiladi, o'zbekcha javob tanlanadi
  (NULL, 'chinese_to_uzbek', '你好', 'Salom',
   '["Salom", "Xayr", "Rahmat", "Kechirasiz"]'::jsonb, NULL, 1,
   '"你好" (nǐ hǎo) - bu "Salom" degani. Xitoycha eng keng tarqalgan salomlashish.'),

  -- 2. Uzbek to Chinese - O'zbekcha ko'rsatiladi, xitoycha javob tanlanadi
  (NULL, 'uzbek_to_chinese', 'Rahmat', '谢谢',
   '["谢谢", "你好", "再见", "对不起"]'::jsonb, NULL, 1,
   '"谢谢" (xièxie) - bu "Rahmat" degani.'),

  -- 3. Pinyin to Chinese - Pinyin ko'rsatiladi, xitoy belgisi tanlanadi
  (NULL, 'pinyin_to_chinese', 'nǐ hǎo', '你好',
   '["你好", "再见", "谢谢", "学习"]'::jsonb, NULL, 1,
   '"你好" - "nǐ hǎo" deb o''qiladi. "Salom" degani.'),

  -- 4. Chinese to Pinyin - Xitoy belgisi ko'rsatiladi, pinyin tanlanadi
  (NULL, 'chinese_to_pinyin', '谢谢', 'xièxie',
   '["xièxie", "nǐ hǎo", "zàijiàn", "xuéxí"]'::jsonb, NULL, 1,
   '"谢谢" - "xièxie" deb o''qiladi. Ikkalasi ham to''rtinchi ohangda.'),

  -- 5. Audio to Character - Audio tinglang, belgini tanlang
  (NULL, 'audio_to_character', 'Talaffuzni tinglang va to''g''ri belgini tanlang', '你好',
   '["你好", "再见", "谢谢", "学习"]'::jsonb, NULL, 1,
   'Audio: "nǐ hǎo" - bu "你好" belgisi, "Salom" degani.'),

  -- 6. Fill in the Blank - Bo'sh joyni to''ldiring
  (NULL, 'fill_blank', '我___学生 (Men talabaman)', '是',
   '["是", "在", "有", "要"]'::jsonb, NULL, 1,
   '"是" (shì) - "hisoblanmoq/bo''lmoq" degani. To''liq gap: "我是学生" (Wǒ shì xuésheng) - Men talabaman.'),

  -- 7. Multiple Choice - Har bir savolda 4 ta variant
  (NULL, 'multiple_choice', '"老师" ning ma''nosi nima?', 'O''qituvchi',
   '["O''qituvchi", "Talaba", "Do''st", "Oila"]'::jsonb, NULL, 1,
   '"老师" (lǎoshī) - "O''qituvchi" degani.'),

  -- 8. True/False - To'g'ri/Noto'g'ri
  (NULL, 'true_false', '"你好" so''zi "Xayr" degan ma''noni bildiradi', 'Noto''g''ri',
   '["To''g''ri", "Noto''g''ri"]'::jsonb, NULL, 1,
   'Noto''g''ri! "你好" (nǐ hǎo) - "Salom" degani, "Xayr" esa "再见" (zàijiàn).'),

  -- 9. Typing - Javobni yozing
  (NULL, 'typing', '"Salom" ni xitoycha yozing', '你好', NULL, NULL, 1,
   '"你好" (nǐ hǎo) - bu "Salom" ning xitoycha ko''rinishi.'),

  -- 10. Match Pairs - Juftlarni tutashtiring
  (NULL, 'match_pairs', 'Xitoycha so''zlarni o''zbek ma''nolari bilan tutashtiring', 'matches', NULL,
   '[{"left": "你好", "right": "Salom"}, {"left": "谢谢", "right": "Rahmat"}, {"left": "再见", "right": "Xayr"}, {"left": "学生", "right": "Talaba"}]'::jsonb,
   1, 'Har bir xitoy so''zini to''g''ri o''zbek tarjimasi bilan tutashtiring.')
ON CONFLICT DO NOTHING;
