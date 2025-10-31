# Quiz System Changes Documentation

## Overview
This document tracks all changes made to the quiz admin panel and quiz functionality to prevent regressions and maintain a clear history of fixes.

**📋 IMPORTANT**: See [QUIZ_CODE_SNAPSHOTS.md](./QUIZ_CODE_SNAPSHOTS.md) for actual working code snippets of all critical functions.

---

## ✅ Production Status Summary (2025-01-31)

**All features working on production**: https://lokatsiya.online/admin/

| Feature | Status | Tested |
|---------|--------|--------|
| Edit questions (all types) | ✅ Working | ✅ Yes |
| Audio upload & preview | ✅ Working | ✅ Yes |
| Image upload & preview | ✅ Working | ✅ Yes |
| True/false edit support | ✅ Working | ✅ Yes |
| Question cards display | ✅ Working | ✅ Yes |
| Quiz page image display | ✅ Working | ✅ Yes |
| HSK level conversion | ✅ Working | ✅ Yes |

**Latest Working Commits:**
- Image display fixes: 0c53990, 8e631e4
- True/false edit: 69fff12
- Audio preview: b23dbff
- Edit functionality: 4f54c9a

---

## Current Working State (as of 2025-01-31)

### ✅ WORKING FEATURES

#### 1. **Edit Functionality**
- **Location**: `public/admin/admin-quiz-creator.html`
- **What works**:
  - Clicking Edit button in questions list loads the question data into the form
  - All question types can be edited
  - Save button changes to "Update Question" when editing
  - Updates are sent via PUT request to `/api/admin/quizzes/{id}`
- **Key functions**:
  - `loadQuestionForEdit()` - Lines 1646-1845
  - `saveQuestion()` - Lines 1430-1508 (handles both create and update)
- **How it works**:
  - URL parameter `?edit=ID` triggers edit mode
  - Fetches question from API and populates form fields
  - Extracts audio/image URLs from question text using regex
  - Sets form values after 500ms timeout to allow form rendering

#### 2. **Audio Upload & Display**
- **Location**: `public/admin/admin-quiz-creator.html`
- **What works**:
  - Audio files upload to Supabase `quiz-audio` bucket
  - Audio URL is saved in question text as `[audio: URL]`
  - When editing, audio preview shows with player and URL display
- **Key functions**:
  - `handleAudioUpload()` - Lines 342-366
  - Audio preview display - Lines 1796-1808
- **Form changes**:
  - Added audio preview section (lines 503-509)
  - Shows current audio with player when editing
  - File input allows replacing existing audio

#### 3. **Image Upload & Display**
- **Location**:
  - Admin: `public/admin/admin-quiz-creator.html`
  - Quiz page: `public/quiz.html`
- **What works**:
  - Image files upload to Supabase `quiz-images` bucket
  - Image URL is saved in question text as `[image: URL]`
  - When editing, image preview shows
  - Quiz page displays images for image_association questions
- **Key functions**:
  - `handleImageUpload()` - Lines 368-412 (admin-quiz-creator.html)
  - Image extraction in quiz - Lines 252-257 (quiz.html)
  - Image display in quiz - Lines 138-140, 273-282 (quiz.html)
- **How it works**:
  - Image URL extracted from `[image: URL]` tag in question text
  - Displayed in quiz card above options
  - Preview shows during edit

#### 4. **Data Saving Format**
- **Question text format**: Composite string with metadata
  - Base format: `"Question text"`
  - With Chinese: `"Question text - 中文文本"`
  - With audio: `"Question text [audio: URL]"`
  - With image: `"Question text [image: URL]"`
  - Combined: `"Question text - 中文 [audio: URL] [image: URL]"`
- **Key save logic**: Lines 1520-1567 in `collectCompleteFormData()`

#### 5. **HSK Level Handling**
- **Fixed issue**: HSK level must be integer (1-6), not string ("HSK1")
- **Location**: Lines 1506-1507
- **Code**: `const hskLevelNumber = parseInt(hskLevel.replace('HSK', ''));`

---

## Known Issues & Limitations

### ⚠️ Current Limitations

1. **Field Availability by Question Type**
   - Not all question types have all fields (chineseText, audioUrl, etc.)
   - Edit loader handles missing fields gracefully with existence checks
   - Example: `image_association` has no `chineseText` field

2. **Timing Dependencies**
   - Edit loader uses 500ms setTimeout to wait for form rendering
   - This is necessary because forms are dynamically generated
   - Location: Line 1730

3. **Data Format Constraints**
   - Audio/image URLs stored in question text, not separate columns
   - Regex extraction required: `/\[audio:\s*(.+?)\]/` and `/\[image:\s*(.+?)\]/`
   - Order matters: audio/image extracted before Chinese text

---

## Critical Code Sections - DO NOT MODIFY WITHOUT REVIEW

### 1. **Edit Loading Function** (Lines 1646-1845)
```javascript
async function loadQuestionForEdit()
```
**Why critical**: This function handles loading all question data for editing. Breaking it means no editing works.

**Key parts**:
- URL parameter parsing
- API fetch with admin auth
- Question type selection: `selectQuestionType(question.question_type)`
- Field population with 500ms timeout
- Regex extraction for audio/image URLs
- Options handling (array vs object format)

### 2. **Save Function** (Lines 1430-1508)
```javascript
async function saveQuestion()
```
**Why critical**: Handles both CREATE and UPDATE operations based on edit-id attribute.

**Key parts**:
- Edit ID check: `const editId = saveBtn?.getAttribute('data-edit-id')`
- Conditional API endpoint: POST for create, PUT for update
- HSK level conversion to integer

### 3. **Data Collection Function** (Lines 1510-1626)
```javascript
function collectCompleteFormData()
```
**Why critical**: Assembles all form data into database format. Wrong format = save fails.

**Key parts**:
- HSK level integer conversion (line 1507)
- Question text composition with metadata tags
- Options serialization to JSON
- Type-specific field handling (switch statement starting line 1519)

### 4. **Audio/Image URL Extraction** (Quiz page: quiz.html)
- Lines 245-257: Regex extraction in quiz.html
- Must match save format exactly: `[audio: URL]` and `[image: URL]`

---

## File Upload Flow

### Audio Upload
1. User selects file via `<input type="file" id="audioFileInput">`
2. `handleAudioUpload()` called (line 342)
3. FormData created with audio file
4. POST to `/api/admin/upload-audio` with admin password header
5. Backend uploads to Supabase `quiz-audio` bucket
6. Returns public URL
7. URL set in hidden `audioUrl` field
8. On save, URL appended to question text as `[audio: URL]`

### Image Upload
1. User selects file via `<input type="file" id="imageFileInput">`
2. `handleImageUpload()` called (line 368)
3. FormData created with image file
4. POST to `/api/admin/upload-image` with admin password header
5. Backend uploads to Supabase `quiz-images` bucket
6. Returns public URL
7. URL set in hidden `imageUrl` field
8. Preview image displayed
9. On save, URL appended to question text as `[image: URL]`

---

## Testing Checklist

Before deploying changes, test:

- [ ] Create new multiple choice question
- [ ] Create new image association question
- [ ] Upload audio file to multiple choice
- [ ] Upload image file to image association
- [ ] Edit existing question with audio - verify audio preview shows
- [ ] Edit existing question with image - verify image preview shows
- [ ] Edit options and save - verify update works
- [ ] Check quiz page displays images correctly
- [ ] Check quiz page plays audio correctly
- [ ] Verify HSK level saves as integer

---

## Deployment Process

1. **Local changes**: Edit files in `/Users/ali/chinese-learning-bot/`
2. **Commit**: `git add . && git commit -m "message"`
3. **Push**: `git push origin main`
4. **Deploy**: `ssh root@34.17.122.31 "cd /var/www/chinese-learning-bot && git pull origin main"`
5. **Restart** (if needed): `ssh root@34.17.122.31 "cd /var/www/chinese-learning-bot && pm2 restart chinese-learning-bot"`

**Production URL**: https://lokatsiya.online/admin/

---

## Recent Changes History

### 2025-01-31: Improve Question Tag Display on Student Quiz Page
- **Commit**: 7a9d4a6
- **Files**: `public/quiz.html`
- **Changes**:
  - Improved regex patterns for tag extraction using `[^\]]*` and `[^\]]+` patterns
  - More robust handling of multi-line content within tags
  - Fixed transcript tag removal for audio_comprehension (lines 263-265)
  - Fixed compQuestion extraction and display (lines 267-278)
  - Fixed sentence extraction and display for grammar_choice (lines 280-291)
  - Added passage tag removal for cloze_test (line 293-294)
- **Why**: Previous regex patterns `.+?` were too greedy and could fail with special characters or newlines. Improved patterns handle edge cases better.
- **Known Issue**: Cloze test question rendering on quiz page not yet implemented (only shows question text, needs input fields for blanks and answer validation logic)
- **Testing**:
  - Audio comprehension should not show transcript tags
  - Grammar choice should show sentence with gap
  - Cloze test should not show passage tags (but won't have input fields yet)

### 2025-01-31: Fix Audio Comprehension Question Type
- **Commits**: 76fe081, a6a5352, 23318c3, 16a8032, 9a2740d
- **Files**: `public/admin/admin-quiz-creator.html`, `public/admin/admin-questions-list.html`, `public/quiz.html`
- **Changes**:
  - **Save**: Separated audio_comprehension from multiple_choice grouping (lines 1735-1767)
    - Collects questionText, audioUrl, transcript (optional), and comprehensionQuestion
    - Validates required fields (transcript is now optional)
    - Stores with tags: `Question [audio: url] [transcript: text] [compQuestion: text]`
    - Only includes `[transcript:]` tag if transcript is not empty
    - Collects 4 options (A, B, C, D) and correct answer
  - **Edit**: Added audio_comprehension handler in edit loader (lines 2214-2282)
    - Extracts audio URL using regex `/\[audio:\s*([^\]]+)\]/`
    - Extracts transcript using regex `/\[transcript:\s*(.+?)\]\s*\[compQuestion:/` (handles optional transcript)
    - Extracts comprehension question using regex `/\[compQuestion:\s*(.+?)\]$/`
    - Improved tag removal to prevent transcript bleeding into Question Text field
    - Loads all fields including options and checks correct radio button
  - **Upload**: Added audio file upload to form (lines 949-962)
    - File input with Supabase upload support
    - Shows current audio preview when editing
    - Same upload functionality as Multiple Choice questions
  - **Preview**: Separated audio_comprehension preview rendering (lines 1357-1400)
    - Shows audio icon with headphones graphic
    - Displays transcript in gray box with "shown after answer" note
    - Shows comprehension question in blue highlighted box
    - Shows all 4 answer options with correct answer marked
  - **Card Display**: Clean display in question cards (admin-questions-list.html lines 269-276)
    - Strips `[transcript: ...]` tag completely
    - Extracts and shows `[compQuestion: ...]` as: `Question → Comp Question`
    - Truncates comp question to 60 chars if needed
  - **Quiz Display**: Clean display on student quiz page (quiz.html lines 263-277)
    - Strips `[transcript:]` tag from display (transcript shown after answer)
    - Extracts and displays `[compQuestion:]` as part of the question
    - Format: `Question - Comprehension Question`
    - Students see clean question with audio player
- **Why**: Audio comprehension was grouped with multiple_choice but has extra fields (transcript, comprehensionQuestion) that weren't being saved. Form had these fields but they were ignored during save. Preview wasn't showing transcript/comp question, and card showed raw tags. Transcript was bleeding into Question Text field when editing. Student quiz page was showing raw tags.
- **Testing**:
  - Create audio comprehension with all fields - all should save
  - Create audio comprehension without transcript (optional) - should save without error
  - Edit audio comprehension - all fields should populate correctly in their respective fields (no bleeding)
  - Question Text field should only show the question, not transcript
  - Audio URL, transcript, and comprehension question should be preserved
  - Preview shows audio icon, transcript (if present), comp question, and options
  - Question cards show clean format with → arrow, not raw tags
  - Student quiz page shows clean question with comprehension question, no raw tags

### 2025-01-31: Fix Cloze Test Question Type
- **Commits**: 569834e, e4c3f82
- **Files**: `public/admin/admin-quiz-creator.html`, `public/admin/admin-questions-list.html`
- **Changes**:
  - **Save**: Added cloze_test case in collectCompleteFormData() (lines 1706-1739)
    - Collects questionText and passage text
    - Dynamically collects all blank answers (blank_1_answer, blank_2_answer, etc.)
    - Stores passage with `[passage: text]` tag in question field
    - Stores blanks as JSON array in options field with structure: `[{blank_num: 1, correct: "answer", acceptable: ["alt1", "alt2"]}, ...]`
    - Sets first blank's correct answer as primary correct_answer
  - **Edit**: Added cloze_test handler in edit loader (lines 2065-2106)
    - Extracts passage using regex `/\[passage:\s*(.+?)\]$/`
    - Loads all blank answers into their respective input fields
    - Loads acceptable alternatives (comma-separated)
  - **Preview**: Added cloze_test rendering (lines 1447-1482)
    - Displays passage with highlighted blank indicators (replaces ___ with styled span)
    - Shows correct answer for each blank in green boxes
    - Shows acceptable alternatives if provided
  - **Preview Data**: Added cloze_test data collection (lines 1164-1187)
    - Collects passage and all blank data for preview modal
  - **Card Display**: Clean display in question cards (admin-questions-list.html lines 275-281)
    - Extract passage text from `[passage: ...]` format
    - Display as `Question → Passage preview` (truncated to 50 chars)
    - Similar to grammar_choice sentence display format
- **Why**: Cloze test had no save handler, so passage and blank answers weren't being saved to database. Preview also wasn't working. Passage tag was showing in question cards.
- **Testing**:
  - Create cloze test with passage and 3 blanks - all should save
  - Edit cloze test - passage and all blanks should populate
  - Preview should show passage with blanks highlighted and answers listed
  - Acceptable alternatives should display correctly
  - Question cards should show clean format with → arrow, not raw `[passage: ...]` tag

### 2025-01-31: Fix Grammar Choice Question Type
- **Commits**: 2ceffe8, ef74219, e1b3ee7, 69121cd
- **Files**: `public/admin/admin-quiz-creator.html`, `public/admin/admin-questions-list.html`, `public/quiz.html`
- **Changes**:
  - **Save**: Separated grammar_choice from multiple_choice grouping in save logic (lines 1587-1611)
  - **Edit**: Added grammar_choice specific handler in edit loader (lines 1924-1970)
  - **Preview**: Separated grammar_choice preview rendering (lines 1319-1347)
  - **Preview Data**: Collect sentenceText field (lines 1123-1125)
  - Saves both questionText and sentenceText in format: `Question [sentence: Sentence with gap]`
  - Extracts sentence using regex `/\[sentence:\s*(.+?)\]/` when editing
  - Only uses 3 options (A, B, C) instead of 4 for grammar questions
  - Preview shows sentence in blue box and skips empty 4th option
  - Clean display in question cards: `Question → Sentence` instead of showing `[sentence: ...]` tag
  - **Quiz Display**: Clean display on student quiz page (quiz.html lines 279-290)
    - Extracts and displays `[sentence:]` as part of the question
    - Format: `Question - Sentence with gap`
    - Students see the sentence they need to fill
- **Why**: Grammar choice was grouped with multiple choice, so sentenceText field wasn't saved/loaded, tags showed in cards, and preview showed 4 options with empty D. Student quiz page was showing raw [sentence: ...] tag.
- **Testing**:
  - Create grammar choice with sentence - both fields should save
  - Edit grammar choice - sentence field should populate
  - Preview shows sentence prominently with only 3 options
  - Question card shows clean format with → arrow
  - Student quiz page shows clean question with sentence, no raw tags

### 2025-01-31: Fix Question Overwrite Bug
- **Commits**: 778c0fe
- **Files**: `public/admin/admin-quiz-creator.html`
- **Changes**:
  - Clear data-edit-id attribute after successful create (lines 1505-1509)
  - Reset button text to "Save Question"
  - Add console logging to track edit state (lines 1443-1446)
- **Why**: After creating a question and choosing "Create another?", the edit-id might persist causing second question to overwrite first
- **Testing**: Create two questions in a row - should create 2 separate questions, not overwrite

### 2025-01-31: Fix Image Display Issues
- **Commits**: 0c53990, 8e631e4
- **Files**:
  - `public/admin/admin-questions-list.html` (line 268)
  - `public/admin/admin-quiz-creator.html` (lines 699-701, 1822-1828)
- **Changes**:
  - Strip `[image: URL]` tags from question cards in list view, replace with 🖼️ icon
  - Fix image preview cropping by changing from fixed `w-48 h-48` to `max-w-md` with `h-auto`
  - Changed `object-cover` to natural sizing so full image shows without cropping
  - Hide "No image" placeholder text when image is displayed in edit mode
- **Why**:
  - Question cards showed full image URL making text unreadable
  - Image preview container cropped images instead of showing full image
  - Placeholder text was overlapping the image preview
- **Testing**:
  - View questions list - image association should show "Question text 🖼️" not full URL
  - Edit image association question - preview should show full uncropped image without "No image" text

### 2025-01-31: True/False Edit Support
- **Commit**: 69fff12
- **Files**: `public/admin/admin-quiz-creator.html`
- **Changes**:
  - Added true/false data loading in edit mode (lines 1883-1906)
  - Sets statement field from question.question
  - Checks correct radio button (true/false) based on correct_answer
- **Why**: True/false questions showed empty form when editing - missing type-specific handler
- **Testing**: Edit a true/false question - statement and correct answer radio should be populated

### 2025-01-31: Audio Preview in Edit Mode
- **Commit**: b23dbff
- **Files**: `public/admin/admin-quiz-creator.html`
- **Changes**:
  - Added audio preview section to multiple choice form (lines 503-509)
  - Show current audio with player when editing (lines 1796-1808)
  - Display audio URL below player
- **Why**: Users couldn't see existing audio when editing, only "no file selected"

### 2025-01-31: Image Display in Quiz Page
- **Commit**: 4f54c9a
- **Files**: `public/quiz.html`, `public/admin/admin-quiz-creator.html`
- **Changes**:
  - Extract image URL from question text in quiz page
  - Display image in quiz card (lines 138-140, 273-282 in quiz.html)
  - Save imageUrl in admin creator (line 1551, 1564)
- **Why**: Image association questions didn't show images on quiz page

### 2025-01-31: Restore Edit Functionality
- **Commit**: 4f54c9a
- **Files**: `public/admin/admin-quiz-creator.html`
- **Changes**:
  - Added `loadQuestionForEdit()` function (lines 1646-1845)
  - Integrated edit logic into `saveQuestion()` (lines 1430-1508)
  - Added DOMContentLoaded handler with readyState check
- **Why**: Edit button redirected to creator but didn't load question data. Was lost when file was restored from old commit.

### 2025-01-31: HSK Level Fix
- **Commit**: 029039f
- **Files**: `public/admin/admin-quiz-creator.html`
- **Changes**:
  - Convert "HSK1" string to integer 1 before saving (lines 1506-1507)
- **Why**: Database expects integer but form sends string, causing 500 error

---

## Common Pitfalls to Avoid

1. **Don't remove the 500ms setTimeout** in loadQuestionForEdit - forms need time to render
2. **Don't change the regex patterns** for audio/image extraction without updating both save and load code
3. **Don't restore files from old commits** without checking if features will be lost
4. **Always test on production** (lokatsiya.online) not just localhost
5. **Don't assume fields exist** - always check with `getElementById()` before setting values
6. **Don't forget to deploy** - local changes don't automatically go to production server

---

## Contact & Support

- **Production Server**: root@34.17.122.31
- **Project Path**: /var/www/chinese-learning-bot
- **PM2 Process**: chinese-learning-bot
- **Database**: PostgreSQL with JSONB columns for options
- **Storage**: Supabase buckets (quiz-audio, quiz-images)

---

*Last Updated: 2025-01-31*
*Maintainer: Development Team*
