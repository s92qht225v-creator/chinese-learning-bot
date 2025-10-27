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
        <button onclick="toggleFavorite('${word.id}')" aria-label="Add ${word.chinese} to favorites" class="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary-light transition-colors hover:bg-red-500/10 hover:text-red-500 focus-visible:text-red-500 dark:text-text-secondary-dark dark:hover:bg-red-400/10 dark:hover:text-red-400">
          <span class="material-symbols-outlined text-xl">favorite</span>
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
  tg.HapticFeedback.impactOccurred('light');

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
  tg.HapticFeedback.impactOccurred('medium');

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

async function toggleFavorite(wordId) {
  tg.HapticFeedback.impactOccurred('light');

  try {
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) {
      tg.showAlert('User not authenticated');
      return;
    }

    // Check if already favorited
    const checkResponse = await fetch(`/api/favorites?user_id=${userId}&vocabulary_id=${wordId}`);
    const favorites = await checkResponse.json();
    const isFavorited = favorites.length > 0;

    if (isFavorited) {
      // Remove from favorites
      const response = await fetch(`/api/favorites/${favorites[0].id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        tg.showPopup({ message: '♡ Removed from favorites' });
        // Update button visual
        const btn = event.target.closest('button');
        if (btn) btn.querySelector('.material-symbols-outlined').textContent = 'favorite_border';
      }
    } else {
      // Add to favorites
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, vocabulary_id: wordId })
      });
      if (response.ok) {
        tg.showPopup({ message: '❤️ Added to favorites!' });
        // Update button visual
        const btn = event.target.closest('button');
        if (btn) btn.querySelector('.material-symbols-outlined').textContent = 'favorite';
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    tg.showAlert('Failed to update favorites');
  }
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
