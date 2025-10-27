// Execute migration using Supabase RPC
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

async function executeMigration() {
  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey
  );

  console.log('🔄 Executing migration...\n');

  // Run each step separately
  const steps = [
    {
      name: 'Add columns to dialogues',
      sql: `ALTER TABLE dialogues
        ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`
    },
    {
      name: 'Add translation columns to dialogue_lines',
      sql: `ALTER TABLE dialogue_lines
        ADD COLUMN IF NOT EXISTS translation_en TEXT,
        ADD COLUMN IF NOT EXISTS translation_ru TEXT,
        ADD COLUMN IF NOT EXISTS translation_uz TEXT`
    },
    {
      name: 'Migrate english to translation_en',
      sql: `UPDATE dialogue_lines
        SET translation_en = english
        WHERE translation_en IS NULL AND english IS NOT NULL`
    },
    {
      name: 'Migrate uzbek to translation_uz',
      sql: `UPDATE dialogue_lines
        SET translation_uz = uzbek
        WHERE translation_uz IS NULL AND uzbek IS NOT NULL`
    },
    {
      name: 'Migrate russian to translation_ru',
      sql: `UPDATE dialogue_lines
        SET translation_ru = russian
        WHERE translation_ru IS NULL AND russian IS NOT NULL`
    }
  ];

  for (const step of steps) {
    try {
      console.log(`  ▶ ${step.name}...`);
      // Note: This requires a custom RPC function in Supabase
      // For now, print instructions
      console.log(`    SQL: ${step.sql.substring(0, 60)}...`);
    } catch (error) {
      console.error(`    ❌ Error:`, error.message);
    }
  }

  console.log('\n📌 Migration steps prepared.');
  console.log('⚠️  These need to be run in Supabase SQL Editor manually.');
  console.log('   Or use the migration file: migrations/update-dialogues-multilang.sql\n');
}

executeMigration();
