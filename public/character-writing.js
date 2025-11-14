// Wrap in IIFE to avoid duplicate variable declarations
(function() {
  'use strict';

  // Initialize Telegram WebApp
  const telegramApp = window.Telegram.WebApp;
  telegramApp.expand();
  telegramApp.ready();

  // Setup Telegram back button
  if (telegramApp.BackButton) {
    telegramApp.BackButton.show();
    telegramApp.BackButton.onClick(() => {
      window.location.href = '/practice.html';
    });
  }

  // Character data - will be loaded from API
  let characters = [];
  let currentIndex = 0;
  let writer = null;
  let currentStrokeIndex = 0;
  let stats = { correct: 0, attempts: 0 };

  // Elements
  const targetCharacterEl = document.getElementById('targetCharacter');
  const characterPinyinEl = document.getElementById('characterPinyin');
  const characterMeaningEl = document.getElementById('characterMeaning');
  const progressEl = document.getElementById('progress');
  const progressBarEl = document.getElementById('progressBar');
  const backBtnEl = document.getElementById('backBtn');
  const eraseBtnEl = document.getElementById('eraseBtn');
  const showAnimationBtnEl = document.getElementById('showAnimationBtn');
  const showHintBtnEl = document.getElementById('showHintBtn');
  const playAudioBtnEl = document.getElementById('playAudioBtn');
  const skipBtnEl = document.getElementById('skipBtn');
  const nextBtnEl = document.getElementById('nextBtn');

  // Validate critical elements
  if (!targetCharacterEl || !characterPinyinEl || !characterMeaningEl) {
    console.error('Required display elements not found!');
    alert('Error: Page elements not loaded correctly. Please refresh.');
  }

  // Load character from API
  function loadCharacter(index) {
    const char = characters[index];

    // Update display
    if (targetCharacterEl) targetCharacterEl.textContent = char.character;
    if (characterPinyinEl) characterPinyinEl.textContent = char.pinyin;
    if (characterMeaningEl) characterMeaningEl.textContent = char.uzbek_meaning;
    if (progressEl) progressEl.textContent = `${index + 1} / ${characters.length}`;
    if (progressBarEl) progressBarEl.style.width = `${((index + 1) / characters.length) * 100}%`;

    // Hide next button, show skip button
    if (nextBtnEl) nextBtnEl.style.display = 'none';
    if (skipBtnEl) skipBtnEl.style.display = 'flex';

    // Reset stroke tracking
    currentStrokeIndex = 0;

    // Create Hanzi Writer instance
    const container = document.getElementById('hanziWriterContainer');
    container.innerHTML = ''; // Clear previous character

    try {
      writer = HanziWriter.create(container, char.character, {
        width: container.offsetWidth || 400,
        height: container.offsetWidth || 400,
        padding: 10,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        showOutline: true,
        showCharacter: false,
        radicalColor: '#4A90E2',
        strokeColor: '#555',
        outlineColor: '#DDD',
        drawingColor: '#4A90E2',
        drawingWidth: 4,
        highlightColor: '#50E3C2',
        leniency: 0.7,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        highlightCompleteColor: '#50E3C2'
      });

      writer.quiz({
        onMistake: function() {
          console.log('Incorrect stroke');
          stats.attempts++;
          updateStats();
          if (telegramApp.HapticFeedback) {
            telegramApp.HapticFeedback.notificationOccurred('error');
          }
        },
        onCorrectStroke: function(strokeData) {
          console.log('Correct stroke:', strokeData.index + 1);
          currentStrokeIndex = strokeData.index + 1; // Track next stroke to draw
          if (telegramApp.HapticFeedback) {
            telegramApp.HapticFeedback.impactOccurred('light');
          }
        },
        onComplete: function() {
          console.log('Character completed!');
          stats.correct++;
          stats.attempts++;
          updateStats();
          if (telegramApp.HapticFeedback) {
            telegramApp.HapticFeedback.notificationOccurred('success');
          }
          if (nextBtnEl) nextBtnEl.style.display = 'flex';
          if (skipBtnEl) skipBtnEl.style.display = 'none';
          writer.showCharacter({ duration: 500 });
        }
      });
    } catch (error) {
      console.error('Error creating Hanzi Writer:', error);
      alert('Character not supported or error loading stroke data. Please skip.');
    }
  }

  // Erase last stroke - reload character to reset quiz
  if (eraseBtnEl) {
    eraseBtnEl.addEventListener('click', () => {
      if (writer) {
        writer.cancelQuiz();
      }
      loadCharacter(currentIndex);
    });
  }

  // Show animation
  if (showAnimationBtnEl) {
    showAnimationBtnEl.addEventListener('click', () => {
      if (writer) {
        writer.cancelQuiz();
        writer.animateCharacter({
          onComplete: () => {
            setTimeout(() => {
              loadCharacter(currentIndex);
            }, 1000);
          }
        });
      }
    });
  }

  // Show hint - animate the next stroke
  if (showHintBtnEl) {
    showHintBtnEl.addEventListener('click', () => {
      if (writer) {
        console.log('Showing hint for stroke:', currentStrokeIndex);
        // Animate just the next stroke that needs to be drawn
        writer.animateStroke(currentStrokeIndex, {
          strokeColor: '#FFD700', // Gold color to highlight the hint
          radicalColor: '#FFD700'
        });
      }
    });
  }

  // Play audio
  if (playAudioBtnEl) {
    playAudioBtnEl.addEventListener('click', () => {
      const char = characters[currentIndex];
      if (char) {
        if (window.tts) {
          tts.speak(char.character);
        } else {
          const utterance = new SpeechSynthesisUtterance(char.character);
          utterance.lang = 'zh-CN';
          window.speechSynthesis.speak(utterance);
        }
      }
    });
  }

  // Skip current character
  if (skipBtnEl) {
    skipBtnEl.addEventListener('click', () => {
      nextCharacter();
    });
  }

  // Next character
  if (nextBtnEl) {
    nextBtnEl.addEventListener('click', () => {
      nextCharacter();
    });
  }

  // Next character function
  function nextCharacter() {
    if (currentIndex < characters.length - 1) {
      currentIndex++;
      loadCharacter(currentIndex);
    } else {
      const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
      alert(`Practice complete! 🎉\n\nCorrect: ${stats.correct}\nAttempts: ${stats.attempts}\nAccuracy: ${accuracy}%`);
      window.location.href = '/practice.html';
    }
  }

  // Update stats display
  function updateStats() {
    const correctEl = document.getElementById('correctCount');
    const attemptEl = document.getElementById('attemptCount');
    const accuracyEl = document.getElementById('accuracyPercent');

    if (correctEl) correctEl.textContent = stats.correct;
    if (attemptEl) attemptEl.textContent = stats.attempts;

    const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
    if (accuracyEl) accuracyEl.textContent = accuracy + '%';
  }

  // Back button
  if (backBtnEl) {
    backBtnEl.addEventListener('click', () => {
      window.location.href = '/practice.html';
    });
  }

  // Load characters from API
  async function loadCharacters() {
    try {
      const response = await fetch(API_CONFIG.url('/api/character-writing?enabled=true'));
      const data = await response.json();

      characters = data.map(char => ({
        character: char.character,
        pinyin: char.pinyin,
        uzbek_meaning: char.uzbek_meaning,
        hsk_level: char.hsk_level,
        difficulty_rating: char.difficulty_rating
      }));

      if (characters.length > 0) {
        characters = characters.slice(0, 10);
        loadCharacter(currentIndex);
      } else {
        alert('No characters available. Please add characters in the admin panel first.');
        window.location.href = '/practice.html';
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
      alert('Failed to load characters. Please try again.');
      window.location.href = '/practice.html';
    }
  }

  // Initialize - wait for HanziWriter to load
  function initialize() {
    if (typeof HanziWriter === 'undefined') {
      console.log('Waiting for HanziWriter to load...');
      setTimeout(initialize, 100);
      return;
    }
    console.log('HanziWriter loaded, starting character loading...');
    loadCharacters();
  }

  // Start initialization when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
