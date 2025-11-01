# Cloze Test Implementation Documentation

## Overview
The cloze test feature allows students to fill in blanks within a passage. This document details the complete implementation including database schema, backend API, frontend rendering, and validation logic.

## Database Schema

### Table: `quiz_questions`
The cloze test questions are stored in the `quiz_questions` table with the following relevant fields:

```sql
CREATE TABLE quiz_questions (
  id SERIAL PRIMARY KEY,
  question_type VARCHAR(50) NOT NULL, -- 'cloze_test'
  hsk_level VARCHAR(10) NOT NULL,     -- 'HSK1', 'HSK2', etc.
  difficulty VARCHAR(20) DEFAULT 'medium',
  tags TEXT,

  -- Question Content
  question TEXT NOT NULL,             -- Heading + [passage: text with ___]
  options JSONB,                      -- Array of blank objects
  correct_answer TEXT NOT NULL,       -- First blank's correct answer

  -- Additional Info
  explanation TEXT,
  hints JSONB,
  lesson_id INTEGER REFERENCES lessons(id),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',

  -- Stats
  times_shown INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0
);
```

### Data Format

#### Question Field Format
```
"Fill in all the blanks: [passage: This ___ a close test. This ___ a close test. This ___ a close test.]"
```

- **Heading**: Text before `[passage: ...]` - e.g., "Fill in all the blanks:"
- **Passage Tag**: `[passage: ...]` containing the text with `___` for blanks
- The passage is extracted and blanks are replaced with input fields

#### Options Field Format (JSONB)
```json
[
  {
    "blank_num": 1,
    "correct": "is",
    "acceptable": ["was", "are"]
  },
  {
    "blank_num": 2,
    "correct": "is",
    "acceptable": ["was"]
  },
  {
    "blank_num": 3,
    "correct": "is",
    "acceptable": []
  }
]
```

Each blank object contains:
- `blank_num`: Sequential number (1, 2, 3, ...)
- `correct`: The primary correct answer
- `acceptable`: Array of alternative acceptable answers (can be empty)

## Backend Implementation

### File: `bot.js`

#### API Endpoint: GET `/api/quiz`

```javascript
app.get('/api/quiz', async (req, res) => {
  try {
    const hskLevel = req.query.level ? parseInt(req.query.level) : null;
    const excludeIds = req.query.exclude ? req.query.exclude.split(',').map(id => parseInt(id)) : [];

    let allQuizQuestions = await db.getQuizzes(hskLevel);
    const totalAvailable = allQuizQuestions ? allQuizQuestions.length : 0;

    let quizQuestions = allQuizQuestions;
    if (excludeIds.length > 0) {
      quizQuestions = quizQuestions.filter(q => !excludeIds.includes(q.id));
    }

    const question = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];

    // Parse options
    let options = question.options;
    if (typeof options === 'string') {
      options = JSON.parse(options);
    }

    // Handle different question formats
    let optionsArray = [];

    // For matching and cloze_test questions, preserve the structure
    if (question.question_type === 'matching' || question.question_type === 'cloze_test') {
      optionsArray = options; // Keep structure as-is
    } else {
      // For other types, extract text values and shuffle
      if (Array.isArray(options)) {
        optionsArray = options.map(opt => typeof opt === 'string' ? opt : opt.text);
      } else if (options && typeof options === 'object') {
        optionsArray = Object.values(options).filter(Boolean);
      }
      optionsArray.sort(() => Math.random() - 0.5);
    }

    res.json({
      id: question.id,
      question: question.question || question.chinese_text,
      pinyin: question.pinyin || '',
      options: optionsArray,
      correctAnswer: question.correct_answer,
      questionType: question.question_type,
      audioUrl: question.audio_url,
      imageUrl: question.image_url,
      totalQuestions: totalAvailable
    });
  } catch (error) {
    console.error('Error loading quiz:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Important**: Cloze test questions preserve the options array structure (don't extract `.text` or shuffle) because the array contains blank objects with validation data.

### File: `database.js`

```javascript
async getQuizzes(hskLevel = null) {
  if (!supabase) return [];
  let query = supabase
    .from('quiz_questions')
    .select(`
      *,
      lessons (id, title, hsk_level, lesson_number)
    `)
    .eq('status', 'active'); // Only get active questions

  // Filter by HSK level if provided
  if (hskLevel !== null && hskLevel !== undefined) {
    // Convert numeric level to HSK format (e.g., 1 -> 'HSK1')
    const hskLevelStr = `HSK${hskLevel}`;
    query = query.eq('hsk_level', hskLevelStr);
  }

  query = query.order('id', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
```

## Frontend Implementation

### File: `public/quiz.html`

#### 1. Question Loading (loadQuestion function)

```javascript
async function loadQuestion() {
  try {
    // Build URL with level parameter and used question IDs
    let url = API_CONFIG.url(API_CONFIG.endpoints.quiz);
    const params = new URLSearchParams();
    if (hskLevel) {
      params.append('level', hskLevel);
    }
    if (usedQuestionIds.length > 0) {
      params.append('exclude', usedQuestionIds.join(','));
    }
    if (params.toString()) {
      url += '?' + params.toString();
    }

    const response = await fetch(url, {
      headers: telegramAuth.getHeaders()
    });

    const data = await response.json();

    // Store question data
    currentQuestionData = data;
    usedQuestionIds.push(data.id);

    // Set total questions from API response
    if (totalQuestions === null && data.totalQuestions) {
      totalQuestions = data.totalQuestions;
    }

    // Route to appropriate render function based on question type
    switch(data.questionType) {
      case 'cloze_test':
        questionCard.classList.add('hidden');
        renderClozeTestQuestion(data);
        break;
      // ... other question types
    }

    // Update progress in header
    const currentQuestionNum = document.getElementById('currentQuestionNum');
    const totalQuestionsNum = document.getElementById('totalQuestionsNum');
    const progressBar = document.getElementById('progressBar');

    if (currentQuestionNum) currentQuestionNum.textContent = currentQuestion;
    if (totalQuestionsNum && totalQuestions) totalQuestionsNum.textContent = totalQuestions;

    if (progressBar && totalQuestions) {
      progressBar.style.width = `${(currentQuestion / totalQuestions) * 100}%`;
    }

    // Update question type badge
    const questionTypeBadge = document.getElementById('questionType');
    if (questionTypeBadge) {
      const typeLabels = {
        'cloze_test': '📝 Cloze Test',
        // ... other types
      };
      questionTypeBadge.textContent = typeLabels[data.questionType] || '📝 Question';
    }

    answered = false;
    nextBtn.disabled = true;
  } catch (error) {
    console.error('Failed to load question:', error);
    throw error;
  }
}
```

#### 2. Rendering (renderClozeTestQuestion function)

```javascript
function renderClozeTestQuestion(data) {
  console.log('Rendering cloze test with data:', data);

  // Extract passage from question text
  const passageMatch = data.question.match(/\[passage:\s*(.+?)\]$/);
  if (!passageMatch) {
    console.error('No passage found in cloze test question');
    return;
  }

  const passage = passageMatch[1];

  // Extract question heading (text before [passage:...])
  const questionHeading = data.question.replace(/\[passage:.+?\]$/g, '').trim();

  // Parse blanks from options
  let blanks = [];
  if (typeof data.options === 'string') {
    try {
      blanks = JSON.parse(data.options);
    } catch (e) {
      console.error('Failed to parse blanks:', e);
      return;
    }
  } else {
    blanks = data.options;
  }

  if (!Array.isArray(blanks) || blanks.length === 0) {
    console.error('Invalid blanks data:', blanks);
    return;
  }

  // Build HTML - heading, passage, then input fields
  let html = `<div class="space-y-4">
    <h2 class="text-xl font-bold mb-4">${questionHeading}</h2>
    <div class="p-6 rounded-xl bg-gray-50 dark:bg-gray-800">
      <p class="text-2xl leading-relaxed mb-4">${passage}</p>
    </div>
    <div class="space-y-3">`;

  blanks.forEach((blank, index) => {
    html += `<div>
      <label class="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Blank ${index + 1}:</label>
      <input type="text" id="blank_${index}" class="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base" placeholder="Type answer..." oninput="handleClozeChange()">
    </div>`;
  });

  html += '</div></div>';

  optionsContainer.innerHTML = html;

  // Store blanks data for validation
  window.clozeTestBlanks = blanks;
}
```

**Key Design Decisions**:
- Hide the main question card (heading is rendered within cloze test)
- Display passage in a gray box with larger text
- Render separate input fields below passage (not inline)
- Use 0-based indexing for input IDs (`blank_0`, `blank_1`, etc.)
- Store blanks data globally for validation

#### 3. Input Change Handler (handleClozeChange function)

```javascript
function handleClozeChange() {
  const blanks = window.clozeTestBlanks || [];
  let allFilled = true;
  blanks.forEach((_, index) => {
    const input = document.getElementById(`blank_${index}`);
    if (!input || !input.value.trim()) allFilled = false;
  });
  if (allFilled) {
    nextBtn.disabled = false;
    // Don't auto-submit - let user review answers and click Next button
  } else {
    nextBtn.disabled = true;
  }
}
```

**Key Design Decision**: No auto-submit. Enable the Next button when all blanks are filled, but let the user review and click Next manually. This prevents premature submission while typing.

#### 4. Answer Validation (submitClozeTestAnswer function)

```javascript
async function submitClozeTestAnswer() {
  if (answered) return;
  answered = true;

  const blanks = window.clozeTestBlanks || [];
  const inputs = optionsContainer.querySelectorAll('input[type="text"]');
  let allCorrect = true;

  inputs.forEach((input, index) => {
    const userAnswer = input.value.trim().toLowerCase();
    const blankData = blanks[index];

    if (!blankData) {
      console.error('No blank data for index', index);
      allCorrect = false;
      return;
    }

    const correctAnswer = blankData.correct.toLowerCase();
    const acceptableAnswers = (blankData.acceptable || []).map(a => a.toLowerCase());

    console.log(`Blank ${index + 1}:`, {
      userAnswer,
      correctAnswer,
      acceptableAnswers,
      blankData
    });

    // Check if user answer matches correct answer or any acceptable alternatives
    const isCorrect = userAnswer === correctAnswer || acceptableAnswers.includes(userAnswer);

    console.log(`Blank ${index + 1} is ${isCorrect ? 'CORRECT' : 'INCORRECT'}`);

    if (!isCorrect) allCorrect = false;

    // Visual feedback
    if (isCorrect) {
      input.classList.remove('border-blue-500');
      input.classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
    } else {
      input.classList.remove('border-blue-500');
      input.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
      // Show correct answer
      const correctSpan = document.createElement('span');
      correctSpan.className = 'ml-2 text-green-600 dark:text-green-400 font-bold';
      correctSpan.textContent = `✓ ${blankData.correct}`;
      input.parentNode.insertBefore(correctSpan, input.nextSibling);
    }
    input.disabled = true;
  });

  // Update stats
  if (allCorrect) {
    stats.correct++;
  } else {
    stats.incorrect++;
  }

  // Save progress (if authenticated)
  if (currentQuestionData && telegramAuth.isAuthenticated()) {
    try {
      await fetch(API_CONFIG.url('/api/progress/quiz'), {
        method: 'POST',
        headers: telegramAuth.getHeaders(),
        body: JSON.stringify({
          vocabularyId: currentQuestionData.id,
          correct: allCorrect
        })
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  updateStats();
}
```

**Validation Logic**:
1. Convert both user answer and correct answers to lowercase for case-insensitive comparison
2. Check if user answer matches the primary correct answer
3. Check if user answer matches any acceptable alternative
4. Mark as correct if either condition is true
5. Display visual feedback (green for correct, red for incorrect)
6. Show correct answer for incorrect blanks

#### 5. Next Button Integration

```javascript
nextBtn.addEventListener('click', async () => {
  if (quizComplete) {
    finishQuiz();
    return;
  }

  // If this is a cloze test and not yet answered, submit the answer first
  if (currentQuestionData?.questionType === 'cloze_test' && !answered) {
    await submitClozeTestAnswer();
  }

  // If this is a matching question and not yet answered, submit the answer first
  if (currentQuestionData?.questionType === 'matching' && !answered) {
    await submitMatchingAnswer();
  }

  currentQuestion++;

  // Try to load next question
  try {
    await loadQuestion();
  } catch (error) {
    console.log('No more questions available, finishing quiz');
    quizComplete = true;
    totalQuestions = currentQuestion - 1;
    finishQuiz();
  }
});
```

## Admin Panel Implementation

### File: `public/admin/admin-quiz-creator.html`

#### Creating Cloze Test Questions

The admin panel provides a form to create cloze test questions:

```javascript
function getClozeTestForm() {
  return `
    <section class="form-card">
      <h2 class="text-xl font-bold mb-4">3. Cloze Test Content</h2>

      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Question Heading *</label>
        <input type="text" id="questionText" class="input-field" placeholder="e.g., Fill in all the blanks:">
        <p class="text-xs text-gray-500 mt-1">Instruction text shown above the passage</p>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2">Passage with Blanks *</label>
        <textarea id="passage" rows="4" class="input-field" placeholder="e.g., This ___ a test. This ___ another blank."></textarea>
        <p class="text-xs text-gray-500 mt-1">Use ___ (three underscores) for each blank</p>
      </div>

      <div id="blanksContainer" class="space-y-3">
        <!-- Dynamic blank answer fields will be added here -->
      </div>

      <button type="button" onclick="addBlankField()" class="btn-secondary">
        <span class="material-symbols-outlined text-sm">add</span>
        Add Blank Answer
      </button>
    </section>
  `;
}
```

#### Saving Cloze Test Data

```javascript
case 'cloze_test':
  const clozeQuestionText = document.getElementById('questionText')?.value;
  const passage = document.getElementById('passage')?.value;

  if (!clozeQuestionText || !passage) return null;

  // Collect all blank answers dynamically
  const blanksData = [];
  let blankIndex = 1;

  while (true) {
    const answerInput = document.getElementById(`blank_${blankIndex}_answer`);
    const acceptableInput = document.getElementById(`blank_${blankIndex}_acceptable`);

    if (!answerInput || !answerInput.value) break; // No more blanks

    const blankData = {
      blank_num: blankIndex,
      correct: answerInput.value.trim(),
      acceptable: acceptableInput?.value ? acceptableInput.value.split(',').map(a => a.trim()).filter(a => a) : []
    };

    blanksData.push(blankData);
    blankIndex++;
  }

  if (blanksData.length === 0) return null; // Need at least one blank answer

  // Store passage with [passage: text] tag and blanks as JSON in options
  questionData.question = clozeQuestionText + ' [passage: ' + passage + ']';
  questionData.options = JSON.stringify(blanksData);
  // First blank's correct answer as the primary correct_answer
  questionData.correct_answer = blanksData[0].correct;
  break;
```

#### Loading Cloze Test for Editing

```javascript
// Set HSK level
const hskLevelSelect = document.getElementById('hskLevel');
if (hskLevelSelect) {
  // Handle both old format (number) and new format (HSK1, HSK2, etc.)
  const hskValue = question.hsk_level;
  if (hskValue && hskValue.toString().startsWith('HSK')) {
    hskLevelSelect.value = hskValue; // Already in HSK1 format
  } else {
    hskLevelSelect.value = 'HSK' + hskValue; // Convert number to HSK1 format
  }
}

// For cloze test questions
if (question.question_type === 'cloze_test') {
  // Extract passage from [passage: ...] tag
  const passageMatch = questionText.match(/\[passage:\s*(.+?)\]$/);
  if (passageMatch) {
    const passage = passageMatch[1];
    questionText = questionText.replace(/\[passage:.+?\]$/, '').trim();

    const passageInput = document.getElementById('passage');
    if (passageInput) passageInput.value = passage;
  }

  // Load blank answers
  if (Array.isArray(options) && options.length > 0) {
    options.forEach((blank, index) => {
      addBlankField(); // Add UI field
      const answerInput = document.getElementById(`blank_${index + 1}_answer`);
      const acceptableInput = document.getElementById(`blank_${index + 1}_acceptable`);

      if (answerInput) answerInput.value = blank.correct || '';
      if (acceptableInput && blank.acceptable) {
        acceptableInput.value = blank.acceptable.join(', ');
      }
    });
  }
}
```

## UI/UX Design

### Input Field Styling (Tailwind Classes)

```css
w-full                          /* Full width */
px-4 py-3.5                     /* Padding: 16px horizontal, 14px vertical */
rounded-xl                      /* Large rounded corners */
border-2                        /* 2px border */
border-gray-200                 /* Light gray border in light mode */
dark:border-gray-700            /* Darker gray border in dark mode */
bg-white                        /* White background in light mode */
dark:bg-gray-800                /* Dark background in dark mode */
text-gray-900                   /* Dark text in light mode */
dark:text-white                 /* White text in dark mode */
placeholder-gray-400            /* Gray placeholder in light mode */
dark:placeholder-gray-500       /* Darker placeholder in dark mode */
focus:outline-none              /* Remove default focus outline */
focus:border-primary            /* Blue border on focus */
focus:ring-2                    /* Focus ring */
focus:ring-primary/20           /* Light blue ring with 20% opacity */
transition-all                  /* Smooth transitions */
text-base                       /* 16px font size */
```

### Visual Feedback

**Correct Answer**:
- Green border (`border-green-500`)
- Light green background (`bg-green-50` / `dark:bg-green-900/20`)

**Incorrect Answer**:
- Red border (`border-red-500`)
- Light red background (`bg-red-50` / `dark:bg-red-900/20`)
- Show correct answer in green text below input

## Testing Checklist

- [ ] Create cloze test with multiple blanks
- [ ] Verify passage displays correctly with blanks
- [ ] Test typing in all input fields
- [ ] Verify Next button enables when all blanks filled
- [ ] Test submitting correct answers
- [ ] Test submitting incorrect answers
- [ ] Verify acceptable alternatives are accepted
- [ ] Check case-insensitive validation
- [ ] Test dark mode styling
- [ ] Verify progress tracking
- [ ] Test editing existing cloze test
- [ ] Verify HSK level saves and loads correctly

## Common Issues and Solutions

### Issue 1: Input fields not rendering
**Cause**: Options array being converted to null in API response
**Solution**: Added `cloze_test` to preserved question types in bot.js (line 200)

### Issue 2: Auto-submit preventing user from finishing typing
**Cause**: `handleClozeChange()` was calling `submitClozeTestAnswer()` immediately
**Solution**: Removed auto-submit, only enable Next button when all fields filled

### Issue 3: HSK level showing blank when editing
**Cause**: Code was prepending 'HSK' to value that already had 'HSK' prefix
**Solution**: Check if value starts with 'HSK' before adding prefix

### Issue 4: Validation failing with correct answers
**Cause**: Blank data not being stored in `window.clozeTestBlanks`
**Solution**: Ensure blanks array is properly parsed and stored after rendering

## File Locations

- **Frontend Quiz Page**: `/public/quiz.html`
- **Backend API**: `/bot.js` (lines 148-225)
- **Database Module**: `/database.js` (lines 404-426)
- **Admin Panel**: `/public/admin/admin-quiz-creator.html`
- **Migration**: `/migrations/fix-quiz-questions-schema.sql`

## Related Documentation

- Quiz System Overview: `/docs/quiz-system.md` (if exists)
- Database Schema: `/migrations/fix-quiz-questions-schema.sql`
- Admin Panel Guide: `/docs/admin-panel.md` (if exists)

## Future Enhancements

1. **Rich Text Passage**: Support bold, italic, or colored text in passages
2. **Inline Blanks**: Option to show blanks inline within passage instead of below
3. **Hints**: Display hints for each blank
4. **Auto-save**: Save draft answers to prevent data loss
5. **Time Tracking**: Track how long students take on each question
6. **Partial Credit**: Award partial points for getting some blanks correct
7. **Audio Passages**: Support audio playback for listening comprehension cloze tests
8. **Image Support**: Allow images within passages
9. **Multiple Passages**: Support multiple passages in one question
10. **Shuffle Blanks**: Option to randomize the order of blank input fields

## Version History

- **v1.0** (2025-10-31): Initial implementation with basic cloze test support
  - Passage with separate input fields
  - Case-insensitive validation
  - Acceptable alternatives support
  - Dark mode styling
  - Admin panel CRUD operations
