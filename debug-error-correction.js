const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

async function debugErrorCorrection() {
  console.log('🔍 Querying error_correction questions...\n');

  const { data, error } = await supabase
    .from('quiz_questions')
    .select('*')
    .eq('question_type', 'error_correction');

  if (error) {
    console.error('Error:', error);
    return;
  }

  data.forEach((question, index) => {
    console.log(`\n========== Question ${index + 1} (ID: ${question.id}) ==========`);
    console.log('Question Text:', question.question);
    console.log('\nOptions (raw):', question.options);
    console.log('Options (parsed):', JSON.parse(question.options));
    console.log('\nCorrect Answer:', question.correct_answer);
    console.log('\nAcceptable Answers (raw):', question.acceptable_answers);

    if (question.acceptable_answers) {
      try {
        const parsed = JSON.parse(question.acceptable_answers);
        console.log('Acceptable Answers (parsed):');
        console.log('  - Error Index:', parsed.errorIndex);
        console.log('  - Incorrect Sentence:', parsed.incorrectSentence);
        console.log('  - Correct Sentence:', parsed.correctSentence);
      } catch (e) {
        console.log('Failed to parse acceptable_answers');
      }
    }
  });
}

debugErrorCorrection().then(() => process.exit(0));
