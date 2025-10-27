const tg = window.Telegram.WebApp;

let currentLesson = null;
let currentDialogueTab = 'pinyin';
let lessons = [];

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

  const sorted = dialogues.sort((a, b) => (a.dialogue_order || 0) - (b.dialogue_order || 0));
  
  container.innerHTML = sorted.map(dialogue => `
    <div class="flex flex-col gap-1 dialogue-item">
      ${dialogue.speaker ? `<p class="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">${dialogue.speaker}</p>` : ''}
      <p class="text-lg font-medium" data-tab="characters">${dialogue.chinese}</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="pinyin" style="display: none;">${dialogue.pinyin}</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="english">${dialogue.english}</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="uzbek">${dialogue.uzbek || ''}</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark" data-tab="translation" style="display: none;" data-lang="russian">${dialogue.russian || ''}</p>
    </div>
  `).join('');
  
  updateDialogueDisplay();
}

async function loadVocabulary(lessonId) {
  try {
    const response = await fetch(`/api/vocabulary?lesson_id=${lessonId}`);
    if (!response.ok) throw new Error('Failed to load vocabulary');

    const vocabulary = await response.json();
    renderVocabulary(vocabulary);
  } catch (error) {
    console.error('Error loading vocabulary:', error);
    document.getElementById('vocabularyContainer').innerHTML = '<p class="text-center text-text-secondary-light">No vocabulary available</p>';
  }
}

function renderVocabulary(vocabulary) {
  const container = document.getElementById('vocabularyContainer');
  
  if (!vocabulary || vocabulary.length === 0) {
    container.innerHTML = '<p class="text-center text-text-secondary-light">No vocabulary available</p>';
    return;
  }

  container.innerHTML = vocabulary.map(word => `
    <div class="flex items-center gap-4 p-3 rounded-lg bg-background-light dark:bg-background-dark">
      <div class="flex-1">
        <p class="text-xl font-semibold">${word.chinese}</p>
        <p class="text-text-secondary-light dark:text-text-secondary-dark text-sm">${word.pinyin} (${word.pos || 'n.'})</p>
        <p class="text-sm">${word.english}</p>
      </div>
      <button onclick="playAudio('${word.id}')" class="flex items-center justify-center h-10 w-10 rounded-full text-primary bg-primary/20 hover:bg-primary/30">
        <span class="material-symbols-outlined">volume_up</span>
      </button>
    </div>
  `).join('');
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
    
    return `
      <div class="flex flex-col gap-3 rounded-lg border-l-4 ${borderColor} ${bgColor} p-4">
        <div class="flex items-start justify-between">
          <h3 class="text-base font-bold text-text-primary-light dark:text-text-primary-dark">${point.title}</h3>
          <button onclick="saveGrammar(${point.id})" class="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary-light transition-colors hover:bg-black/10 dark:text-text-secondary-dark dark:hover:bg-white/10">
            <span class="material-symbols-outlined text-xl">bookmark_border</span>
          </button>
        </div>
        <p class="text-sm text-text-secondary-light dark:text-text-secondary-dark">${point.explanation}</p>
      </div>
    `;
  }).join('');
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

function renderQuizzes(quizzes) {
  const container = document.getElementById('quizzesContainer');
  
  if (!quizzes || quizzes.length === 0) {
    container.innerHTML = '<p class="text-center text-text-secondary-light">No exercises available</p>';
    return;
  }

  container.innerHTML = quizzes.map((quiz, index) => {
    const options = JSON.parse(quiz.options || '[]');
    const correctAnswer = quiz.correct_answer;
    
    return `
      <div class="flex flex-col gap-4">
        <p class="font-medium"><span class="font-bold">${index + 1}.</span> ${quiz.question}</p>
        <div class="grid grid-cols-1 gap-2" role="radiogroup">
          ${options.map((option, optIndex) => `
            <label class="flex items-center gap-3 cursor-pointer rounded-lg border border-border-light dark:border-border-dark p-3 has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
              <input class="h-5 w-5 border-2 border-border-light dark:border-border-dark text-primary focus:ring-primary checked:bg-primary" name="quiz_${quiz.id}" type="radio" value="${optIndex}" ${optIndex === correctAnswer ? 'checked' : ''} />
              <span>${option}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
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

function playAudio(wordId) {
  tg.HapticFeedback.impactOccurred('light');
  console.log('Playing audio for word:', wordId);
}

function saveGrammar(grammarId) {
  tg.HapticFeedback.notificationOccurred('success');
  console.log('Saved grammar:', grammarId);
}

function markLessonComplete() {
  if (currentLesson) {
    localStorage.setItem(`lesson${currentLesson.id}_completed`, 'true');
    tg.HapticFeedback.notificationOccurred('success');
    document.getElementById('completeBtn').style.opacity = '0.5';
  }
}

document.addEventListener('DOMContentLoaded', initializePage);
