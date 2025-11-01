#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting quiz_questions table migration...\n');

  try {
    // Step 1: Backup existing data
    console.log('📦 Step 1: Backing up existing quiz_questions data...');
    const { error: backupError } = await supabase.rpc('exec_sql', {
      sql: 'CREATE TABLE IF NOT EXISTS quiz_questions_backup AS SELECT * FROM quiz_questions;'
    }).catch(() => null);
    
    // Alternative backup method using raw SQL
    const backupSql = `CREATE TABLE IF NOT EXISTS quiz_questions_backup AS SELECT * FROM quiz_questions;`;
    await executeRawSQL(backupSql);
    console.log('✅ Backup created\n');

    // Step 2: Drop incorrect table
    console.log('🗑️  Step 2: Dropping incorrect table structure...');
    await executeRawSQL('DROP TABLE IF EXISTS quiz_questions CASCADE;');
    console.log('✅ Old table dropped\n');

    // Step 3: Create correct schema
    console.log('🏗️  Step 3: Creating correct table schema...');
    const createTableSql = `
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  
  -- Basic Info
  question_type VARCHAR(50) NOT NULL,
  hsk_level VARCHAR(10) NOT NULL,
  difficulty VARCHAR(20) DEFAULT 'medium',
  tags TEXT,
  
  -- Question Content
  question TEXT NOT NULL,
  chinese_text TEXT,
  pinyin TEXT,
  audio_url TEXT,
  image_url TEXT,
  
  -- Answers
  correct_answer TEXT NOT NULL,
  options JSONB,
  acceptable_answers JSONB,
  
  -- Additional Info
  explanation TEXT,
  hints JSONB,
  lesson_id INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  
  -- Stats
  times_shown INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0
);
`;
    await executeRawSQL(createTableSql);
    console.log('✅ Table created\n');

    // Step 4: Create indexes
    console.log('📊 Step 4: Creating indexes...');
    await executeRawSQL('CREATE INDEX idx_quiz_questions_type ON quiz_questions(question_type);');
    await executeRawSQL('CREATE INDEX idx_quiz_questions_hsk ON quiz_questions(hsk_level);');
    await executeRawSQL('CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions(difficulty);');
    await executeRawSQL('CREATE INDEX idx_quiz_questions_lesson ON quiz_questions(lesson_id);');
    await executeRawSQL('CREATE INDEX idx_quiz_questions_status ON quiz_questions(status);');
    console.log('✅ Indexes created\n');

    // Step 5: Migrate data from old quizzes table
    console.log('📥 Step 5: Migrating data from quizzes table...');
    const migrateSql = `
INSERT INTO quiz_questions (
  question_type,
  hsk_level,
  question,
  chinese_text,
  pinyin,
  audio_url,
  correct_answer,
  options,
  explanation,
  lesson_id,
  created_at,
  difficulty
)
SELECT 
  question_type,
  COALESCE('HSK' || hsk_level, 'HSK1') as hsk_level,
  question,
  NULL as chinese_text,
  NULL as pinyin,
  audio_url,
  correct_answer,
  options,
  explanation,
  lesson_id,
  created_at,
  CASE difficulty
    WHEN 1 THEN 'easy'
    WHEN 2 THEN 'easy'
    WHEN 3 THEN 'medium'
    WHEN 4 THEN 'hard'
    WHEN 5 THEN 'hard'
    ELSE 'medium'
  END as difficulty
FROM quizzes;
`;
    const { count } = await executeRawSQL(migrateSql);
    console.log(`✅ Migrated ${count || 'all'} questions\n`);

    // Step 6: Create trigger function
    console.log('⚙️  Step 6: Creating trigger function...');
    const triggerFunctionSql = `
CREATE OR REPLACE FUNCTION update_quiz_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
`;
    await executeRawSQL(triggerFunctionSql);
    
    const triggerSql = `
DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at
    BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_quiz_updated_at();
`;
    await executeRawSQL(triggerSql);
    console.log('✅ Trigger created\n');

    // Step 7: Verify migration
    console.log('🔍 Step 7: Verifying migration...');
    const { data: testData, error: testError } = await supabase
      .from('quiz_questions')
      .select('*')
      .limit(1);

    if (testError) {
      throw new Error(`Verification failed: ${testError.message}`);
    }

    if (testData && testData.length > 0) {
      console.log('✅ Table structure verified');
      console.log('   Columns:', Object.keys(testData[0]).join(', '));
    }

    // Count records
    const { count: totalCount } = await supabase
      .from('quiz_questions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   Total records: ${totalCount || 0}\n`);

    console.log('✅ Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('   1. Test saving a quiz question in the admin panel');
    console.log('   2. If everything works, you can drop the old quizzes table');
    console.log('   3. Run: DROP TABLE IF EXISTS quizzes CASCADE;\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n💡 To rollback:');
    console.error('   DROP TABLE IF EXISTS quiz_questions;');
    console.error('   ALTER TABLE quiz_questions_backup RENAME TO quiz_questions;\n');
    process.exit(1);
  }
}

// Helper function to execute raw SQL
async function executeRawSQL(sql) {
  const { data, error, count } = await supabase.rpc('exec_sql', { sql }).catch(async () => {
    // Fallback: try direct table operations if RPC doesn't work
    // This is a workaround - Supabase client doesn't support raw DDL well
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
      // If RPC doesn't exist, we need to execute via postgres directly
      // For now, we'll use the supabase-js client's SQL execution
      throw new Error('Cannot execute raw SQL via Supabase client. Please run the SQL manually in Supabase SQL Editor.');
    }
    
    return await response.json();
  });

  if (error) throw error;
  return { data, count };
}

// Run migration
runMigration();
