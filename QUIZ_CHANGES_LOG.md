# Quiz System Changes Documentation

## Overview
This document tracks all changes made to the quiz admin panel and quiz functionality to prevent regressions and maintain a clear history of fixes.

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

### 2025-01-31: Fix Image Display Issues
- **Commit**: 0c53990
- **Files**:
  - `public/admin/admin-questions-list.html` (line 268)
  - `public/admin/admin-quiz-creator.html` (lines 699-701)
- **Changes**:
  - Strip `[image: URL]` tags from question cards in list view, replace with 🖼️ icon
  - Fix image preview cropping by changing from fixed `w-48 h-48` to `max-w-md` with `h-auto`
  - Changed `object-cover` to natural sizing so full image shows without cropping
- **Why**:
  - Question cards showed full image URL making text unreadable
  - Image preview container cropped images instead of showing full image
- **Testing**:
  - View questions list - image association should show "Question text 🖼️" not full URL
  - Edit image association question - preview should show full uncropped image

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
