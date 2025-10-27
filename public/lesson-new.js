// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Get lesson ID from URL
const urlParams = new URLSearchParams(window.location.search);
const lessonId = urlParams.get('id');

// State
let currentLesson = null;
let currentDialogues = [];

// Load lesson data on page load
async function loadLessonData() {
  try {
    console.log(`[LESSON] Loading lesson with ID: ${lessonId}`);
    if (!lessonId) {
      console.error('No lesson ID provided');
      document.body.innerHTML = '<p class="p-8 text-center">Error: No lesson selected</p>';
      return;
    }
    
    console.log(`[LESSON] Fetching from /api/lessons/${lessonId}`);
    // Fetch lesson and dialogues in parallel
    const [lessonRes, dialoguesRes] = await Promise.all([
      fetch(`/api/lessons/${lessonId}`),
      fetch(`/api/lessons/${lessonId}/dialogues`)
    ]);
    
    if (!lessonRes.ok) throw new Error('Failed to load lesson');
    
    currentLesson = await lessonRes.json();
    console.log('[LESSON] Loaded lesson:', currentLesson);
    
    if (dialoguesRes.ok) {
      currentDialogues = await dialoguesRes.json();
      console.log('[LESSON] Loaded dialogues:', currentDialogues);
    }
    
    console.log('[LESSON] Updating page with lesson data');
    // Update page elements with lesson data
    updatePageWithLessonData();
    
  } catch (error) {
    console.error('Error loading lesson:', error);
    document.body.innerHTML = '<p class="p-8 text-center">Error loading lesson. Please try again.</p>';
  }
}

function updatePageWithLessonData() {
  // Update title
  document.title = `HSK ${currentLesson.hsk_level}: Lesson ${currentLesson.lesson_number} - ${currentLesson.title}`;
  document.querySelector('h1').textContent = `HSK ${currentLesson.hsk_level}: Lesson ${currentLesson.lesson_number}`;
  
  // Detect user language
  const userLang = localStorage.getItem('userLanguage') || navigator.language?.split('-')[0] || 'en';
  const translationField = userLang === 'ru' ? 'russian' : userLang === 'uz' ? 'uzbek' : 'english';
  
  // Build dialogues HTML with tabs
  let dialoguesHTML = '';
  if (currentDialogues.length > 0) {
    // Build dialogue content for each tab
    const charactersOnly = currentDialogues.map(d => `
      <div class="flex flex-col gap-1">
        <p class="text-lg">${d.chinese || d.content || ''}</p>
      </div>
    `).join('');
    
    const charactersPinyin = currentDialogues.map(d => `
      <div class="flex flex-col gap-1">
        <p class="text-lg">${d.chinese || d.content || ''}</p>
        ${d.pinyin ? `<p class="text-text-secondary-light dark:text-text-secondary-dark">${d.pinyin}</p>` : ''}
      </div>
    `).join('');
    
    const fullTranslation = currentDialogues.map(d => {
      let translation = '';
      if (translationField === 'russian' && d.russian) translation = d.russian;
      else if (translationField === 'uzbek' && d.uzbek) translation = d.uzbek;
      else translation = d.english || '';
      
      return `
        <div class="flex flex-col gap-1">
          <p class="text-lg">${translation}</p>
        </div>
      `;
    }).join('');
    
    dialoguesHTML = `
      <details class="flex flex-col rounded-lg bg-surface-light dark:bg-surface-dark shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.1)] group" open>
        <summary class="flex cursor-pointer items-center justify-between gap-6 p-4">
          <p class="text-base font-medium leading-normal">Dialogue</p>
          <span class="material-symbols-outlined transition-transform duration-200 group-open:rotate-180">expand_more</span>
        </summary>
        <div class="border-t border-border-light dark:border-border-dark px-4 pt-2 pb-4">
          <div class="pb-4">
            <div class="flex border-b border-border-light dark:border-border-dark text-center">
              <a class="dialogue-tab flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-text-secondary-light dark:text-text-secondary-dark pb-3 pt-2 flex-1 cursor-pointer" href="#" data-tab="characters">
                <p class="text-sm font-bold leading-normal tracking-[0.015em]">Characters Only</p>
              </a>
              <a class="dialogue-tab flex flex-col items-center justify-center border-b-[3px] border-b-primary text-primary pb-3 pt-2 flex-1 cursor-pointer" href="#" data-tab="pinyin">
                <p class="text-sm font-bold leading-normal tracking-[0.015em]">Characters + Pinyin</p>
              </a>
              <a class="dialogue-tab flex flex-col items-center justify-center border-b-[3px] border-b-transparent text-text-secondary-light dark:text-text-secondary-dark pb-3 pt-2 flex-1 cursor-pointer" href="#" data-tab="translation">
                <p class="text-sm font-bold leading-normal tracking-[0.015em]">Full Translation</p>
              </a>
            </div>
          </div>
          <div id="dialogueContent" class="flex flex-col gap-4">
            ${charactersPinyin}
          </div>
        </div>
      </details>
    `;
  }

  // Update lesson content
  const mainContent = document.querySelector('main');
  if (mainContent) {
    mainContent.innerHTML = `
      <!-- Media Player -->
      <div class="px-4 py-4">
        <div class="flex flex-col gap-4 rounded-xl bg-surface-light dark:bg-surface-dark p-4 shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <div class="flex items-center gap-4 overflow-hidden">
            <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-14 shrink-0" style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'></div>
            <div class="flex flex-col gap-1 flex-1 min-w-0">
              <p class="text-base font-bold leading-tight">${currentLesson.title}</p>
              <p class="text-sm font-normal leading-normal text-text-secondary-light dark:text-text-secondary-dark">${currentLesson.description || 'Lesson content'}</p>
            </div>
            <button id="playBtn" class="flex shrink-0 items-center justify-center rounded-full size-12 bg-primary text-white shadow-md">
              <span class="material-symbols-outlined text-3xl">play_arrow</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Lesson Content -->
      <div class="flex flex-col px-4 pt-6 gap-3">
        <details class="flex flex-col rounded-lg bg-surface-light dark:bg-surface-dark shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.1)] group" open>
          <summary class="flex cursor-pointer items-center justify-between gap-6 p-4">
            <p class="text-base font-medium leading-normal">Lesson Content</p>
            <span class="material-symbols-outlined transition-transform duration-200 group-open:rotate-180">expand_more</span>
          </summary>
          <div class="border-t border-border-light dark:border-border-dark px-4 pt-4 pb-4">
            <div class="flex flex-col gap-4">
              <h3 class="text-lg font-bold">${currentLesson.title}</h3>
              <p class="text-base">${currentLesson.description || 'No description available.'}</p>
            </div>
          </div>
        </details>
        ${dialoguesHTML}
      </div>
    `;
  }
  
  // Re-initialize event handlers
  initializeEventHandlers();
}

function initializeEventHandlers() {
  // Back button
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
      window.history.back();
    });
  }

  // Play button
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
      }
      
      const icon = playBtn.querySelector('span');
      if (icon.textContent === 'play_arrow') {
        icon.textContent = 'pause';
        // Audio playback would start here
        setTimeout(() => {
          icon.textContent = 'play_arrow';
        }, 3000);
      } else {
        icon.textContent = 'play_arrow';
      }
    });
  }

  // Completed button
  const completedBtn = document.getElementById('completedBtn');
  if (completedBtn) {
    completedBtn.addEventListener('click', () => {
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      const isCompleted = completedBtn.classList.toggle('bg-success');
      completedBtn.classList.toggle('border-success');
      
      if (isCompleted) {
        completedBtn.querySelector('span').style.color = 'white';
        localStorage.setItem(`lesson${lessonId}_completed`, 'true');
        // Lesson marked as complete
      } else {
        completedBtn.querySelector('span').style.color = 'transparent';
        localStorage.removeItem(`lesson${lessonId}_completed`);
      }
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLessonData();
});