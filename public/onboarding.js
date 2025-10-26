// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// State
let currentSlide = 1;
const totalSlides = 4;

// Elements
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const startBtn = document.getElementById('startBtn');

// Navigate to slide
function goToSlide(slideNumber) {
  // Remove active class from all slides
  slides.forEach(slide => {
    slide.classList.remove('active', 'prev');
  });
  
  // Add active to current slide
  slides[slideNumber - 1].classList.add('active');
  
  // Add prev to previous slides
  for (let i = 0; i < slideNumber - 1; i++) {
    slides[i].classList.add('prev');
  }
  
  // Update dots
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index + 1 === slideNumber);
  });
  
  // Update buttons
  if (slideNumber === totalSlides) {
    nextBtn.style.display = 'none';
    skipBtn.style.display = 'none';
    startBtn.style.display = 'block';
  } else {
    nextBtn.style.display = 'block';
    skipBtn.style.display = 'block';
    startBtn.style.display = 'none';
  }
  
  currentSlide = slideNumber;
  
  // Haptic feedback
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }
}

// Next button
nextBtn.addEventListener('click', () => {
  if (currentSlide < totalSlides) {
    goToSlide(currentSlide + 1);
  }
});

// Skip buttons (one on each slide)
const skipButtons = [skipBtn, document.getElementById('skipBtn2'), document.getElementById('skipBtn3'), document.getElementById('skipBtn4')];
skipButtons.forEach(btn => {
  if (btn) {
    btn.addEventListener('click', () => {
      completeOnboarding();
    });
  }
});

// Start button
startBtn.addEventListener('click', () => {
  completeOnboarding();
});

// Dot navigation
dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    goToSlide(index + 1);
  });
});

// Complete onboarding
function completeOnboarding() {
  // Save onboarding completion
  localStorage.setItem('onboardingCompleted', 'true');
  
  // Haptic feedback
  if (tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
  
  // Navigate to level selection
  window.location.href = '/level-select.html';
}

// Swipe gestures
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0 && currentSlide < totalSlides) {
      // Swipe left - next
      goToSlide(currentSlide + 1);
    } else if (diff < 0 && currentSlide > 1) {
      // Swipe right - previous
      goToSlide(currentSlide - 1);
    }
  }
}
