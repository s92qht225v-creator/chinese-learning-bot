// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Elements
const backBtn = document.getElementById('backBtn');
const completedBtn = document.getElementById('completedBtn');
const playBtn = document.getElementById('playBtn');
const dialogueTabs = document.querySelectorAll('.dialogue-tab');
const dialogueContent = document.getElementById('dialogueContent');
const vocabAudioBtns = document.querySelectorAll('button[class*="volume_up"]');

// Dialogue content for different views
const dialogueData = {
  characters: `
    <div class="flex flex-col gap-1">
      <p class="text-lg">你好！你叫什么名字？</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">我叫李明。你呢？</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">我叫王芳。</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">很高兴认识你！</p>
    </div>
  `,
  pinyin: `
    <div class="flex flex-col gap-1">
      <p class="text-lg">你好！你叫什么名字？</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">Nǐ hǎo! Nǐ jiào shénme míngzi?</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">Hello! What's your name?</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">我叫李明。你呢？</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">Wǒ jiào Lǐ Míng. Nǐ ne?</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">I'm called Li Ming. And you?</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">我叫王芳。</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">Wǒ jiào Wáng Fāng.</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">I'm called Wang Fang.</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">很高兴认识你！</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">Hěn gāoxìng rènshi nǐ!</p>
      <p class="text-text-secondary-light dark:text-text-secondary-dark">Nice to meet you!</p>
    </div>
  `,
  translation: `
    <div class="flex flex-col gap-1">
      <p class="text-lg">Hello! What's your name?</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">I'm called Li Ming. And you?</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">I'm called Wang Fang.</p>
    </div>
    <div class="flex flex-col gap-1">
      <p class="text-lg">Nice to meet you!</p>
    </div>
  `
};

// Back button
backBtn.addEventListener('click', () => {
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }
  window.history.back();
});

// Completed button
completedBtn.addEventListener('click', () => {
  if (tg.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
  
  // Toggle completed state
  const isCompleted = completedBtn.classList.toggle('bg-success');
  completedBtn.classList.toggle('border-success');
  
  if (isCompleted) {
    completedBtn.querySelector('span').style.color = 'white';
    // Save progress
    localStorage.setItem('lesson2_completed', 'true');
    alert('Lesson marked as complete! 🎉');
  } else {
    completedBtn.querySelector('span').style.color = 'transparent';
    localStorage.removeItem('lesson2_completed');
  }
});

// Play audio button
playBtn.addEventListener('click', () => {
  if (tg.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
  
  const icon = playBtn.querySelector('span');
  if (icon.textContent === 'play_arrow') {
    icon.textContent = 'pause';
    alert('Audio playback would start here');
    // Simulate playing
    setTimeout(() => {
      icon.textContent = 'play_arrow';
    }, 3000);
  } else {
    icon.textContent = 'play_arrow';
  }
});

// Dialogue tabs
dialogueTabs.forEach(tab => {
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    
    // Remove active state from all tabs
    dialogueTabs.forEach(t => {
      t.classList.remove('border-b-primary', 'text-primary');
      t.classList.add('border-b-transparent', 'text-text-secondary-light', 'dark:text-text-secondary-dark');
    });
    
    // Add active state to clicked tab
    tab.classList.add('border-b-primary', 'text-primary');
    tab.classList.remove('border-b-transparent', 'text-text-secondary-light', 'dark:text-text-secondary-dark');
    
    // Update content
    const tabType = tab.dataset.tab;
    dialogueContent.innerHTML = dialogueData[tabType];
    dialogueContent.className = 'flex flex-col gap-4';
  });
});

// Vocabulary audio buttons
vocabAudioBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    
    // Visual feedback
    btn.classList.add('scale-95');
    setTimeout(() => {
      btn.classList.remove('scale-95');
    }, 150);
    
    alert('Audio pronunciation would play here');
  });
});

// Add to flashcard buttons
const addFlashcardBtns = document.querySelectorAll('.add-flashcard');
addFlashcardBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    
    if (tg.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
    }
    
    // Get word data from parent card
    const card = btn.closest('.vocab-card');
    const word = card.dataset.word;
    const pinyin = card.dataset.pinyin;
    const meaning = card.dataset.meaning;
    
    // Save to localStorage (flashcards data)
    let flashcards = JSON.parse(localStorage.getItem('flashcards') || '[]');
    
    // Check if already added
    const exists = flashcards.some(f => f.char === word);
    
    if (!exists) {
      flashcards.push({
        char: word,
        pinyin: pinyin,
        english: meaning
      });
      localStorage.setItem('flashcards', JSON.stringify(flashcards));
      
      // Visual feedback - change icon and color
      const icon = btn.querySelector('.material-symbols-outlined');
      icon.textContent = 'check_circle';
      btn.classList.add('text-primary');
      btn.classList.remove('text-text-secondary-light', 'dark:text-text-secondary-dark');
      
      // Show success message
      alert(`"${word}" added to flashcards! ✓`);
      
      // Revert icon after delay
      setTimeout(() => {
        icon.textContent = 'add_circle';
      }, 2000);
    } else {
      alert(`"${word}" is already in your flashcards!`);
    }
  });
});

// Exercise feedback
document.querySelectorAll('input[type="radio"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    
    // Check if correct answer
    if (e.target.value === 'correct') {
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    }
  });
});

// Grammar audio buttons
const grammarAudioBtns = document.querySelectorAll('.grammar-audio');
grammarAudioBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    
    // Scale animation
    btn.classList.add('scale-95');
    setTimeout(() => {
      btn.classList.remove('scale-95');
    }, 150);
    
    alert('Grammar example audio would play here');
  });
});

// Grammar bookmark buttons
const grammarBookmarkBtns = document.querySelectorAll('.grammar-bookmark');
grammarBookmarkBtns.forEach(btn => {
  const grammarId = btn.dataset.grammar;
  
  // Check if already bookmarked
  const bookmarks = JSON.parse(localStorage.getItem('grammar_bookmarks') || '[]');
  if (bookmarks.includes(grammarId)) {
    const icon = btn.querySelector('.material-symbols-outlined');
    icon.textContent = 'bookmark';
    btn.classList.add('text-primary');
  }
  
  btn.addEventListener('click', () => {
    if (tg.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    
    let bookmarks = JSON.parse(localStorage.getItem('grammar_bookmarks') || '[]');
    const icon = btn.querySelector('.material-symbols-outlined');
    
    if (bookmarks.includes(grammarId)) {
      // Remove bookmark
      bookmarks = bookmarks.filter(id => id !== grammarId);
      icon.textContent = 'bookmark_border';
      btn.classList.remove('text-primary');
      alert('Grammar point removed from bookmarks');
    } else {
      // Add bookmark
      bookmarks.push(grammarId);
      icon.textContent = 'bookmark';
      btn.classList.add('text-primary');
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      alert('Grammar point bookmarked! ✓');
    }
    
    localStorage.setItem('grammar_bookmarks', JSON.stringify(bookmarks));
  });
});

// Load completed state
if (localStorage.getItem('lesson2_completed') === 'true') {
  completedBtn.classList.add('bg-success', 'border-success');
  completedBtn.querySelector('span').style.color = 'white';
}
