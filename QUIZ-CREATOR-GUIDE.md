# Quiz Creator Integration Guide

## Overview
The Quiz Creator is now fully integrated into the admin panel with complete backend functionality. Admins can create sophisticated quiz questions with 12 different question types, preview them, and save them directly to the database.

## Access Points

### 1. Admin Panel Integration
**URL:** https://lokatsiya.online/admin/
1. Login with admin password (default: `admin123`)
2. Click "❓ Quizzes" tab
3. Click "✨ Open Advanced Quiz Creator" button at the top

### 2. Direct Access
**URL:** https://lokatsiya.online/admin/admin-quiz-creator.html
- Opens in new tab for focused question creation
- Same admin authentication required

## Features

### 12 Question Types Supported

1. **📝 Multiple Choice**
   - Classic A, B, C, D options
   - Include Chinese text, audio, and question text
   - Select correct answer via radio buttons

2. **✏️ Fill in the Gap**
   - Sentence with blank (use `___` to mark gap)
   - Accept multiple alternative answers
   - Include translation for context

3. **✓ True/False**
   - Simple binary choice questions
   - Clear statement with explanation

4. **🔗 Matching**
   - Match Chinese words to English meanings
   - Minimum 3 pairs, can add more
   - Auto-shuffles for students

5. **🖼️ Image Association**
   - Upload image URL
   - Chinese word options (A, B, C, D)
   - Good for visual learners

6. **📋 Sentence Ordering**
   - Students arrange words in correct order
   - Shows translation for context
   - Tests grammar understanding

7. **📖 Grammar Choice**
   - Choose correct word for grammar gap
   - Focus on grammar particles and structure

8. **🔍 Error Correction**
   - Find and correct the mistake
   - Specify error position (zero-indexed)
   - Show both incorrect and correct sentences

9. **📄 Cloze Test**
   - Multiple blanks in a passage
   - Accept alternative answers for each blank
   - Tests comprehensive understanding

10. **✍️ Dictation**
    - Audio URL required
    - Students type what they hear
    - Accept pinyin variations

11. **🎧 Audio Comprehension**
    - Audio with comprehension question
    - Multiple choice answers
    - Include transcript for review

12. **👂 Audio to Word**
    - Focus on tones and pronunciation
    - Similar-sounding options
    - Include pinyin with tone marks

## How to Use

### Step 1: Select Question Type
Click on one of the 12 question type cards. The form will dynamically update to show relevant fields.

### Step 2: Set Basic Information
- **HSK Level:** Required - Choose from HSK 1-6
- **Tags:** Optional - Comma-separated tags for organization (e.g., "grammar, verb, daily life")

### Step 3: Fill Question Content
Each question type has specific fields:
- Question text (what students see)
- Chinese text (if applicable)
- Audio URLs (upload first, then paste URL)
- Options/answers based on type

### Step 4: Add Explanation
Write a clear explanation that will be shown when students review their mistakes. Include:
- Why the answer is correct
- Grammar rules or vocabulary notes
- Common mistakes to avoid

### Step 5: Preview (Optional)
Click "👁️ Preview" to see exactly how students will see the question:
- Visual preview with proper formatting
- Shows correct answers highlighted
- Explanation display

### Step 6: Save
Click "💾 Save Question" button:
- Validates all required fields
- Prompts for admin password (first time only)
- Saves to Supabase database
- Shows question ID on success
- Option to create another or view all questions

## Database Schema

Questions are saved to the `quizzes` table:

```sql
{
  id: SERIAL PRIMARY KEY,
  lesson_id: INTEGER (nullable),
  question: TEXT (question text + metadata),
  question_type: VARCHAR(50),
  hsk_level: VARCHAR(10),
  options: JSONB (answer choices),
  correct_answer: TEXT,
  explanation: TEXT,
  tags: TEXT (comma-separated),
  quiz_order: INTEGER,
  created_at: TIMESTAMP
}
```

### Field Mapping by Question Type

**Multiple Choice:**
```javascript
{
  question: "What does this mean? - 手表",
  question_type: "multiple_choice",
  options: ["watch", "table", "hand", "book"],
  correct_answer: "watch"
}
```

**Fill Gap:**
```javascript
{
  question: "我 ___ 学生。(I ___ a student.)",
  question_type: "fill_gap",
  options: ["是"],  // For reference
  correct_answer: "是"
}
```

**Error Correction:**
```javascript
{
  question: "Find and correct: 他学生也是",
  question_type: "error_correction",
  options: {"errorIndex": 2, "incorrect": "他学生也是"},
  correct_answer: "他也是学生"
}
```

## API Integration

### Endpoint
```
POST /api/admin/quizzes
```

### Headers
```javascript
{
  'Content-Type': 'application/json',
  'X-Admin-Password': 'admin123'  // Stored in localStorage after first prompt
}
```

### Request Body Example
```json
{
  "question_type": "multiple_choice",
  "hsk_level": "HSK1",
  "question": "What does 你好 mean?",
  "options": "[\"Hello\", \"Goodbye\", \"Thank you\", \"Sorry\"]",
  "correct_answer": "Hello",
  "explanation": "你好 (nǐ hǎo) is the most common greeting in Chinese, meaning 'Hello'",
  "tags": "greeting, vocabulary, HSK1",
  "lesson_id": null,
  "quiz_order": 1
}
```

### Response
```json
{
  "id": 123,
  "question_type": "multiple_choice",
  "hsk_level": "HSK1",
  "question": "What does 你好 mean?",
  "options": "[\"Hello\", \"Goodbye\", \"Thank you\", \"Sorry\"]",
  "correct_answer": "Hello",
  "explanation": "你好 (nǐ hǎo) is the most common greeting...",
  "created_at": "2025-10-30T12:00:00Z"
}
```

## Best Practices

### Writing Good Questions

1. **Be Clear and Specific**
   - Avoid ambiguous wording
   - Use proper Chinese characters with pinyin
   - Include context when needed

2. **Explanations Matter**
   - Write detailed explanations
   - Include grammar rules
   - Mention common mistakes
   - Add example sentences

3. **HSK Level Appropriate**
   - Match vocabulary to HSK level
   - Consider grammar complexity
   - HSK 1: 150 words, basic grammar
   - HSK 6: 5000+ words, advanced concepts

4. **Audio Quality**
   - Use clear, native speaker audio
   - Consistent speed and tone
   - Host on reliable CDN (Cloudflare R2, Supabase Storage)

5. **Tagging Strategy**
   - Use consistent tags across questions
   - Categories: grammar, vocabulary, listening, reading, writing
   - Topics: daily life, business, travel, culture
   - Grammar points: 了, 的, 在, measure words

### Organizing Questions

**By HSK Level:**
- HSK 1-2: Basic greetings, numbers, family
- HSK 3-4: Daily life, work, travel
- HSK 5-6: Abstract concepts, idioms, literature

**By Lesson:**
- Link questions to specific lessons (lesson_id field)
- Create comprehensive quizzes per lesson
- Mix question types for variety

**By Topic:**
- Use tags to group related questions
- Create thematic quiz sets
- Easy filtering in admin panel

## Troubleshooting

### "Please fill in all required fields!"
- Check that HSK level is selected
- Verify question text is filled
- For multiple choice: ensure at least one correct answer is marked
- For fill gap: both sentence and correct answer required

### "Invalid admin password"
- Clear localStorage: `localStorage.removeItem('adminPassword')`
- Re-enter correct password (default: admin123)
- Check admin password in `/public/admin/index.html` line 1395

### Questions not appearing in app
- Verify question saved successfully (check database)
- Ensure `lesson_id` is set if filtering by lesson
- Check HSK level filtering in quiz pages

### Preview not showing correctly
- Verify all required fields are filled before previewing
- Check browser console for JavaScript errors
- Refresh page if preview modal doesn't close

## Viewing Created Questions

### Admin Questions List
**URL:** https://lokatsiya.online/admin/admin-questions-list.html

Features:
- View all created questions
- Filter by HSK level, type, or lesson
- Edit or delete questions
- Export to CSV

### In Admin Panel
1. Go to "❓ Quizzes" tab
2. Scroll down to question table
3. View basic info for all questions
4. Edit or delete from simple interface

## Future Enhancements

Potential additions:
- Bulk import from CSV/Excel
- Question difficulty rating
- Performance analytics per question
- AI-generated distractor options
- Image upload integration
- Audio recording tool
- Duplicate question detector
- Question templates

## Security Notes

- Admin password required for all operations
- Password stored in localStorage after first use
- Clear localStorage to force re-authentication
- Change default password in production:
  - `bot.js` line ~274 (backend validation)
  - `admin/index.html` line ~1395 (frontend constant)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify server logs: `ssh root@lokatsiya.online "pm2 logs chinese-learning-bot"`
3. Test with simple question type first (True/False)
4. Ensure database connection is working

## Quick Reference

### Keyboard Shortcuts
- No shortcuts currently (future enhancement)

### Character Input
- Use Chinese input method (Pinyin typing)
- Copy-paste from character map if needed
- Use Pleco or similar app for character lookup

### Audio URLs Format
```
https://your-cdn.com/audio/filename.mp3
/audio/filename.mp3  (relative to public directory)
```

### Common HSK Levels
- HSK 1: 150 words, A1 level
- HSK 2: 300 words, A2 level  
- HSK 3: 600 words, B1 level
- HSK 4: 1200 words, B2 level
- HSK 5: 2500 words, C1 level
- HSK 6: 5000+ words, C2 level

---

**Last Updated:** 2025-10-30  
**Version:** 1.0  
**Status:** ✅ Fully Integrated and Deployed
