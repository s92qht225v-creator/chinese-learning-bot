# Quiz System Migration Guide

## Overview
This guide documents the migration from the old `quizzes` table to the new `quiz_questions` table structure.

## What Changed

### Database Schema
**Old table:** `quizzes`
- Simple structure
- Integer `hsk_level` (1-6)
- Integer `difficulty` (1-5)

**New table:** `quiz_questions`
- Comprehensive structure supporting 12 question types
- String `hsk_level` ('HSK1', 'HSK2', etc.)
- String `difficulty` ('easy', 'medium', 'hard')
- Additional fields: `chinese_text`, `pinyin`, `hints`, `acceptable_answers`, `status`, `times_shown`, etc.

### Code Changes
1. **database.js** - Updated all quiz functions to use `quiz_questions` table
2. **bot.js** - Admin API endpoints already use database.js functions (no changes needed)
3. **Frontend** - Admin panel uses API endpoints (works automatically)

## Migration Steps

### 1. Run the Migration SQL
```bash
# In Supabase SQL Editor, run:
/Users/ali/chinese-learning-bot/migrations/fix-quiz-questions-schema.sql
```

This migration will:
- ✅ Backup existing `quiz_questions` data to `quiz_questions_backup`
- ✅ Drop the incorrectly structured `quiz_questions` table
- ✅ Create new `quiz_questions` table with correct schema
- ✅ Migrate all data from old `quizzes` table to new `quiz_questions` table
- ✅ Set up proper indexes and triggers

### 2. Verify Migration
Run these queries in Supabase SQL Editor:

```sql
-- Check row counts
SELECT 'Old quizzes table' as source, COUNT(*) as count FROM quizzes
UNION ALL
SELECT 'New quiz_questions table' as source, COUNT(*) as count FROM quiz_questions;

-- Sample migrated data
SELECT id, question_type, hsk_level, question, correct_answer 
FROM quiz_questions 
LIMIT 5;

-- Check column structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quiz_questions' 
ORDER BY ordinal_position;
```

### 3. Deploy Code Changes
```bash
# On your server
cd /Users/ali/chinese-learning-bot
git pull  # or copy updated files
pm2 restart chinese-learning-bot
```

### 4. Test Quiz Functionality
- ✅ Admin panel quiz management (via iframe)
- ✅ Quiz API endpoints (`/api/admin/quizzes`)
- ✅ Frontend quiz display

## Rollback Plan

If something goes wrong, you can restore from backup:

```sql
-- Rollback: restore old table
DROP TABLE IF EXISTS quiz_questions;
ALTER TABLE quiz_questions_backup RENAME TO quiz_questions;

-- Restore code
git checkout HEAD~1 database.js
pm2 restart chinese-learning-bot
```

## New Quiz System Features

### 7 New Tables (from complete-quiz-system.sql)
1. ✅ **quiz_questions** - Main quiz table (fixed with this migration)
2. ✅ **quiz_attempts** - Track user quiz sessions
3. ✅ **user_answers** - Individual question responses
4. ✅ **user_progress** - XP, levels, streaks
5. ✅ **user_flashcards** - Spaced repetition
6. ✅ **achievements** - Pre-seeded achievements
7. ✅ **user_achievements** - User achievement tracking

### Storage Buckets (Still TODO)
- ❌ **quiz-audio** - Not created yet
- ❌ **quiz-images** - Not created yet

To create buckets, run storage bucket SQL from `complete-quiz-system.sql` (lines 349-392).

## Column Mapping

| Old `quizzes`     | New `quiz_questions` | Notes                    |
|-------------------|----------------------|--------------------------|
| question_type     | question_type        | ✅ Same                  |
| hsk_level (int)   | hsk_level (string)   | Converted: 1 → 'HSK1'    |
| difficulty (int)  | difficulty (string)  | Converted: 1-2 → 'easy'  |
| question          | question             | ✅ Same                  |
| correct_answer    | correct_answer       | ✅ Same                  |
| options (JSONB)   | options (JSONB)      | ✅ Same                  |
| explanation       | explanation          | ✅ Same                  |
| audio_url         | audio_url            | ✅ Same                  |
| lesson_id         | lesson_id            | ✅ Same                  |
| N/A               | chinese_text         | ➕ New field            |
| N/A               | pinyin               | ➕ New field            |
| N/A               | image_url            | ➕ New field            |
| N/A               | acceptable_answers   | ➕ New field (JSONB)    |
| N/A               | hints                | ➕ New field (JSONB)    |
| N/A               | status               | ➕ New field            |
| N/A               | times_shown          | ➕ New field            |
| N/A               | times_correct        | ➕ New field            |
| N/A               | times_incorrect      | ➕ New field            |

## Next Steps

### After Migration Verification:
1. Drop old `quizzes` table (uncomment in `fix-quiz-questions-schema.sql`)
2. Create storage buckets for quiz audio/images
3. Update admin quiz creator to use new fields (chinese_text, pinyin, hints)
4. Implement quiz analytics using `times_shown`, `times_correct`, `times_incorrect`

### Future Enhancements:
- Implement spaced repetition with `user_flashcards`
- Add achievement system
- Track detailed user progress with `quiz_attempts` and `user_answers`
- Support 12 question types instead of just 3

## Files Modified
- ✅ `database.js` - Changed `from('quizzes')` → `from('quiz_questions')` (4 locations)
- ✅ `bot.js` - No changes needed (uses database.js)
- ✅ `public/admin/index.html` - No changes needed (uses API endpoints)

## Migration SQL Files
1. `complete-quiz-system.sql` - Full 7-table system
2. `fix-quiz-questions-schema.sql` - This migration (quiz_questions only)

## Support
If issues arise:
1. Check Supabase logs for SQL errors
2. Check server logs: `pm2 logs chinese-learning-bot`
3. Verify table structure with queries above
4. Contact admin if rollback needed
