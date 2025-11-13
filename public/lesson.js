const tg = window.Telegram.WebApp;

let currentLesson = null;
let currentDialogueTab = 'pinyin';
let lessons = [];
let currentVocabulary = [];

async function initializePage() {
  tg.expand();
  tg.ready();

  const urlParams = new URLSearchParams(window.location.search);
  const lessonId = urlParams.get('id');

  if (!lessonId) {
    document.getElementById('lessonTitle').textContent = 'No lesson selected';
    return;
  }

  try {
    await loadLesson(lessonId);
    await loadLessonProgress(lessonId);
    await loadDialogues(lessonId);
    await loadVocabulary(lessonId);
    await loadGrammar(lessonId);
    await loadQuizzes(lessonId);
  } catch (error) {
    console.error('Error loading lesson:', error);
  }
}

async function loadLesson(lessonId) {
  try {
    const response = await fetch(`/api/lessons/${lessonId}`);
    if (!response.ok) throw new Error('Failed to load lesson');

    currentLesson = await response.json();
    document.getElementById('lessonTitle').textContent = `HSK ${currentLesson.hsk_level}: Lesson ${currentLesson.lesson_number}`;
    document.getElementById('audioTitle').textContent = `${currentLesson.title} Audio`;

    // Initialize audio player if lesson has audio
    if (currentLesson.audio_url) {
      initializeAudioPlayer(currentLesson.audio_url, currentLesson.thumbnail_url);
    }
  } catch (error) {
    console.error('Error loading lesson:', error);
  }
}

async function loadDialogues(lessonId) {
  try {
    const response = await fetch(`/api/lessons/${lessonId}/dialogues`);
    if (!response.ok) throw new Error('Failed to load dialogues');
    
    const dialogues = await response.json();
    renderDialogues(dialogues);
  } catch (error) {
    console.error('Error loading dialogues:', error);
    document.getElementById('dialogueContainer').innerHTML = '<p class="text-center text-text-secondary-light">No dialogues available</p>';
  }
}

function renderDialogues(dialogues) {
  const container = document.getElementById('dialogueContainer');

  if (!dialogues || dialogues.length === 0) {
    container.innerHTML = '<p class="text-center text-text-secondary-light">No dialogues available</p>';
    return;
  }

  const sorted = dialogues.sort((a, b) => (a.display_order || a.dialogue_order || 0) - (b.display_order || b.dialogue_order || 0));

  container.innerHTML = sorted.map(dialogue => {
    // Handle multi-line dialogue structure
    if (dialogue.lines && dialogue.lines.length > 0) {
      return dialogue.lines.map((line, index) => `
        <div class="flex flex-col gap-1 dialogue-item" style="margin-bottom: ${index === dialogue.lines.length - 1 ? '20px' : '10px'};">
          ${line.speaker ? `<p class="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">${line.speaker}</p>` : ''}
          <p class="text-lg font-medium" data-tab="characters">${line.chinese || ''}</p>
          <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="pinyin" style="display: none;">${line.pinyin || ''}</p>
          <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="english">${line.translation_en || line.english || ''}</p>
          <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="uzbek">${line.translation_uz || line.uzbek || ''}</p>
          <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="russian">${line.translation_ru || line.russian || ''}</p>
        </div>
      `).join('');
    }

    // Fallback for old flat structure
    return `
      <div class="flex flex-col gap-1 dialogue-item">
        ${dialogue.speaker ? `<p class="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">${dialogue.speaker}</p>` : ''}
        <p class="text-lg font-medium" data-tab="characters">${dialogue.chinese || ''}</p>
        <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="pinyin" style="display: none;">${dialogue.pinyin || ''}</p>
        <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="english">${dialogue.english || ''}</p>
        <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="uzbek">${dialogue.uzbek || ''}</p>
        <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="russian">${dialogue.russian || ''}</p>
      </div>
    `;
  }).join('');

  updateDialogueDisplay();
}

async function loadVocabulary(lessonId) {
  try {
    const response = await fetch(`/api/vocabulary?lesson_id=${lessonId}`);
    if (!response.ok) throw new Error('Failed to load vocabulary');

    currentVocabulary = await response.json();
    renderVocabulary(currentVocabulary);

    // Load favorite states for all vocabulary
    await loadFavoriteStates();
  } catch (error) {
    console.error('Error loading vocabulary:', error);
    document.getElementById('vocabularyContainer').innerHTML = '<p class="text-center text-text-secondary-light">No vocabulary available</p>';
  }
}

async function loadFavoriteStates() {
  try {
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId || !currentVocabulary || currentVocabulary.length === 0) return;

    // Get all user's favorites
    const response = await fetch(`/api/favorites/list?user_id=${userId}`);
    const favorites = await response.json();

    // Create a set of favorited vocabulary IDs for quick lookup
    const favoritedIds = new Set(favorites.map(f => f.id));

    // Update heart icons for favorited words
    currentVocabulary.forEach(word => {
      if (favoritedIds.has(word.id)) {
        const btn = document.querySelector(`button[data-word-id="${word.id}"]`);
        if (btn) {
          const icon = btn.querySelector('.material-symbols-outlined');
          if (icon) {
            icon.textContent = 'favorite';
            icon.style.fontVariationSettings = "'FILL' 1";
          }
        }
      }
    });
  } catch (error) {
    console.error('Error loading favorite states:', error);
  }
}

function renderVocabulary(vocabulary) {
  const container = document.getElementById('vocabularyContainer');
  const countEl = document.getElementById('vocabularyCount');

  if (!vocabulary || vocabulary.length === 0) {
    container.innerHTML = '<p class="text-center text-text-secondary-light">No vocabulary available</p>';
    if (countEl) countEl.textContent = 'No words';
    return;
  }

  // Update count
  if (countEl) countEl.textContent = `${vocabulary.length} word${vocabulary.length !== 1 ? 's' : ''}`;

  const posColors = {
    'n': 'blue',
    'v': 'purple',
    'adj': 'green',
    'adv': 'yellow',
    'prep': 'red',
    'conj': 'pink'
  };

  container.innerHTML = vocabulary.map(word => {
    const posType = (word.pos || 'n').toLowerCase();
    const color = posColors[posType] || 'gray';
    
    return `
    <div class="group flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border-light bg-surface-light p-3 transition-all hover:shadow-md hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-primary dark:border-border-dark dark:bg-surface-dark">
      <div class="flex-1">
        <div class="flex items-baseline gap-2">
          <h3 class="text-2xl font-bold">${word.chinese}</h3>
          <span class="rounded-full bg-${color}-100 px-2 py-0.5 text-xs font-medium text-${color}-800 dark:bg-${color}-900 dark:text-${color}-200">${word.pos || 'n.'}</span>
        </div>
        <p class="text-sm text-text-secondary-light dark:text-text-secondary-dark">${word.pinyin}</p>
        <p class="mt-1 text-base text-text-primary-light dark:text-text-primary-dark">${word.english}</p>
      </div>
      <div class="flex flex-col items-center gap-3">
        <button onclick="playAudio('${word.id}')" aria-label="Play audio for ${word.chinese}" class="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition-transform active:scale-95">
          <span class="material-symbols-outlined">volume_up</span>
        </button>
        <button onclick="toggleFavorite('${word.id}', event)" aria-label="Add ${word.chinese} to favorites" class="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary-light transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:text-red-500 dark:text-text-secondary-dark dark:hover:bg-red-400/10 dark:hover:text-red-400" data-word-id="${word.id}">
          <span class="material-symbols-outlined text-xl">favorite_border</span>
        </button>
        <button onclick="addToReview('${word.id}')" aria-label="Add ${word.chinese} to review queue" class="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary-light transition-colors hover:bg-primary/10 hover:text-primary focus-visible:text-primary dark:text-text-secondary-dark dark:hover:bg-primary/20 dark:hover:text-primary">
          <span class="material-symbols-outlined text-xl">add_circle</span>
        </button>
      </div>
    </div>
    `;
  }).join('');
}

async function loadGrammar(lessonId) {
  try {
    const response = await fetch(`/api/lessons/${lessonId}/grammar`);
    if (!response.ok) throw new Error('Failed to load grammar');
    
    const grammar = await response.json();
    renderGrammar(grammar);
  } catch (error) {
    console.error('Error loading grammar:', error);
    document.getElementById('grammarContainer').innerHTML = '<p class="text-center text-text-secondary-light">No grammar available</p>';
  }
}

function renderGrammar(grammar) {
  const container = document.getElementById('grammarContainer');

  if (!grammar || grammar.length === 0) {
    container.innerHTML = '<p class="text-center text-text-secondary-light">No grammar available</p>';
    return;
  }

  const colors = ['primary', 'warning', 'success'];

  container.innerHTML = grammar.map((point, index) => {
    const color = colors[index % colors.length];
    const borderColor = color === 'primary' ? 'border-primary' : color === 'warning' ? 'border-warning' : 'border-success';
    const bgColor = color === 'primary' ? 'bg-primary/5 dark:bg-primary/10' : color === 'warning' ? 'bg-warning/5 dark:bg-warning/10' : 'bg-success/5 dark:bg-success/10';

    // Parse examples if available (expected format: JSON array of {chinese, pinyin, english})
    let examplesHtml = '';
    if (point.examples) {
      try {
        const examples = typeof point.examples === 'string' ? JSON.parse(point.examples) : point.examples;
        if (Array.isArray(examples) && examples.length > 0) {
          examplesHtml = `
            <div class="space-y-3">
              <p class="text-xs font-semibold text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wide">Examples:</p>
              <div class="flex flex-col gap-3">
                ${examples.map(example => `
                  <div class="rounded-lg border border-border-light bg-surface-light p-3 dark:border-border-dark dark:bg-surface-dark">
                    <div class="flex items-start gap-3">
                      ${example.audio_url ? `
                        <button onclick="playExampleAudio('${example.audio_url}')" class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-all active:scale-95">
                          <span class="material-symbols-outlined text-lg">volume_up</span>
                        </button>
                      ` : ''}
                      <div class="flex flex-col flex-1">
                        <p class="font-bold text-base">${highlightGrammarWords(example.chinese, point.keywords)}</p>
                        ${example.pinyin ? `<p class="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-0.5">${example.pinyin}</p>` : ''}
                        ${example.english ? `<p class="text-sm italic text-text-secondary-light dark:text-text-secondary-dark mt-1">${example.english}</p>` : ''}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      } catch (e) {
        console.error('Failed to parse grammar examples:', e);
      }
    }

    // Grammar structure pattern
    let structureHtml = '';
    if (point.structure) {
      structureHtml = `
        <div class="grammar-pattern-box">
          <p class="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-1 font-semibold">STRUCTURE:</p>
          <p class="text-sm">${point.structure}</p>
        </div>
      `;
    }

    // Key points or notes
    let noteHtml = '';
    if (point.note) {
      noteHtml = `
        <div class="inline-flex items-center gap-2 rounded-lg bg-warning/20 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          <span class="material-symbols-outlined text-base">lightbulb</span>
          <span><strong>Key point:</strong> ${point.note}</span>
        </div>
      `;
    }

    // Common mistakes
    let mistakeHtml = '';
    if (point.common_mistake) {
      mistakeHtml = `
        <div class="inline-flex items-center gap-2 rounded-lg bg-warning/20 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-300">
          <span class="material-symbols-outlined text-base">warning</span>
          <span><strong>Common mistake:</strong> ${point.common_mistake}</span>
        </div>
      `;
    }

    return `
      <div class="flex flex-col gap-3 rounded-xl border-l-4 ${borderColor} ${bgColor} p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="text-base font-bold text-text-primary-light dark:text-text-primary-dark">${point.title}</h3>
            </div>
            ${point.subtitle ? `<p class="text-xs text-text-secondary-light dark:text-text-secondary-dark">${point.subtitle}</p>` : ''}
          </div>
          <button onclick="saveGrammar(${point.id})" class="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary-light transition-colors hover:bg-black/10 dark:text-text-secondary-dark dark:hover:bg-white/10">
            <span class="material-symbols-outlined text-xl">bookmark_border</span>
          </button>
        </div>

        <p class="text-sm text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">${point.explanation}</p>

        ${structureHtml}
        ${examplesHtml}
        ${noteHtml}
        ${mistakeHtml}
      </div>
    `;
  }).join('');
}

// Helper function to highlight grammar keywords in examples
function highlightGrammarWords(text, keywords) {
  if (!keywords) return text;

  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
  let highlighted = text;

  keywordArray.forEach(keyword => {
    const regex = new RegExp(keyword, 'g');
    highlighted = highlighted.replace(regex, `<span class="word-highlight">${keyword}</span>`);
  });

  return highlighted;
}

// Play audio for grammar examples
function playExampleAudio(audioUrl) {
  if (!audioUrl) return;

  const audio = new Audio(audioUrl);
  audio.play().catch(error => {
    console.error('Failed to play audio:', error);
  });
}

async function loadQuizzes(lessonId) {
  try {
    const response = await fetch(`/api/lessons/${lessonId}/quizzes`);
    if (!response.ok) throw new Error('Failed to load quizzes');
    
    const quizzes = await response.json();
    renderQuizzes(quizzes);
  } catch (error) {
    console.error('Error loading quizzes:', error);
    document.getElementById('quizzesContainer').innerHTML = '<p class="text-center text-text-secondary-light">No exercises available</p>';
  }
}

// Helper function to render different question types
function renderQuestionByType(quiz, index, options, correctAnswer, questionType) {
  const questionHeader = `
    <div class="flex items-start gap-3 mb-3">
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
        ${index + 1}
      </div>
      <div class="flex-1">
        <p class="text-base font-medium text-text-primary-light dark:text-text-primary-dark">${quiz.question}</p>
        ${quiz.pinyin ? `<p class="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">${quiz.pinyin}</p>` : ''}
      </div>
    </div>
  `;

  const feedback = `
    <div class="ml-11 mt-3 exercise-feedback" style="display: none;">
      <div class="feedback-message rounded-lg p-3 text-sm"></div>
    </div>
  `;

  let questionBody = '';
  const correctAnswerIndex = Array.isArray(options) ? options.indexOf(correctAnswer) : 0;

  switch(questionType) {
    case 'fill_gap':
      questionBody = `
        <div class="ml-11 grid grid-cols-2 gap-2" role="radiogroup">
          ${options.map((option, optIndex) => `
            <label class="exercise-option flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-border-light dark:border-border-dark p-4 transition-all hover:border-primary/50 hover:bg-primary/5" data-option-index="${optIndex}">
              <input class="h-5 w-5 border-2 text-primary focus:ring-primary" name="quiz_${quiz.id}" type="radio" value="${optIndex}" onchange="onExerciseOptionChange(${quiz.id})"/>
              <span class="text-lg font-bold">${option}</span>
            </label>
          `).join('')}
        </div>
      `;
      break;

    case 'text_input':
      questionBody = `
        <div class="ml-11">
          <input type="text" id="text_input_${quiz.id}" data-correct="${correctAnswer}" placeholder="Type your answer..."
            class="w-full px-4 py-3 rounded-lg border-2 border-border-light dark:border-border-dark focus:border-primary focus:ring-2 focus:ring-primary/20 text-lg font-medium"
            maxlength="10" onchange="onExerciseOptionChange(${quiz.id})"/>
        </div>
      `;
      break;

    case 'true_false':
      questionBody = `
        <div class="ml-11 grid grid-cols-2 gap-3">
          <label class="exercise-option flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-border-light dark:border-border-dark p-4 hover:border-primary/50" data-option-index="0">
            <input class="h-5 w-5 border-2 text-primary" name="quiz_${quiz.id}" type="radio" value="true" onchange="onExerciseOptionChange(${quiz.id})"/>
            <span class="font-bold text-lg">True ✓</span>
          </label>
          <label class="exercise-option flex items-center justify-center gap-2 cursor-pointer rounded-lg border-2 border-border-light dark:border-border-dark p-4 hover:border-primary/50" data-option-index="1">
            <input class="h-5 w-5 border-2 text-primary" name="quiz_${quiz.id}" type="radio" value="false" onchange="onExerciseOptionChange(${quiz.id})"/>
            <span class="font-bold text-lg">False ✗</span>
          </label>
        </div>
      `;
      break;

    case 'sentence_ordering':
      questionBody = `
        <div class="ml-11">
          <div class="p-4 rounded-lg bg-background-light dark:bg-background-dark mb-3">
            <p class="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-2">Click words in order:</p>
            <div class="flex flex-wrap gap-2" id="wordBank_${quiz.id}">
              ${options.map(word => `
                <button type="button" class="word-button px-4 py-2 rounded-lg border-2 border-border-light hover:border-primary transition-colors font-medium" data-word="${word}" data-quiz-id="${quiz.id}" onclick="selectWord(${quiz.id}, '${word}', this)">
                  ${word}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="p-4 rounded-lg border-2 border-dashed border-border-light dark:border-border-dark min-h-16" id="answerArea_${quiz.id}" data-correct="${correctAnswer}">
            <span class="text-sm text-text-secondary-light dark:text-text-secondary-dark">Click words above to build sentence</span>
          </div>
        </div>
      `;
      break;

    case 'error_correction':
      questionBody = `
        <div class="ml-11 p-4 rounded-lg bg-background-light dark:bg-background-dark">
          <p class="text-xs text-text-secondary-light dark:text-text-secondary-dark mb-3">Click on the incorrect word:</p>
          <div class="flex flex-wrap gap-2 text-xl" id="errorSentence_${quiz.id}">
            ${options.map(word => `
              <button type="button" class="error-word px-3 py-2 rounded hover:bg-red-50 border-2 border-transparent transition-colors" data-word="${word}" data-quiz-id="${quiz.id}" onclick="selectError(${quiz.id}, '${word}', this)">
                ${word}
              </button>
            `).join('')}
          </div>
          <input type="hidden" id="error_${quiz.id}" data-correct="${correctAnswer}"/>
        </div>
      `;
      break;

    case 'matching':
    case 'translation':
    case 'multiple_choice':
    default:
      questionBody = `
        <div class="ml-11 space-y-2" role="radiogroup">
          ${options.map((option, optIndex) => `
            <label class="exercise-option flex items-start gap-3 cursor-pointer rounded-lg border-2 border-border-light dark:border-border-dark p-3 transition-all hover:border-primary/50 hover:bg-primary/5" data-option-index="${optIndex}">
              <input class="mt-1 h-5 w-5 border-2 text-primary focus:ring-primary" name="quiz_${quiz.id}" type="radio" value="${optIndex}" onchange="onExerciseOptionChange(${quiz.id})"/>
              <span class="flex-1 text-base">${option}</span>
            </label>
          `).join('')}
        </div>
      `;
  }

  return `
    <div class="exercise-item" data-quiz-id="${quiz.id}" data-correct-index="${correctAnswerIndex}" data-question-type="${questionType}" data-correct-answer="${correctAnswer}">
      ${questionHeader}
      ${questionBody}
      ${feedback}
    </div>
  `;
}

// Initialize interactive question handlers
function initializeInteractiveQuestions() {
  window.sentenceBuilders = {};
  window.errorSelections = {};
}

// Word selection for sentence ordering
function selectWord(quizId, word, button) {
  if (!window.sentenceBuilders[quizId]) {
    window.sentenceBuilders[quizId] = [];
  }

  button.disabled = true;
  button.classList.add('opacity-50', 'cursor-not-allowed');

  window.sentenceBuilders[quizId].push(word);

  const answerArea = document.getElementById(`answerArea_${quizId}`);
  answerArea.innerHTML = window.sentenceBuilders[quizId].map(w =>
    `<span class="px-3 py-1 rounded-lg bg-primary/10 border border-primary font-medium inline-block mr-2">${w}</span>`
  ).join('');

  onExerciseOptionChange(quizId);
}

// Error word selection
function selectError(quizId, word, button) {
  document.querySelectorAll(`#errorSentence_${quizId} .error-word`).forEach(btn => {
    btn.classList.remove('bg-primary/10', 'border-primary');
  });

  button.classList.add('bg-primary/10', 'border-primary');
  document.getElementById(`error_${quizId}`).value = word;
  window.errorSelections[quizId] = word;

  onExerciseOptionChange(quizId);
}

function renderQuizzes(quizzes) {
  const container = document.getElementById('quizzesContainer');
  const checkContainer = document.getElementById('checkAnswersContainer');

  if (!quizzes || quizzes.length === 0) {
    container.innerHTML = '<p class="text-center text-text-secondary-light">No exercises available</p>';
    if (checkContainer) checkContainer.style.display = 'none';
    return;
  }

  // Store quiz data globally for checking
  window.exerciseQuizzes = quizzes;

  container.innerHTML = quizzes.map((quiz, index) => {
    const options = JSON.parse(quiz.options || '[]');
    const correctAnswer = quiz.correct_answer;
    const questionType = quiz.question_type || 'multiple_choice';

    return renderQuestionByType(quiz, index, options, correctAnswer, questionType);
  }).join('');

  // Initialize interactive components after rendering
  initializeInteractiveQuestions();

  // Show check answers button
  if (checkContainer) {
    checkContainer.style.display = 'block';
    const totalCountEl = document.getElementById('totalCount');
    const correctCountEl = document.getElementById('correctCount');
    if (totalCountEl) totalCountEl.textContent = quizzes.length;
    if (correctCountEl) correctCountEl.textContent = '0';
  }
}

function switchDialogueTab(tab) {
  currentDialogueTab = tab;
  
  document.querySelectorAll('.dialogue-tab').forEach(btn => {
    btn.classList.remove('active', 'border-b-primary', 'text-primary');
    btn.classList.add('border-b-transparent', 'text-text-secondary-light', 'dark:text-text-secondary-dark');
  });
  
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active', 'border-b-primary', 'text-primary');
  document.querySelector(`[data-tab="${tab}"]`).classList.remove('border-b-transparent', 'text-text-secondary-light', 'dark:text-text-secondary-dark');
  
  updateDialogueDisplay();
}

function updateDialogueDisplay() {
  const items = document.querySelectorAll('.dialogue-item');
  
  items.forEach(item => {
    const lines = item.querySelectorAll('[data-tab]');
    
    lines.forEach(line => {
      line.style.display = 'none';
    });
    
    if (currentDialogueTab === 'characters') {
      item.querySelectorAll('[data-tab="characters"]').forEach(line => {
        line.style.display = 'block';
      });
    } else if (currentDialogueTab === 'pinyin') {
      item.querySelectorAll('[data-tab="characters"], [data-tab="pinyin"]').forEach(line => {
        line.style.display = 'block';
      });
    } else if (currentDialogueTab === 'translation') {
      const userLang = localStorage.getItem('userLanguage') || 'english';
      item.querySelectorAll(`[data-tab="characters"], [data-tab="translation"][data-lang="${userLang}"]`).forEach(line => {
        line.style.display = 'block';
      });
    }
  });
}

let audioPlayer = null;
let lessonAudio = null;

function initializeAudioPlayer(audioUrl, thumbnailUrl) {
  if (!audioUrl) return;

  // Create audio element
  lessonAudio = new Audio(audioUrl);

  // Update thumbnail if available
  if (thumbnailUrl) {
    const thumbnailEl = document.querySelector('.w-20.h-20');
    if (thumbnailEl) {
      thumbnailEl.style.backgroundImage = `url(${thumbnailUrl})`;
      thumbnailEl.style.backgroundColor = 'transparent';
    }
  }

  const playBtn = document.getElementById('audioPlayBtn');
  const progressBar = document.getElementById('audioProgress');
  const currentTimeEl = document.getElementById('audioTime');
  const durationEl = document.getElementById('audioDuration');

  // Format time helper
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Play/Pause button handler
  playBtn.addEventListener('click', () => {
    if (lessonAudio.paused) {
      lessonAudio.play();
      playBtn.querySelector('.material-symbols-outlined').textContent = 'pause';
    } else {
      lessonAudio.pause();
      playBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
    }
  });

  // Update progress and time
  lessonAudio.addEventListener('timeupdate', () => {
    const progress = (lessonAudio.currentTime / lessonAudio.duration) * 100;
    progressBar.style.width = `${progress}%`;
    currentTimeEl.textContent = formatTime(lessonAudio.currentTime);
  });

  // Set duration when loaded
  lessonAudio.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(lessonAudio.duration);
  });

  // Reset button when audio ends
  lessonAudio.addEventListener('ended', () => {
    playBtn.querySelector('.material-symbols-outlined').textContent = 'play_arrow';
    progressBar.style.width = '0%';
    currentTimeEl.textContent = '00:00';
  });
}

function playAudio(wordId) {

  // Find the word in the current vocabulary
  const word = currentVocabulary.find(w => w.id == wordId);

  if (!word) {
    console.error('Word not found:', wordId);
    return;
  }

  // If there's an audio URL, play it
  if (word.audio_url) {
    // Stop any currently playing audio
    if (audioPlayer) {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    }

    // Create and play new audio
    audioPlayer = new Audio(word.audio_url);
    audioPlayer.play().catch(err => {
      console.error('Error playing audio:', err);
      tg.showAlert('Audio playback failed');
    });
  } else {
    // Fallback to text-to-speech if no audio URL
    playTextToSpeech(word.chinese);
  }
}

function playTextToSpeech(text) {
  // Use Web Speech API as fallback
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  } else {
    console.log('Text to speech not supported and no audio URL available');
  }
}

async function addToReview(wordId) {

  try {
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) {
      tg.showAlert('User not authenticated');
      return;
    }

    const response = await fetch('/api/review-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, vocabulary_id: wordId })
    });

    if (response.ok) {
      tg.showPopup({ message: '✓ Added to review queue!' });
    } else {
      const data = await response.json();
      if (data.message?.includes('duplicate')) {
        tg.showPopup({ message: 'Already in review queue' });
      } else {
        throw new Error(data.message);
      }
    }
  } catch (error) {
    console.error('Error adding to review:', error);
    tg.showAlert('Failed to add to review queue');
  }
}

async function toggleFavorite(wordId, event) {
  try {
  } catch (e) {}

  try {
    const userId = tg.initDataUnsafe?.user?.id;
    console.log('Toggle favorite - User ID:', userId, 'Word ID:', wordId);
    console.log('Full initDataUnsafe:', tg.initDataUnsafe);
    console.log('Telegram WebApp version:', tg.version);

    if (!userId) {
      console.error('No user ID available. This feature only works inside Telegram bot.');
      alert('Please open this page through the Telegram bot to use favorites.');
      return;
    }

    // Check if already favorited
    console.log('Checking if word is favorited...');
    const checkResponse = await fetch(`/api/favorites?user_id=${userId}&vocabulary_id=${wordId}`);
    const favorites = await checkResponse.json();
    const isFavorited = favorites.length > 0;
    console.log('Is favorited:', isFavorited, 'Favorites:', favorites);

    // Find the button - either from event or by word id
    let btn;
    if (event) {
      btn = event.target.closest('button');
    } else {
      btn = document.querySelector(`button[onclick*="toggleFavorite('${wordId}')"]`);
    }

    if (isFavorited) {
      // Remove from favorites
      const response = await fetch(`/api/favorites/${favorites[0].id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        console.log('Successfully removed from favorites');
        // Update button visual
        if (btn) {
          const icon = btn.querySelector('.material-symbols-outlined');
          icon.textContent = 'favorite_border';
          icon.style.fontVariationSettings = "'FILL' 0";
        }
      }
    } else {
      // Add to favorites
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, vocabulary_id: wordId })
      });
      if (response.ok) {
        console.log('Successfully added to favorites');
        // Update button visual
        if (btn) {
          const icon = btn.querySelector('.material-symbols-outlined');
          icon.textContent = 'favorite';
          icon.style.fontVariationSettings = "'FILL' 1";
        }
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    alert('Failed to update favorites: ' + error.message);
  }
}

function saveGrammar(grammarId) {
  console.log('Saved grammar:', grammarId);
}

function markLessonComplete() {
  if (currentLesson) {
    localStorage.setItem(`lesson${currentLesson.id}_completed`, 'true');
    document.getElementById('completeBtn').style.opacity = '0.5';
  }
}

// Exercise Answer Checking Functions
function onExerciseOptionChange(quizId) {
  // Reset any previous feedback for this question
  const exerciseItem = document.querySelector(`.exercise-item[data-quiz-id="${quizId}"]`);
  if (!exerciseItem) return;

  // Remove previous feedback styling
  const options = exerciseItem.querySelectorAll('.exercise-option');
  options.forEach(opt => {
    opt.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
  });

  // Hide feedback
  const feedbackDiv = exerciseItem.querySelector('.exercise-feedback');
  if (feedbackDiv) feedbackDiv.style.display = 'none';
}

function showFeedback(exerciseItem, quiz, isCorrect, correctAnswer) {
  const feedbackDiv = exerciseItem.querySelector('.exercise-feedback');
  const messageDiv = feedbackDiv.querySelector('.feedback-message');

  if (isCorrect) {
    messageDiv.className = 'feedback-message rounded-lg p-3 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
    messageDiv.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined text-lg">check_circle</span>
        <div class="flex-1">
          <strong>Correct!</strong>
          ${quiz.explanation ? `<p class="mt-1">${quiz.explanation}</p>` : ''}
        </div>
      </div>
    `;
  } else {
    messageDiv.className = 'feedback-message rounded-lg p-3 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
    messageDiv.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined text-lg">cancel</span>
        <div class="flex-1">
          <strong>Incorrect</strong>
          <p class="mt-1">The correct answer is: <strong>${correctAnswer}</strong></p>
          ${quiz.explanation ? `<p class="mt-1">${quiz.explanation}</p>` : ''}
        </div>
      </div>
    `;
  }

  feedbackDiv.style.display = 'block';
}

function checkExerciseAnswers() {
  if (!window.exerciseQuizzes) return;

  let correctCount = 0;

  window.exerciseQuizzes.forEach((quiz) => {
    const exerciseItem = document.querySelector(`.exercise-item[data-quiz-id="${quiz.id}"]`);
    if (!exerciseItem) return;

    const questionType = exerciseItem.dataset.questionType;
    const correctAnswer = exerciseItem.dataset.correctAnswer;
    let userAnswer = null;
    let isCorrect = false;

    // Get user answer based on question type
    switch(questionType) {
      case 'text_input':
        const textInput = document.getElementById(`text_input_${quiz.id}`);
        userAnswer = textInput ? textInput.value.trim() : '';
        isCorrect = userAnswer === correctAnswer;
        if (textInput) {
          textInput.classList.add(isCorrect ? 'border-green-500' : 'border-red-500');
          textInput.disabled = true;
        }
        break;

      case 'sentence_ordering':
        const builtSentence = window.sentenceBuilders[quiz.id] ? window.sentenceBuilders[quiz.id].join('') : '';
        userAnswer = builtSentence;
        isCorrect = builtSentence === correctAnswer;
        const answerArea = document.getElementById(`answerArea_${quiz.id}`);
        if (answerArea) {
          answerArea.classList.add(isCorrect ? 'border-green-500' : 'border-red-500');
        }
        break;

      case 'error_correction':
        userAnswer = window.errorSelections[quiz.id] || '';
        isCorrect = userAnswer === correctAnswer;
        break;

      case 'true_false':
        const tfRadio = exerciseItem.querySelector('input[type="radio"]:checked');
        if (tfRadio) {
          userAnswer = tfRadio.value;
          isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
        }
        break;

      case 'fill_gap':
      case 'multiple_choice':
      case 'translation':
      default:
        const selectedRadio = exerciseItem.querySelector('input[type="radio"]:checked');
        if (selectedRadio) {
          const selectedIndex = parseInt(selectedRadio.value);
          const correctIndex = parseInt(exerciseItem.dataset.correctIndex);
          isCorrect = selectedIndex === correctIndex;

          const options = exerciseItem.querySelectorAll('.exercise-option');
          const selectedOption = options[selectedIndex];
          const correctOption = options[correctIndex];

          if (isCorrect) {
            selectedOption?.classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
          } else {
            selectedOption?.classList.add('border-red-500', 'bg-red-50', 'dark:bg-red-900/20');
            correctOption?.classList.add('border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
          }
        }
    }

    if (isCorrect) correctCount++;

    // Show feedback
    showFeedback(exerciseItem, quiz, isCorrect, correctAnswer);
  });

  // Update progress counter
  const correctCountEl = document.getElementById('correctCount');
  if (correctCountEl) correctCountEl.textContent = correctCount;

  // Disable radio buttons after checking
  document.querySelectorAll('.exercise-item input[type="radio"]').forEach(radio => {
    radio.disabled = true;
  });

  // Change button to "Reset" functionality
  const checkBtn = document.getElementById('checkAnswersBtn');
  if (checkBtn) {
    checkBtn.innerHTML = `
      <span class="material-symbols-outlined">refresh</span>
      <span>Reset Exercises</span>
    `;
    checkBtn.onclick = resetExercises;
  }
}

function resetExercises() {
  // Re-enable all radio buttons
  document.querySelectorAll('.exercise-item input[type="radio"]').forEach(radio => {
    radio.disabled = false;
    radio.checked = false;
  });

  // Remove all visual feedback
  document.querySelectorAll('.exercise-option').forEach(opt => {
    opt.classList.remove('border-red-500', 'bg-red-50', 'dark:bg-red-900/20', 'border-green-500', 'bg-green-50', 'dark:bg-green-900/20');
  });

  // Hide all feedback messages
  document.querySelectorAll('.exercise-feedback').forEach(feedback => {
    feedback.style.display = 'none';
  });

  // Reset counter
  const correctCountEl = document.getElementById('correctCount');
  if (correctCountEl) correctCountEl.textContent = '0';

  // Change button back to "Check Answers"
  const checkBtn = document.getElementById('checkAnswersBtn');
  if (checkBtn) {
    checkBtn.innerHTML = `
      <span class="material-symbols-outlined">check_circle</span>
      <span>Check Answers</span>
    `;
    checkBtn.onclick = checkExerciseAnswers;
  }
}

// Complete lesson function
async function completeLesson() {
  const button = document.getElementById('completeLessonBtn');
  if (!currentLesson) {
    alert('⚠️ Lesson not loaded');
    return;
  }

  // Disable button to prevent double clicks
  button.disabled = true;
  button.classList.add('opacity-50', 'cursor-not-allowed');

  try {
    // Get user info from Telegram
    const userId = tg.initDataUnsafe?.user?.id;

    if (!userId) {
      alert('⚠️ Unable to identify user');
      button.disabled = false;
      button.classList.remove('opacity-50', 'cursor-not-allowed');
      return;
    }

    // Mark lesson as complete
    const response = await fetch('/api/user-progress/complete-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-User-Id': userId.toString()
      },
      body: JSON.stringify({
        lesson_id: currentLesson.id
      })
    });

    if (!response.ok) {
      throw new Error('Failed to mark lesson as complete');
    }

    // Update button to show completion
    button.innerHTML = `
      <span class="material-symbols-outlined">done_all</span>
      <span>Lesson Completed!</span>
    `;
    button.classList.add('bg-success');

    // Show success message
    tg.showAlert('🎉 Congratulations! Lesson completed successfully!', () => {
      // Navigate back to lesson list
      window.location.href = '/lessons.html';
    });

  } catch (error) {
    console.error('Error completing lesson:', error);
    alert('❌ Failed to mark lesson as complete. Please try again.');
    button.disabled = false;
    button.classList.remove('opacity-50', 'cursor-not-allowed');
  }
}

// ========== SECTION PROGRESS TRACKING ==========

async function loadLessonProgress(lessonId) {
  try {
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) return;

    const response = await fetch(`/api/user-progress/lessons/${lessonId}`, {
      headers: {
        'X-Telegram-User-Id': userId.toString()
      }
    });

    if (response.ok) {
      const progress = await response.json();
      updateProgressUI(progress);
    }
  } catch (error) {
    console.error('Error loading lesson progress:', error);
  }
}

function updateProgressUI(progress) {
  if (!progress || !progress.section_progress) return;

  const sections = progress.section_progress;
  const sectionNames = ['audio', 'dialogue', 'vocab', 'grammar', 'practice'];

  // Update each section circle
  sectionNames.forEach(section => {
    const circle = document.querySelector(`[data-section="${section}"] .progress-circle`);
    if (circle && sections[section]) {
      circle.classList.remove('bg-gray-200', 'dark:bg-gray-700');
      circle.classList.add('bg-primary', 'text-white');
      circle.innerHTML = '<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
    }
  });

  // Calculate and update progress percentage
  const completedCount = Object.values(sections).filter(Boolean).length;
  const percentage = Math.round((completedCount / 5) * 100);
  const progressText = document.getElementById('progressPercentage');
  if (progressText) {
    progressText.textContent = `${percentage}%`;
  }
}

async function markSectionComplete(section) {
  if (!currentLesson) return;

  try {
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) return;

    const response = await fetch('/api/user-progress/update-section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-User-Id': userId.toString()
      },
      body: JSON.stringify({
        lesson_id: currentLesson.id,
        section: section
      })
    });

    if (response.ok) {
      const result = await response.json();
      updateProgressUI(result.data);
    }
  } catch (error) {
    console.error('Error marking section complete:', error);
  }
}

document.addEventListener('DOMContentLoaded', initializePage);
