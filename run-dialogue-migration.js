// Script to run dialogue multi-language migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const config = require('./config');

async function runMigration() {
  if (!config.supabase.url || !config.supabase.serviceKey) {
    console.error('❌ Supabase credentials not found in config');
    process.exit(1);
  }

  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceKey
  );

  console.log('🔄 Running dialogue multi-language migration...');

  const migration = fs.readFileSync('./migrations/update-dialogues-multilang.sql', 'utf8');

  try {
    // Note: Supabase JS client doesn't support raw SQL execution well
    // We'll need to run this through SQL Editor or use RPC
    console.log('\n📝 Migration SQL:');
    console.log('==================================================');
    console.log(migration);
    console.log('==================================================\n');

    console.log('⚠️  Please run this SQL in your Supabase SQL Editor:');
    console.log(`   ${config.supabase.url.replace('/rest/v1', '')}/project/default/sql`);
    console.log('\n✅ After running the SQL, the schema will be updated.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

runMigration();
