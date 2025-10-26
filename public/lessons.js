// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Elements
const backBtn = document.getElementById('backBtn');
const levelRadios = document.querySelectorAll('input[name="hsk_level"]');

// Back button handler
backBtn.addEventListener('click', () => {
  // Haptic feedback
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }
  
  // Go to home page
  window.location.href = '/home.html';
});

// Level selector handler
levelRadios.forEach(radio => {
  radio.addEventListener('change', (e) => {
    const level = e.target.value;
    
    // Haptic feedback
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    
    // Update page title
    document.querySelector('h1').textContent = `${level} Lessons`;
    
    // Here you would normally load the appropriate lessons for the selected level
    console.log(`Switched to ${level}`);
  });
});

// Lesson button handlers
document.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button || button.id === 'backBtn') return;
  
  const buttonText = button.textContent.trim();
  
  // Haptic feedback
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
  
  if (buttonText === 'Review' || buttonText === 'Start') {
    // Navigate to lesson content
    console.log('Opening lesson...');
    alert('Lesson content will be available soon!');
  } else if (button.querySelector('.material-symbols-outlined')) {
    // Play button clicked for Lesson 2 (in progress)
    console.log('Continuing lesson 2...');
    window.location.href = '/lesson.html';
  }
});
