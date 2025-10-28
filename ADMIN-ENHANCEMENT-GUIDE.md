# Admin Panel Enhancement Guide

## Quick Start

### Step 1: Set Up Database
1. Run `schema.sql` in Supabase SQL Editor (see DATABASE-SETUP.md)
2. Verify tables are created

### Step 2: Access Admin Panel
- URL: http://lokatsiya.online/admin/
- Password: admin123 (change in admin/index.html line 369)

### Step 3: Add Content Tabs

I'll add these new tabs to your admin panel:
- 📚 **Lessons** - Create and manage lessons
- 💬 **Dialogues** - Add conversation dialogues
- 📖 **Grammar** - Grammar points and explanations  
- ❓ **Quizzes** - Create practice questions
- 🔊 **Audio** - Upload and manage audio files

## What You Can Upload

### 1. Lessons
```
Title: "Greetings"
HSK Level: 1
Lesson Number: 1
Description: "Learn basic greetings"
Objectives: ["Say hello", "Say goodbye"]
Status: Published/Draft
```

### 2. Dialogues
```
Lesson: Select from dropdown
Title: "Meeting a friend"
Lines:
  - Speaker: "李明"
    Chinese: "你好!"
    Pinyin: "Nǐ hǎo!"
    English: "Hello!"
    Audio URL: (optional)
```

### 3. Grammar Points
```
Lesson: Select from dropdown
Title: "Using 是 (shì)"
Explanation: "是 is used to..."
Examples: [
  {
    chinese: "我是学生",
    pinyin: "Wǒ shì xuéshēng",
    english: "I am a student"
  }
]
```

### 4. Quizzes
```
Lesson: Select from dropdown
Question: "How do you say 'hello'?"
Type: multiple_choice
Options: ["你好", "再见", "谢谢", "对不起"]
Correct Answer: "你好"
Explanation: "你好 (nǐ hǎo) means hello"
```

### 5. Audio Files
```
For now, you'll need to:
1. Upload audio to a service (Cloudflare R2, AWS S3, or Google Drive)
2. Get the public URL
3. Paste the URL in the audio_url field
```

## Implementation Options

### Option A: I Build It For You (Recommended)
I can create the full admin interface with all these tabs. It will include:
- Forms to add/edit content
- Tables to view existing content
- Delete functionality
- Drag-and-drop ordering
- Real-time preview

**Time**: ~30 minutes
**You need to**: Just run the schema.sql first

### Option B: Manual via Supabase Dashboard
You can add content directly in Supabase:
1. Go to Table Editor
2. Click on a table (lessons, dialogues, etc.)
3. Click "Insert row"
4. Fill in the fields
5. Save

**Pros**: Works immediately
**Cons**: No validation, harder to use, no preview

### Option C: Hybrid Approach
I build the admin UI incrementally:
1. Start with Lessons tab (5 min)
2. Add Dialogues tab (10 min)
3. Add Grammar tab (5 min)
4. Add Quizzes tab (10 min)

## Audio Upload Solutions

Since you need audio, here are options:

### 1. Cloudflare R2 (Recommended - Free)
- 10 GB free storage
- Fast CDN delivery
- Easy to set up

### 2. Supabase Storage (Built-in)
- Already have it with Supabase
- 1 GB free
- Simple API

### 3. Google Drive (Quick & Free)
- Upload files
- Get shareable link
- Paste in admin

## Next Steps

**Tell me which option you prefer:**

A. "Build the full admin interface now" → I'll create everything
B. "Show me how to use Supabase directly" → I'll give you a tutorial
C. "Start with lessons only" → I'll add just the lessons tab

**Also tell me about audio:**
- Do you have audio files ready?
- Do you want me to set up Cloudflare R2 or Supabase Storage?
- Or will you use external URLs for now?
