-- Sample dialogue data with multi-language support
-- Run this after the schema migration

-- Dialogue 1
INSERT INTO dialogues (title, visible, display_order, created_at, updated_at)
VALUES ('Daily Conversation - At the Store', true, 1, NOW(), NOW())
RETURNING id;

-- Get the dialogue ID (in practice, you'd use the returned ID from above)
-- For this example, assuming dialogue_id = 1

INSERT INTO dialogue_lines (dialogue_id, chinese, pinyin, translation_en, translation_ru, translation_uz, line_order, created_at) VALUES
(1, '这块手表是你的吗？', 'Zhè kuài shǒubiǎo shì nǐ de ma?',
 'Is this watch yours?',
 'Это твои часы?',
 'Bu soat sizniki-mi?', 1, NOW()),
(1, '不是我的。是我爸爸的。', 'Búshì wǒ de. Shì wǒ bàba de.',
 'It''s not mine. It''s my dad''s.',
 'Это не мои. Это часы моего папы.',
 'Bu meniki emas. Bu dadamniki.', 2, NOW());

-- Dialogue 2
INSERT INTO dialogues (title, visible, display_order, created_at, updated_at)
VALUES ('Greetings - Meeting a Friend', true, 2, NOW(), NOW());

INSERT INTO dialogue_lines (dialogue_id, chinese, pinyin, translation_en, translation_ru, translation_uz, line_order, created_at) VALUES
(2, '你好！最近怎么样？', 'Nǐ hǎo! Zuìjìn zěnmeyàng?',
 'Hello! How have you been recently?',
 'Привет! Как дела в последнее время?',
 'Salom! Yaqinda qanday?', 1, NOW()),
(2, '很好，谢谢。你呢？', 'Hěn hǎo, xièxie. Nǐ ne?',
 'Very good, thank you. And you?',
 'Очень хорошо, спасибо. А ты?',
 'Juda yaxshi, rahmat. Sen-chi?', 2, NOW());

-- Dialogue 3
INSERT INTO dialogues (title, visible, display_order, created_at, updated_at)
VALUES ('Shopping - Asking for Price', true, 3, NOW(), NOW());

INSERT INTO dialogue_lines (dialogue_id, chinese, pinyin, translation_en, translation_ru, translation_uz, line_order, created_at) VALUES
(3, '这个多少钱？', 'Zhège duōshao qián?',
 'How much is this?',
 'Сколько это стоит?',
 'Bu qancha turadi?', 1, NOW()),
(3, '五十元。', 'Wǔshí yuán.',
 'Fifty yuan.',
 'Пятьдесят юаней.',
 'Ellik yuan.', 2, NOW()),
(3, '太贵了。', 'Tài guì le.',
 'Too expensive.',
 'Слишком дорого.',
 'Juda qimmat.', 3, NOW()),
(3, '可以便宜一点吗？', 'Kěyǐ piányi yīdiǎn ma?',
 'Can you make it cheaper?',
 'Можете сделать дешевле?',
 'Arzonroq qilsangiz bo''ladimi?', 4, NOW());
