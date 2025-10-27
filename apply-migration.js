// Apply database migration using Supabase SQL
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');
const https = require('https');

async function applyMigration() {
  console.log('🔄 Applying database migration for multi-language dialogue support...\n');

  if (!config.supabase.url || !config.supabase.serviceKey) {
    console.error('❌ Supabase credentials not found');
    process.exit(1);
  }

  const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

  try {
    // Step 1: Add columns to dialogues table
    console.log('📝 Step 1: Adding columns to dialogues table...');
    const { error: e1 } = await supabase.rpc('exec_sql', {
      query: `ALTER TABLE dialogues
        ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`
    }).catch(() => ({ error: 'RPC not available, need manual migration' }));

    if (e1) {
      console.log('⚠️  RPC method not available. Running direct SQL queries...\n');

      // Try direct table updates
      console.log('📝 Checking current schema...');
      const { data: dialogues } = await supabase.from('dialogues').select('*').limit(1);
      console.log('   Current dialogue columns:', dialogues ? Object.keys(dialogues[0] || {}) : 'No data');

      const { data: lines } = await supabase.from('dialogue_lines').select('*').limit(1);
      console.log('   Current dialogue_lines columns:', lines ? Object.keys(lines[0] || {}) : 'No data');

      console.log('\n⚠️  Manual migration required!');
      console.log('   Please run the SQL from: migrations/update-dialogues-multilang.sql');
      console.log('   in your Supabase SQL Editor at:');
      console.log(`   ${config.supabase.url.replace('/rest/v1', '')}/project/default/sql\n`);

      console.log('📋 Migration SQL Preview:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      const fs = require('fs');
      const sql = fs.readFileSync('./migrations/update-dialogues-multilang.sql', 'utf8');
      console.log(sql.substring(0, 500) + '...\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      return;
    }

    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n⚠️  Please run migration manually in Supabase SQL Editor');
  }
}

applyMigration();
