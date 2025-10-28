# 🚀 Deploy Admin Panel - Final Steps

## Step 1: Run Database Schema (5 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `aveoqedskzbbgcazpskn`

2. **Run Schema**
   - Click **SQL Editor** (left sidebar)
   - Click **+ New query**
   - Open `schema.sql` from your project
   - Copy ALL the content
   - Paste into Supabase SQL editor
   - Click **Run** (or Ctrl/Cmd + Enter)

3. **Verify Tables**
   - Click **Table Editor** (left sidebar)
   - You should see these new tables:
     - ✅ lessons
     - ✅ dialogues
     - ✅ dialogue_lines
     - ✅ grammar_points
     - ✅ quizzes
     - ✅ audio_files

## Step 2: Deploy to Server (2 minutes)

SSH into your server and pull the latest code:

```bash
ssh root@34.17.122.31

# Pull latest code
cd /var/www/lokatsiya.online
git pull origin main

# Verify admin panel exists
ls -la admin/index.html
```

## Step 3: Access Admin Panel

1. **Open in browser**: http://lokatsiya.online/admin/
2. **Login**: Password is `admin123`
3. **You'll see these new tabs**:
   - 📊 Analytics
   - 📚 Vocabulary
   - 📖 **Lessons** (NEW!)
   - 💬 **Dialogues** (NEW!)
   - 📝 **Grammar** (NEW!)
   - ❓ **Quizzes** (NEW!)
   - 👥 Users

## Step 4: Add Your First Content

### Add a Lesson
1. Click **📖 Lessons** tab
2. Fill in:
   - Title: "Greetings and Introductions"
   - HSK Level: 1
   - Lesson Number: 1
   - Status: Published
   - Description: "Learn basic Chinese greetings"
3. Click **Add Lesson**

### Add a Dialogue
1. Click **💬 Dialogues** tab
2. Select the lesson you just created
3. Title: "Meeting a Friend"
4. Click **Add Dialogue**

### Add Grammar
1. Click **📝 Grammar** tab
2. Select your lesson
3. Title: "Using 你好 (nǐ hǎo)"
4. Explanation: "你好 is the most common greeting in Chinese..."
5. Click **Add Grammar Point**

### Add a Quiz
1. Click **❓ Quizzes** tab
2. Select your lesson
3. Question: "How do you say 'hello' in Chinese?"
4. Type: Multiple Choice
5. Correct Answer: "你好"
6. Click **Add Quiz**

## Troubleshooting

### If you see "Loading..." in dropdowns:
- The schema wasn't run correctly in Supabase
- Go back to Step 1 and run the schema again

### If you get "Error" when adding content:
- Open browser console (F12)
- Check for errors
- Most likely: Row Level Security (RLS) is blocking inserts
- **Quick fix**: In Supabase, go to each table → Settings → Disable RLS (for now)

### If admin panel doesn't load:
```bash
# On server
cd /var/www/lokatsiya.online
ls -la admin/index.html

# If missing, pull again
git pull origin main
```

## What's Next?

Now you can:
1. ✅ Add lessons, dialogues, grammar, quizzes via admin panel
2. ✅ Manage vocabulary
3. ✅ View user analytics

**For audio files**, you'll need to:
1. Upload to a hosting service (Cloudflare R2, Supabase Storage, or Google Drive)
2. Get the public URL
3. Paste URL when adding dialogues or vocabulary

Need help? Just ask!
