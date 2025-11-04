const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const practiceExercises = [
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'What does "你好" mean?',
    pinyin: 'nǐ hǎo',
    options: JSON.stringify(['Hello', 'Goodbye', 'Thank you', 'Sorry']),
    correct_answer: 'Hello',
    explanation: '"你好" (nǐ hǎo) is the most common greeting in Chinese, equivalent to "Hello" in English.',
    question_type: 'multiple_choice',
    status: 'active'
  },
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'How do you say "Thank you" in Chinese?',
    pinyin: 'xiè xiè',
    options: JSON.stringify(['你好', '谢谢', '再见', '对不起']),
    correct_answer: '谢谢',
    explanation: '"谢谢" (xiè xiè) means "Thank you" and is one of the most important polite expressions in Chinese.',
    question_type: 'multiple_choice',
    status: 'active'
  },
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'What is the correct pinyin for "再见"?',
    pinyin: null,
    options: JSON.stringify(['zài jiàn', 'nǐ hǎo', 'xiè xiè', 'duì bù qǐ']),
    correct_answer: 'zài jiàn',
    explanation: '"再见" (zài jiàn) means "Goodbye". "再" means "again" and "见" means "see".',
    question_type: 'multiple_choice',
    status: 'active'
  },
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'Which character means "I" or "me"?',
    pinyin: null,
    options: JSON.stringify(['你', '我', '他', '她']),
    correct_answer: '我',
    explanation: '"我" (wǒ) means "I" or "me". It\'s one of the first characters you learn in Chinese.',
    question_type: 'multiple_choice',
    status: 'active'
  },
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'What does "不" mean in Chinese?',
    pinyin: 'bù',
    options: JSON.stringify(['Yes', 'No/Not', 'Maybe', 'Please']),
    correct_answer: 'No/Not',
    explanation: '"不" (bù) is the most common negation word in Chinese, meaning "no" or "not".',
    question_type: 'multiple_choice',
    status: 'active'
  },
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'How do you say "you" (singular) in Chinese?',
    pinyin: null,
    options: JSON.stringify(['我', '你', '他', '们']),
    correct_answer: '你',
    explanation: '"你" (nǐ) means "you" (singular). For plural "you all", add "们" to make "你们" (nǐ men).',
    question_type: 'multiple_choice',
    status: 'active'
  },
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'What does "好" mean?',
    pinyin: 'hǎo',
    options: JSON.stringify(['Bad', 'Good/Well', 'Big', 'Small']),
    correct_answer: 'Good/Well',
    explanation: '"好" (hǎo) means "good" or "well". It appears in many common expressions like "你好" (hello) and "很好" (very good).',
    question_type: 'multiple_choice',
    status: 'active'
  },
  {
    lesson_id: 3,
    hsk_level: 'HSK1',
    question: 'Which sentence means "I am a student"?',
    pinyin: null,
    options: JSON.stringify(['我是学生', '你是学生', '他是学生', '我不是学生']),
    correct_answer: '我是学生',
    explanation: '"我是学生" (wǒ shì xuéshēng) means "I am a student". "是" (shì) is the verb "to be".',
    question_type: 'multiple_choice',
    status: 'active'
  }
];

async function addPracticeExercises() {
  console.log('Adding practice exercises...\n');

  for (let i = 0; i < practiceExercises.length; i++) {
    const exercise = practiceExercises[i];
    console.log(`${i + 1}. Adding: ${exercise.question}`);

    const { data, error } = await supabase
      .from('quiz_questions')
      .insert([exercise])
      .select();

    if (error) {
      console.error(`   ❌ Error:`, error.message);
    } else {
      console.log(`   ✅ Added successfully (ID: ${data[0].id})`);
    }
  }

  console.log('\n✨ Done! Added', practiceExercises.length, 'practice exercises.');
}

addPracticeExercises();
