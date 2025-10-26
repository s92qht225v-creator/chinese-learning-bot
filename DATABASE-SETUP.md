# Database Setup Instructions

## Step 1: Run the Schema in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Copy the entire contents of `schema.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl/Cmd + Enter`

## Step 2: Verify Tables Were Created

Go to **Table Editor** in Supabase and verify these tables exist:
- ✅ lessons
- ✅ dialogues
- ✅ dialogue_lines
- ✅ grammar_points
- ✅ quizzes
- ✅ audio_files
- ✅ vocabulary (should already exist with new `audio_url` column)

## Step 3: Set Up Row Level Security (Optional but Recommended)

```sql
-- Allow public read access to lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON lessons FOR SELECT USING (status = 'published');
CREATE POLICY "Allow authenticated insert/update/delete" ON lessons FOR ALL USING (auth.role() = 'authenticated');

-- Repeat for other tables as needed
```

## Step 4: Test Admin Panel

After running the schema:
1. Go to http://lingo.uz/admin/
2. You'll see new tabs: Lessons, Dialogues, Grammar, Quizzes
3. Start adding content!

## Database Structure

### Lessons
- Main container for each lesson
- Links to dialogues, grammar, and quizzes

### Dialogues
- Conversation scenarios
- Contains multiple dialogue_lines

### Dialogue Lines
- Individual sentences in a dialogue
- Chinese, Pinyin, English translations
- Optional audio URL

### Grammar Points
- Grammar explanations for lessons
- Examples stored as JSON

### Quizzes
- Practice questions
- Multiple choice, fill-in-blank, matching
- Correct answer and explanation

### Audio Files
- Metadata for audio files
- Links to actual audio URLs (S3, Cloudflare R2, etc.)
