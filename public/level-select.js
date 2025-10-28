// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Elements
const radioInputs = document.querySelectorAll('input[name="hsk-level"]');
const continueBtn = document.getElementById('continueBtn');
const notSureBtn = document.getElementById('notSureBtn');

let selectedLevel = null;

// Enable continue button when a level is selected
radioInputs.forEach(radio => {
  radio.addEventListener('change', (e) => {
    selectedLevel = e.target.value;
    continueBtn.disabled = false;
    
    // Haptic feedback
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  });
});

// Handle "I'm not sure" button
notSureBtn.addEventListener('click', () => {
  // Default to HSK 1 for beginners who aren't sure
  selectedLevel = '1';
  
  // Check the first radio button
  radioInputs[0].checked = true;
  continueBtn.disabled = false;
  
  // Haptic feedback
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
  
  // Scroll to top to show the selection
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Handle continue button
continueBtn.addEventListener('click', () => {
  if (!selectedLevel) return;
  
  // Save selected level
  localStorage.setItem('hskLevel', selectedLevel);
  localStorage.setItem('setupCompleted', 'true');
  
  // Haptic feedback
  if (tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
  
  // Navigate to main app
  window.location.href = '/main-app.html';
});
