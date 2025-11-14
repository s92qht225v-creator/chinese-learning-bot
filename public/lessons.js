// Use the global tg from main-app.html (no need to declare it again)
// If running standalone (not in main-app), initialize it on window object
if (typeof tg === 'undefined') {
  window.tg = window.Telegram.WebApp;
  window.tg.expand();
  window.tg.ready();
}

// Supabase config
var SUPABASE_URL = 'https://aveoqedskzbbgcazpskn.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZW9xZWRza3piYmdjYXpwc2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Nzk1MjYsImV4cCI6MjA3NzA1NTUyNn0.NfTfTWKNDmsmiLF_MX5XGGq48xbX8OOUWhVmb5U-VXM';

// Initialize Supabase client (wait for library to load)
var supabaseClient;
function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  // Wait for Supabase library to be available
  if (!window.supabase || !window.supabase.createClient) {
    return null;
  }

  try {
    // Supabase v2 UMD build exports the whole library to window.supabase
    // createClient is a function on that object
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');
    return supabaseClient;
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error);
    return null;
  }
}

// Elements
var pageTitle = document.getElementById('pageTitle');
var levelRadios = document.querySelectorAll('input[name="hsk_level"]');
var lessonsContainer = document.getElementById('lessonsContainer');
var progressBar = document.getElementById('progressBar');
var progressText = document.getElementById('progressText');
var continueSection = document.getElementById('continueSection');
var continueTitle = document.getElementById('continueTitle');

var currentHskLevel = 1;
var lessonProgress = {}; // Store lesson completion status

// Setup Telegram WebApp BackButton
if (window.tg && window.tg.BackButton) {
  window.tg.BackButton.show();
  window.tg.BackButton.onClick(() => {
    window.history.back();
  });
}

// Level selector handler
levelRadios.forEach(radio => {
  // Remove old listener if exists
  if (radio._lessonsChangeHandler) {
    radio.removeEventListener('change', radio._lessonsChangeHandler);
  }

  var changeHandler = (e) => {
    const level = parseInt(e.target.value);
    currentHskLevel = level;

    // Update visual styling for all tabs
    levelRadios.forEach(r => {
      const tabContent = r.nextElementSibling;
      if (r.checked) {
        tabContent.style.background = '#448fe4';
        tabContent.style.color = 'white';
        tabContent.style.borderColor = '#448fe4';
        tabContent.style.transform = 'scale(1.05)';
        tabContent.style.boxShadow = '0 4px 12px rgba(68, 143, 228, 0.3)';
      } else {
        tabContent.style.background = '';
        tabContent.style.color = '';
        tabContent.style.borderColor = '';
        tabContent.style.transform = '';
        tabContent.style.boxShadow = '';
      }
    });

    pageTitle.textContent = `HSK ${level} Lessons`;
    loadLessons(level);
  };

  radio._lessonsChangeHandler = changeHandler;
  radio.addEventListener('change', changeHandler);
});

// Load lessons from Supabase
async function loadLessons(hskLevel = 1) {
  try {
    console.log('🔄 Loading lessons for HSK level:', hskLevel);
    lessonsContainer.innerHTML = '<div class="text-center py-8"><div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div></div>';

    // Wait for Supabase client with retry (max 500ms)
    let client = getSupabaseClient();
    let retries = 0;
    while (!client && retries < 5) {
      await new Promise(resolve => setTimeout(resolve, 50));
      client = getSupabaseClient();
      retries++;
    }

    if (!client) {
      throw new Error('Supabase client not available after 500ms');
    }

    const { data: lessons, error } = await client
      .from('lessons')
      .select('*')
      .eq('hsk_level', hskLevel)
      .eq('status', 'published')
      .order('lesson_number', { ascending: true });

    console.log('📦 Supabase response:', { lessons, error, count: lessons?.length });

    if (error) {
      console.error('❌ Supabase error:', error);
      throw error;
    }

    lessonsContainer.innerHTML = '';

    if (!lessons || lessons.length === 0) {
      console.log('⚠️ No lessons found for HSK', hskLevel);
      // Update progress section to show 0/0
      progressText.textContent = '0/0';
      progressBar.style.width = '0%';
      continueSection.style.display = 'none';
      
      lessonsContainer.innerHTML = `
        <div class="text-center py-8 px-4">
          <div class="rounded-2xl bg-surface-light dark:bg-surface-dark p-8 border-2 border-dashed border-border-light dark:border-border-dark">
            <span class="material-symbols-outlined text-6xl text-primary mb-4 inline-block">construction</span>
            <h3 class="text-xl font-bold mb-2">HSK ${hskLevel} Coming Soon!</h3>
            <p class="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              New lessons are being prepared. Check back soon!
            </p>
            ${hskLevel > 1 ? `
              <button onclick="switchToHSK1()" class="bg-primary text-white px-8 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all">
                ← Back to HSK 1
              </button>
            ` : `
              <p class="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                Lessons will be added soon
              </p>
            `}
          </div>
        </div>
      `;
      return;
    }

    console.log('✅ Found', lessons.length, 'lessons:', lessons.map(l => l.title));

    // Load lesson progress
    await loadProgress(lessons);

    // Calculate overall progress
    updateOverallProgress(lessons);

    // Render lessons
    lessons.forEach((lesson, index) => {
      const card = createLessonCard(lesson, index);
      lessonsContainer.appendChild(card);
    });

    console.log('✅ Lessons rendered successfully');

  } catch (error) {
    console.error('❌ Error loading lessons:', error);
    lessonsContainer.innerHTML = `
      <div class="text-center py-12">
        <span class="material-symbols-outlined text-6xl text-red-500 mb-3">error</span>
        <p class="text-red-500 mb-4">Failed to load lessons</p>
        <button onclick="loadLessons(${hskLevel})" class="bg-primary text-white px-6 py-2 rounded-xl font-semibold">
          Retry
        </button>
      </div>
    `;
  }
}

// Load lesson progress (mock data for now - replace with actual API call)
async function loadProgress(lessons) {
  try {
    const userId = tg.initDataUnsafe?.user?.id;
    if (!userId) {
      lessonProgress = {};
      return;
    }

    // Fetch progress for all lessons
    const response = await fetch('/api/user-progress/lessons', {
      headers: {
        'X-Telegram-User-Id': userId.toString()
      }
    });

    if (response.ok) {
      const progressData = await response.json();

      // Convert array of progress records to map by lesson_number
      lessonProgress = {};

      if (Array.isArray(progressData)) {
        // Find lesson details to map lesson_id to lesson_number
        progressData.forEach(record => {
          const lesson = lessons.find(l => l.id === record.lesson_id);
          if (lesson) {
            // Calculate progress percentage from section_progress
            let progressPercent = 0;
            if (record.section_progress) {
              const sections = Object.values(record.section_progress);
              const completedSections = sections.filter(Boolean).length;
              progressPercent = Math.round((completedSections / 5) * 100);
            }

            lessonProgress[lesson.lesson_number] = {
              completed: record.completed || false,
              progress: progressPercent
            };
          }
        });
      }
    }
  } catch (error) {
    console.error('Error loading progress:', error);
    lessonProgress = {};
  }
}

// Update overall progress
function updateOverallProgress(lessons) {
  const completed = lessons.filter(l => lessonProgress[l.lesson_number]?.completed).length;
  const total = lessons.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  console.log('📊 Progress update:', { completed, total, percentage });
  progressText.textContent = `${completed}/${total}`;
  progressBar.style.width = `${percentage}%`;

  // Show continue section if there's an in-progress lesson
  const inProgress = lessons.find(l => 
    !lessonProgress[l.lesson_number]?.completed && 
    lessonProgress[l.lesson_number]?.progress > 0
  );

  if (inProgress) {
    continueTitle.textContent = `Lesson ${inProgress.lesson_number}: ${inProgress.title}`;
    continueSection.style.display = 'block';
    continueSection.dataset.lessonId = inProgress.id;
  } else {
    continueSection.style.display = 'none';
  }
}

// Create enhanced lesson card
function createLessonCard(lesson, index) {
  const div = document.createElement('div');
  const progress = lessonProgress[lesson.lesson_number] || { completed: false, progress: 0 };
  const isLocked = index > 0 && !lessonProgress[index]?.completed; // Lock if previous lesson not completed
  
  // Status icons and colors
  let statusIcon = '';
  let statusColor = 'text-text-secondary-light';
  let cardClass = 'lesson-card';
  
  if (progress.completed) {
    statusIcon = 'check_circle';
    statusColor = 'text-green-500';
  } else if (progress.progress > 0) {
    statusIcon = 'play_circle';
    statusColor = 'text-primary';
  } else if (isLocked) {
    statusIcon = 'lock';
    statusColor = 'text-text-secondary-light';
    cardClass += ' locked';
  } else {
    statusIcon = 'radio_button_unchecked';
  }

  div.className = `${cardClass} rounded-2xl bg-surface-light dark:bg-surface-dark p-5 shadow-sm border border-border-light dark:border-border-dark`;
  
  div.innerHTML = `
    <div class="flex items-center gap-4">
      
      <!-- Progress Circle -->
      <div class="relative flex-shrink-0">
        <svg class="w-16 h-16 transform -rotate-90">
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" class="text-background-light dark:text-background-dark" />
          <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" class="text-primary transition-all duration-500" 
            stroke-dasharray="${2 * Math.PI * 28}" 
            stroke-dashoffset="${2 * Math.PI * 28 * (1 - progress.progress / 100)}" 
            stroke-linecap="round" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="material-symbols-outlined ${statusColor} text-2xl ${progress.completed ? 'filled' : ''}">${statusIcon}</span>
        </div>
      </div>

      <!-- Lesson Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <p class="text-lg font-bold">Lesson ${lesson.lesson_number}</p>
          ${progress.completed ? '<span class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-semibold">Completed</span>' : ''}
          ${progress.progress > 0 && !progress.completed ? `<span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">${progress.progress}%</span>` : ''}
          ${isLocked ? '<span class="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-semibold">Locked</span>' : ''}
        </div>
        <p class="font-semibold text-text-primary-light dark:text-text-primary-dark mb-1">${lesson.title}</p>
        <p class="text-sm text-text-secondary-light dark:text-text-secondary-dark line-clamp-1">${lesson.description || 'Learn essential vocabulary and phrases'}</p>
      </div>

      <!-- Action Button -->
      <div class="flex-shrink-0">
        ${isLocked ? `
          <button disabled class="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 font-semibold cursor-not-allowed">
            Locked
          </button>
        ` : progress.completed ? `
          <button onclick="openLesson(${lesson.id})" class="start-btn px-4 py-2 rounded-xl bg-primary/10 text-primary font-semibold hover:bg-primary/20">
            Review
          </button>
        ` : progress.progress > 0 ? `
          <button onclick="openLesson(${lesson.id})" class="start-btn px-6 py-2 rounded-xl bg-primary text-white font-semibold shadow-md">
            Continue
          </button>
        ` : `
          <button onclick="openLesson(${lesson.id})" class="start-btn px-6 py-2 rounded-xl bg-primary text-white font-semibold shadow-md">
            Start
          </button>
        `}
      </div>

    </div>
  `;

  return div;
}

// Continue learning button
window.continueLearning = function() {
  const lessonId = continueSection.dataset.lessonId;
  if (lessonId) {
    openLesson(lessonId);
  }
};

// Open lesson
window.openLesson = function(lessonId) {
  window.location.href = `/lesson.html?id=${lessonId}`;
};

// Switch back to HSK 1
window.switchToHSK1 = function() {
  // Click the HSK 1 radio button
  const hsk1Radio = document.querySelector('input[name="hsk_level"][value="1"]');
  if (hsk1Radio) {
    hsk1Radio.checked = true;
    hsk1Radio.dispatchEvent(new Event('change'));
  }
};

// Initialize tab styling on page load
function initializeTabStyling() {
  console.log('Initializing tab styling, found radios:', levelRadios.length);
  levelRadios.forEach((r, index) => {
    const tabContent = r.nextElementSibling;
    console.log(`Radio ${index}: checked=${r.checked}, hasNextElement=${!!tabContent}`);
    if (r.checked && tabContent) {
      console.log('Applying active styling to tab', index);
      tabContent.style.background = '#448fe4';
      tabContent.style.color = 'white';
      tabContent.style.borderColor = '#448fe4';
      tabContent.style.transform = 'scale(1.05)';
      tabContent.style.boxShadow = '0 4px 12px rgba(68, 143, 228, 0.3)';
    }
  });
}

// Initialize on page load with slight delay to ensure DOM is ready
setTimeout(() => {
  initializeTabStyling();
  loadLessons(currentHskLevel);
}, 100);

// Apply i18n if available
if (window.i18n) {
  window.i18n.init();
}