// Check current database schema
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

async function checkSchema() {
  const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

  console.log('📊 Checking current database schema...\n');

  // Check dialogues table
  const { data: dialogues, error: e1 } = await supabase
    .from('dialogues')
    .select('*')
    .limit(1);

  if (dialogues && dialogues.length > 0) {
    console.log('✅ dialogues table columns:');
    Object.keys(dialogues[0]).forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('⚠️  No data in dialogues table');
  }

  console.log('');

  // Check dialogue_lines table
  const { data: lines, error: e2 } = await supabase
    .from('dialogue_lines')
    .select('*')
    .limit(1);

  if (lines && lines.length > 0) {
    console.log('✅ dialogue_lines table columns:');
    Object.keys(lines[0]).forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('⚠️  No data in dialogue_lines table');
  }

  console.log('\n📋 Required columns for multi-language support:');
  console.log('\ndialogues table needs:');
  console.log('   - visible (BOOLEAN)');
  console.log('   - display_order (INTEGER)');
  console.log('   - updated_at (TIMESTAMP)');
  console.log('\ndialogue_lines table needs:');
  console.log('   - translation_en (TEXT)');
  console.log('   - translation_ru (TEXT)');
  console.log('   - translation_uz (TEXT)');

  console.log('\n' + '='.repeat(60));
  console.log('To add these columns, run this SQL in Supabase SQL Editor:');
  console.log('='.repeat(60));
  console.log(`
ALTER TABLE dialogues
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

ALTER TABLE dialogue_lines
ADD COLUMN IF NOT EXISTS translation_en TEXT,
ADD COLUMN IF NOT EXISTS translation_ru TEXT,
ADD COLUMN IF NOT EXISTS translation_uz TEXT;

-- Migrate existing data
UPDATE dialogue_lines
SET translation_en = english
WHERE translation_en IS NULL AND english IS NOT NULL;

UPDATE dialogue_lines
SET translation_uz = uzbek
WHERE translation_uz IS NULL AND uzbek IS NOT NULL;

UPDATE dialogue_lines
SET translation_ru = russian
WHERE translation_ru IS NULL AND russian IS NOT NULL;
  `);
}

checkSchema().catch(console.error);
