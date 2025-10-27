// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Supabase config
const SUPABASE_URL = 'https://aveoqedskzbbgcazpskn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZW9xZWRza3piYmdjYXpwc2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Nzk1MjYsImV4cCI6MjA3NzA1NTUyNn0.NfTfTWKNDmsmiLF_MX5XGGq48xbX8OOUWhVmb5U-VXM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Elements
const backBtn = document.getElementById('backBtn');
const levelRadios = document.querySelectorAll('input[name="hsk_level"]');
const lessonsContainer = document.querySelector('.flex.flex-col.gap-3.px-4.pb-4');

let currentHskLevel = 1;

// Back button handler
backBtn.addEventListener('click', () => {
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }
  window.location.href = '/home.html';
});

// Level selector handler
levelRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const level = parseInt(e.target.value.replace('HSK ', ''));
    currentHskLevel = level;

    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }

    document.querySelector('h1').textContent = `HSK ${level} Lessons`;
    loadLessons(level);
  });
});

// Load lessons from Supabase
async function loadLessons(hskLevel = 1) {
  try {
    const { data: lessons, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('hsk_level', hskLevel)
      .eq('status', 'published')
      .order('lesson_number', { ascending: true });

    if (error) throw error;

    lessonsContainer.innerHTML = '';

    if (!lessons || lessons.length === 0) {
      lessonsContainer.innerHTML = '<p class="text-center text-text-muted-light dark:text-text-muted-dark p-8">No lessons available for this level yet.</p>';
      return;
    }

    lessons.forEach((lesson, index) => {
      const card = createLessonCard(lesson, index);
      lessonsContainer.appendChild(card);
    });

  } catch (error) {
    console.error('Error loading lessons:', error);
    lessonsContainer.innerHTML = '<p class="text-center text-red-500 p-8">Failed to load lessons. Please try again.</p>';
  }
}

// Create lesson card HTML
function createLessonCard(lesson, index) {
  const div = document.createElement('div');

  div.className = 'flex items-center gap-4 bg-white dark:bg-gray-800 p-4 min-h-[72px] rounded-xl shadow-sm justify-between';
  div.innerHTML = `
    <div class="flex items-center gap-4 w-full">
      <div class="relative size-12 shrink-0">
        <svg class="size-full" height="36" viewbox="0 0 36 36" width="36" xmlns="http://www.w3.org/2000/svg">
          <circle class="stroke-current text-gray-200 dark:text-gray-700" cx="18" cy="18" fill="transparent" r="16" stroke-width="3"></circle>
        </svg>
        <div class="absolute inset-0 flex items-center justify-center text-text-light dark:text-text-dark text-lg font-bold">${lesson.lesson_number}</div>
      </div>
      <div class="flex flex-col justify-center flex-1 min-w-0">
        <p class="text-base font-medium leading-normal line-clamp-1 text-text-light dark:text-text-dark">${lesson.title}</p>
        <p class="text-sm font-normal leading-normal text-text-muted-light dark:text-text-muted-dark line-clamp-2">${lesson.description || ''}</p>
      </div>
    </div>
    <button class="shrink-0 text-primary text-base font-medium leading-normal" onclick="openLesson(${lesson.id})">Start</button>
  `;

  return div;
}

// Open lesson
window.openLesson = function(lessonId) {
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
  window.location.href = `/lesson.html?id=${lessonId}`;
};

// Load lessons on page load
loadLessons(currentHskLevel);
