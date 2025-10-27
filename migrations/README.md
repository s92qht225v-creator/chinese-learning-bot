# Database Migration Instructions

## Multi-Language Dialogue Support Migration

To enable multi-language support for dialogues (English, Russian, Uzbek), run the following SQL in your Supabase SQL Editor:

### Access Supabase SQL Editor:
1. Go to https://aveoqedskzbbgcazpskn.supabase.co
2. Navigate to SQL Editor
3. Copy and paste the contents of `update-dialogues-multilang.sql`
4. Click "Run"

### What this migration does:
- Adds `visible` and `display_order` columns to `dialogues` table
- Adds `translation_en`, `translation_ru`, `translation_uz` columns to `dialogue_lines` table
- Migrates existing data to new column structure
- Adds indexes for better performance
- Creates auto-update trigger for `updated_at` timestamp

### After migration:
The dialogue management system will support:
- Creating dialogues with multiple lines
- Each line having translations in English, Russian, and Uzbek
- Visibility toggle for dialogues
- Custom ordering of dialogues
- Reordering lines within dialogues

### Verification:
After running the migration, you can verify it worked by running:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'dialogue_lines';
```

You should see columns: `translation_en`, `translation_ru`, `translation_uz`
