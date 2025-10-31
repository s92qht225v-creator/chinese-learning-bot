# Quiz System - Working Code Snapshots

This document contains actual working code snippets for critical quiz system functions. Use this as a reference when making changes to ensure functionality isn't lost.

**Last Updated**: 2025-01-31
**Production Status**: ✅ All features working on https://lokatsiya.online/admin/

---

## Table of Contents
1. [Edit Functionality](#edit-functionality)
2. [Save Question Function](#save-question-function)
3. [Audio Upload & Preview](#audio-upload--preview)
4. [Image Upload & Preview](#image-upload--preview)
5. [True/False Question Handling](#truefalse-question-handling)
6. [Question List Display](#question-list-display)
7. [Quiz Page Image Display](#quiz-page-image-display)

---

## Edit Functionality

### Load Question for Edit Function
**File**: `public/admin/admin-quiz-creator.html` (Lines 1646-1895)

```javascript
async function loadQuestionForEdit() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');

  console.log('loadQuestionForEdit called, editId:', editId);

  if (!editId) {
    console.log('No edit ID found, not in edit mode');
    return; // Not editing, just creating new
  }

  try {
    const password = await getAdminPassword();
    if (!password) {
      alert('❌ Admin password required to edit questions');
      window.location.href = '/admin/admin-questions-list.html';
      return;
    }

    // Fetch question from API
    const response = await fetch(`/api/admin/quizzes`, {
      headers: {
        'X-Admin-Password': password
      }
    });

    if (!response.ok) throw new Error('Failed to load questions');

    const allQuestions = await response.json();
    const question = allQuestions.find(q => q.id == editId);

    if (!question) {
      alert('❌ Question not found');
      window.location.href = '/admin/admin-questions-list.html';
      return;
    }

    // Load question data into form
    console.log('Loading question for edit:', question);

    // Select question type
    selectQuestionType(question.question_type);

    // Set HSK level
    const hskLevelSelect = document.getElementById('hskLevel');
    if (hskLevelSelect) {
      hskLevelSelect.value = 'HSK' + question.hsk_level;
    }

    // Set tags
    const tagsInput = document.getElementById('tags');
    if (tagsInput && question.tags) {
      tagsInput.value = question.tags;
    }

    // Set explanation
    const explanationInput = document.getElementById('explanation');
    if (explanationInput && question.explanation) {
      explanationInput.value = question.explanation;
    }

    // Parse options
    let options = question.options;
    if (typeof options === 'string') {
      try {
        options = JSON.parse(options);
      } catch (e) {
        console.error('Failed to parse options:', e);
        options = {};
      }
    }

    // Load type-specific fields
    setTimeout(() => {
      const questionTextInput = document.getElementById('questionText');
      const chineseTextInput = document.getElementById('chineseText');
      const audioUrlInput = document.getElementById('audioUrl');
      const imageUrlInput = document.getElementById('imageUrl');
      const correctAnswerInput = document.getElementById('correctAnswer');

      // Parse question text that might contain " - 中文", "[audio: url]", or "[image: url]"
      let questionText = question.question || '';
      let chineseText = '';
      let audioUrl = '';
      let imageUrl = '';

      console.log('🔍 Original question text:', questionText);

      // Extract audio URL from [audio: url] format
      const audioMatch = questionText.match(/\[audio:\s*(.+?)\]/);
      if (audioMatch) {
        audioUrl = audioMatch[1];
        questionText = questionText.replace(/\[audio:\s*.+?\]/, '').trim();
        console.log('🎵 Extracted audio URL:', audioUrl);
      }

      // Extract image URL from [image: url] format
      const imageMatch = questionText.match(/\[image:\s*(.+?)\]/);
      if (imageMatch) {
        imageUrl = imageMatch[1];
        questionText = questionText.replace(/\[image:\s*.+?\]/, '').trim();
        console.log('🖼️ Extracted image URL:', imageUrl);
      }

      console.log('📝 Final question text after extraction:', questionText);

      // Extract Chinese text from " - 中文" format
      const chineseMatch = questionText.match(/\s+-\s+(.+)$/);
      if (chineseMatch) {
        chineseText = chineseMatch[1];
        questionText = questionText.replace(/\s+-\s+.+$/, '').trim();
      }

      console.log('📋 Setting form values:');
      console.log('  - questionTextInput exists:', !!questionTextInput);
      console.log('  - chineseTextInput exists:', !!chineseTextInput);
      console.log('  - audioUrlInput exists:', !!audioUrlInput);
      console.log('  - imageUrlInput exists:', !!imageUrlInput);
      console.log('  - correctAnswerInput exists:', !!correctAnswerInput);

      if (questionTextInput) {
        questionTextInput.value = questionText;
        console.log('  ✓ Set questionText to:', questionText);
      }
      if (chineseTextInput) {
        chineseTextInput.value = chineseText || question.chinese_text || '';
        console.log('  ✓ Set chineseText to:', chineseText || question.chinese_text || '');
      }
      if (audioUrlInput) {
        audioUrlInput.value = audioUrl || question.audio_url || '';
        console.log('  ✓ Set audioUrl to:', audioUrl || question.audio_url || '');

        // Show audio preview if audio URL exists
        if (audioUrl) {
          const audioPreview = document.getElementById('audioPreview');
          const audioUrlDisplay = document.getElementById('audioUrlDisplay');
          const currentAudioDisplay = document.getElementById('currentAudioDisplay');

          if (audioPreview && audioUrlDisplay && currentAudioDisplay) {
            audioPreview.src = audioUrl;
            audioUrlDisplay.textContent = audioUrl;
            currentAudioDisplay.classList.remove('hidden');
            console.log('  🎵 Audio preview displayed');
          }
        }
      }
      if (imageUrlInput) {
        imageUrlInput.value = imageUrl || question.image_url || '';
        console.log('  ✓ Set imageUrl to:', imageUrl || question.image_url || '');
      }
      if (correctAnswerInput) {
        correctAnswerInput.value = question.correct_answer || '';
        console.log('  ✓ Set correctAnswer to:', question.correct_answer || '');
      }

      // Show image preview if image URL exists
      if (imageUrl && imageUrlInput) {
        const imagePreview = document.getElementById('imagePreview');
        const imagePreviewPlaceholder = document.getElementById('imagePreviewPlaceholder');
        if (imagePreview) {
          imagePreview.src = imageUrl;
          imagePreview.classList.remove('hidden');
          if (imagePreviewPlaceholder) {
            imagePreviewPlaceholder.classList.add('hidden');
          }
          console.log('  🖼️ Image preview displayed');
        }
      }

      // Load multiple choice options - handle both array and object formats
      if (Array.isArray(options)) {
        // Array format: ["Hello", "Goodbye", "Thanks", "Sorry"]
        const letters = ['a', 'b', 'c', 'd'];
        options.forEach((optionText, index) => {
          const optionInput = document.getElementById(`option_${letters[index]}`);
          if (optionInput && optionText) {
            optionInput.value = optionText;
          }
        });

        // Set correct answer radio button
        const correctAnswer = question.correct_answer;
        if (correctAnswer) {
          const correctIndex = options.indexOf(correctAnswer);
          if (correctIndex >= 0) {
            const radioButton = document.getElementById(`correct_${letters[correctIndex]}`);
            if (radioButton) radioButton.checked = true;
          }
        }
      } else if (options && typeof options === 'object') {
        // Object format: {a: "Hello", b: "Goodbye", ...}
        ['a', 'b', 'c', 'd'].forEach(key => {
          const optionInput = document.getElementById(`option_${key}`);
          if (optionInput && options[key]) {
            optionInput.value = options[key];
          }
        });

        // Set correct answer radio button
        const correctAnswer = question.correct_answer;
        if (correctAnswer) {
          ['a', 'b', 'c', 'd'].forEach(key => {
            if (options[key] === correctAnswer) {
              const radioButton = document.getElementById(`correct_${key}`);
              if (radioButton) radioButton.checked = true;
            }
          });
        }
      }

      // Load matching pairs
      if (selectedType === 'matching' && Array.isArray(options)) {
        options.forEach((pair, index) => {
          const pairNum = index + 1;
          const leftInput = document.getElementById(`chinese_${pairNum}`);
          const rightInput = document.getElementById(`english_${pairNum}`);
          if (leftInput && rightInput) {
            leftInput.value = pair.left || '';
            rightInput.value = pair.right || '';
          }
        });
      }

      // Load true/false data
      if (selectedType === 'true_false') {
        const statementInput = document.getElementById('statement');
        if (statementInput) {
          statementInput.value = question.question || '';
          console.log('  ✓ Set statement to:', question.question);
        }

        // Set the correct radio button
        const correctAnswer = question.correct_answer; // "true" or "false"
        if (correctAnswer === 'true') {
          const trueRadio = document.getElementById('true');
          if (trueRadio) {
            trueRadio.checked = true;
            console.log('  ✓ Checked TRUE radio button');
          }
        } else if (correctAnswer === 'false') {
          const falseRadio = document.getElementById('false');
          if (falseRadio) {
            falseRadio.checked = true;
            console.log('  ✓ Checked FALSE radio button');
          }
        }
      }

      // Update Save button to indicate editing
      const saveBtn = document.querySelector('button[onclick="saveQuestion()"]');
      if (saveBtn) {
        saveBtn.textContent = '💾 Update Question';
        saveBtn.setAttribute('data-edit-id', editId);
      }
    }, 500); // Wait for form to render

  } catch (error) {
    console.error('Error loading question:', error);
    alert('❌ Failed to load question: ' + error.message);
  }
}
```

**Key Features:**
- Extracts audio/image URLs using regex: `/\[audio:\s*(.+?)\]/` and `/\[image:\s*(.+?)\]/`
- 500ms timeout to wait for dynamic form rendering
- Handles both array and object format options
- Shows audio player and image preview when editing
- Hides placeholder text when showing images
- Supports all question types including true/false

---

## Save Question Function

**File**: `public/admin/admin-quiz-creator.html` (Lines 1430-1508)

```javascript
async function saveQuestion() {
  // Check if we're editing
  const saveBtn = document.querySelector('button[onclick="saveQuestion()"]');
  const editId = saveBtn?.getAttribute('data-edit-id');

  if (!selectedType) {
    alert('Please select a question type first!');
    return;
  }

  // Validate required fields
  const hskLevel = document.getElementById('hskLevel')?.value;
  if (!hskLevel) {
    alert('❌ Please select an HSK level!');
    return;
  }

  // Collect form data based on question type
  const questionData = collectCompleteFormData();

  if (!questionData) {
    alert('❌ Please fill in all required fields!');
    return;
  }

  console.log(editId ? 'Updating' : 'Saving', 'question data:', questionData);

  try {
    // Get admin password from localStorage or prompt
    let adminPassword = localStorage.getItem('adminPassword');
    if (!adminPassword) {
      adminPassword = prompt('Enter admin password:');
      if (!adminPassword) return;
      localStorage.setItem('adminPassword', adminPassword);
    }

    // Send to backend API
    const url = editId ? `/api/admin/quizzes/${editId}` : '/api/admin/quizzes';
    const method = editId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Password': adminPassword
      },
      body: JSON.stringify(questionData)
    });

    if (!response.ok) {
      if (response.status === 403) {
        localStorage.removeItem('adminPassword');
        throw new Error('Invalid admin password');
      }
      throw new Error(`Server error: ${response.status}`);
    }

    const result = await response.json();
    console.log(editId ? '✅ Question updated:' : '✅ Question saved:', result);

    if (editId) {
      alert('✅ Question updated successfully!');
      window.location.href = '/admin/admin-questions-list.html';
    } else {
      alert('✅ Question saved successfully!\n\nQuestion ID: ' + result.id);

      // Reset form
      if (confirm('Question saved! Create another one?')) {
        location.reload();
      } else {
        // Redirect to questions list
        window.location.href = '/admin/admin-questions-list.html';
      }
    }
  } catch (error) {
    console.error('❌ Error saving question:', error);
    alert('❌ Failed to save question: ' + error.message);
  }
}
```

**Key Features:**
- Checks for `data-edit-id` attribute to determine create vs update
- Uses PUT for updates, POST for creates
- Different endpoint: `/api/admin/quizzes/{id}` for updates
- HSK level validation

---

## Audio Upload & Preview

### Audio Upload Handler
**File**: `public/admin/admin-quiz-creator.html` (Lines 342-366)

```javascript
async function handleAudioUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('audioUploadStatus');
  statusDiv.textContent = '⏳ Uploading audio...';
  statusDiv.className = 'text-sm mt-2 text-blue-600';

  try {
    const adminPassword = await getAdminPassword();
    if (!adminPassword) return;

    const formData = new FormData();
    formData.append('audio', file);

    const response = await fetch('/api/admin/upload-audio', {
      method: 'POST',
      headers: {
        'X-Admin-Password': adminPassword
      },
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    document.getElementById('audioUrl').value = data.url;
    statusDiv.textContent = '✅ Audio uploaded successfully!';
    statusDiv.className = 'text-sm mt-2 text-green-600';
  } catch (error) {
    statusDiv.textContent = '❌ Upload failed: ' + error.message;
    statusDiv.className = 'text-sm mt-2 text-red-600';
  }
}
```

### Audio Preview Display (Multiple Choice Form)
**File**: `public/admin/admin-quiz-creator.html` (Lines 503-509)

```html
<div id="currentAudioDisplay" class="hidden mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
  <p class="text-sm font-semibold text-blue-900 mb-2">Current Audio:</p>
  <audio id="audioPreview" controls class="w-full mb-2">
    <source type="audio/mpeg">
  </audio>
  <p class="text-xs text-blue-600 break-all" id="audioUrlDisplay"></p>
</div>
```

---

## Image Upload & Preview

### Image Upload Handler
**File**: `public/admin/admin-quiz-creator.html` (Lines 368-412)

```javascript
async function handleImageUpload(input) {
  const file = input.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('imageUploadStatus');
  const imagePreview = document.getElementById('imagePreview');
  const imagePreviewPlaceholder = document.getElementById('imagePreviewPlaceholder');

  statusDiv.textContent = '⏳ Uploading image...';
  statusDiv.className = 'text-sm mt-2 text-blue-600';

  try {
    const adminPassword = await getAdminPassword();
    if (!adminPassword) return;

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/admin/upload-image', {
      method: 'POST',
      headers: {
        'X-Admin-Password': adminPassword
      },
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed');

    const data = await response.json();
    document.getElementById('imageUrl').value = data.url;

    // Show preview
    if (imagePreview) {
      imagePreview.src = data.url;
      imagePreview.classList.remove('hidden');
      if (imagePreviewPlaceholder) {
        imagePreviewPlaceholder.classList.add('hidden');
      }
    }

    statusDiv.textContent = '✅ Image uploaded successfully!';
    statusDiv.className = 'text-sm mt-2 text-green-600';
  } catch (error) {
    statusDiv.textContent = '❌ Upload failed: ' + error.message;
    statusDiv.className = 'text-sm mt-2 text-red-600';
  }
}
```

### Image Preview Container (Image Association Form)
**File**: `public/admin/admin-quiz-creator.html` (Lines 697-703)

```html
<div class="mb-4">
  <label class="block text-sm font-semibold mb-2">Image Preview</label>
  <div class="max-w-md border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 p-4">
    <span class="text-gray-400" id="imagePreviewPlaceholder">No image</span>
    <img id="imagePreview" src="" alt="Preview" class="hidden max-w-full h-auto rounded-lg">
  </div>
</div>
```

**Critical CSS Classes:**
- `max-w-md` - Responsive max width
- `h-auto` - Natural height (no cropping)
- `hidden` - Toggle visibility of placeholder vs image

---

## True/False Question Handling

### Data Collection (Save)
**File**: `public/admin/admin-quiz-creator.html` (Lines 1588-1597)

```javascript
case 'true_false':
  const statement = document.getElementById('statement')?.value;
  const tfAnswer = document.querySelector('input[name="trueFalse"]:checked')?.value;

  if (!statement || !tfAnswer) return null;

  questionData.question = statement;
  questionData.correct_answer = tfAnswer;
  questionData.options = JSON.stringify(['true', 'false']);
  break;
```

### Data Loading (Edit)
**File**: `public/admin/admin-quiz-creator.html` (Lines 1883-1906)

```javascript
// Load true/false data
if (selectedType === 'true_false') {
  const statementInput = document.getElementById('statement');
  if (statementInput) {
    statementInput.value = question.question || '';
    console.log('  ✓ Set statement to:', question.question);
  }

  // Set the correct radio button
  const correctAnswer = question.correct_answer; // "true" or "false"
  if (correctAnswer === 'true') {
    const trueRadio = document.getElementById('true');
    if (trueRadio) {
      trueRadio.checked = true;
      console.log('  ✓ Checked TRUE radio button');
    }
  } else if (correctAnswer === 'false') {
    const falseRadio = document.getElementById('false');
    if (falseRadio) {
      falseRadio.checked = true;
      console.log('  ✓ Checked FALSE radio button');
    }
  }
}
```

---

## Question List Display

### Strip URLs from Question Cards
**File**: `public/admin/admin-questions-list.html` (Lines 263-272)

```javascript
// Parse question to extract main text
let questionText = question.question || 'Untitled Question';
// Remove audio URLs from display
questionText = questionText.replace(/\[audio:.*?\]/g, '🔊 ');
// Remove image URLs from display
questionText = questionText.replace(/\[image:.*?\]/g, '🖼️ ');
// Truncate if too long
if (questionText.length > 100) {
  questionText = questionText.substring(0, 100) + '...';
}
```

**Regex Patterns:**
- Audio: `/\[audio:.*?\]/g` - Matches `[audio: URL]` and replaces with 🔊
- Image: `/\[image:.*?\]/g` - Matches `[image: URL]` and replaces with 🖼️

---

## Quiz Page Image Display

### Extract Image URL from Question Text
**File**: `public/quiz.html` (Lines 240-264)

```javascript
// Parse question text to extract audio URL, image URL, and Chinese text if present
let questionText = data.question || '';
let audioUrl = '';
let imageUrl = '';

// Extract audio URL from [audio: url] format
const audioMatch = questionText.match(/\[audio:\s*(.+?)\]/);
if (audioMatch) {
  audioUrl = audioMatch[1];
  questionText = questionText.replace(/\[audio:\s*.+?\]/, '').trim();
}

// Extract image URL from [image: url] format
const imageMatch = questionText.match(/\[image:\s*(.+?)\]/);
if (imageMatch) {
  imageUrl = imageMatch[1];
  questionText = questionText.replace(/\[image:\s*.+?\]/, '').trim();
}

// Extract Chinese text from " - 中文" format
const chineseMatch = questionText.match(/\s+-\s+(.+)$/);
if (chineseMatch) {
  chineseText = chineseMatch[1];
  questionText = questionText.replace(/\s+-\s+.+$/, '').trim();
}
```

### Display Image in Quiz Card
**File**: `public/quiz.html` (Lines 138-140, 273-282)

**HTML Container:**
```html
<!-- Image (shown only when image exists) -->
<div id="imageContainer" class="hidden mt-6 mb-6">
  <img id="questionImage" src="" alt="Question image" class="w-full max-w-md mx-auto rounded-lg shadow-md">
</div>
```

**JavaScript Display Logic:**
```javascript
// Handle image display
const imageContainer = document.getElementById('imageContainer');
const questionImage = document.getElementById('questionImage');

if (imageUrl) {
  questionImage.src = imageUrl;
  imageContainer.classList.remove('hidden');
} else {
  imageContainer.classList.add('hidden');
}
```

---

## Data Format Reference

### Question Text Composite Format

```
"Base question text - 中文文本 [audio: URL] [image: URL]"
```

**Examples:**
```
"What is this?"
→ Simple question

"What does this mean? - 你好"
→ Question with Chinese text

"Listen and choose [audio: https://...mp3]"
→ Question with audio

"Image association [image: https://...jpg]"
→ Question with image

"Multiple choice - 手表 [audio: https://...mp3]"
→ Question with Chinese and audio

"Identify this - 奶奶 [image: https://...png]"
→ Question with Chinese and image
```

### HSK Level Format
**Database**: Integer 1-6
**Form**: String "HSK1"-"HSK6"
**Conversion**: `parseInt(hskLevel.replace('HSK', ''))`

### Options Format
**Multiple Choice**: Array `["Option A", "Option B", "Option C", "Option D"]`
**True/False**: Array `["true", "false"]`
**Matching**: Array of objects `[{left: "中文", right: "English"}, ...]`

---

## Testing Checklist

Use this checklist before deploying changes:

- [ ] **Create Questions**
  - [ ] Multiple choice with audio uploads correctly
  - [ ] Image association with image uploads correctly
  - [ ] True/false saves statement and answer
  - [ ] HSK level saves as integer

- [ ] **Edit Questions**
  - [ ] Multiple choice loads all data including audio preview
  - [ ] Image association loads all data including image preview
  - [ ] True/false loads statement and correct radio button
  - [ ] Options (A,B,C,D) load correctly
  - [ ] Correct answer radio is selected
  - [ ] Save button changes to "Update Question"

- [ ] **Questions List**
  - [ ] Cards show clean text with 🔊 and 🖼️ icons
  - [ ] No URLs visible in card text
  - [ ] Edit button works
  - [ ] Delete button works

- [ ] **Quiz Page**
  - [ ] Images display for image_association questions
  - [ ] Audio plays for audio questions
  - [ ] All question types render correctly

---

## File Locations Quick Reference

**Admin Files:**
- Quiz Creator: `/Users/ali/chinese-learning-bot/public/admin/admin-quiz-creator.html`
- Questions List: `/Users/ali/chinese-learning-bot/public/admin/admin-questions-list.html`

**Quiz Files:**
- Quiz Page: `/Users/ali/chinese-learning-bot/public/quiz.html`

**Backend:**
- Main Server: `/Users/ali/chinese-learning-bot/bot.js`
- Upload Audio Endpoint: `/api/admin/upload-audio` (Lines 699-716)
- Upload Image Endpoint: `/api/admin/upload-image` (Lines 717-751)

**Production:**
- Server: `root@34.17.122.31`
- Path: `/var/www/chinese-learning-bot`
- URL: `https://lokatsiya.online/admin/`

---

*This snapshot represents the current working state as of 2025-01-31.*
*All code has been tested and is working in production.*
