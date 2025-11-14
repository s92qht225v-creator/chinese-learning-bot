// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand();
tg.ready();

// Character data - will be loaded from API
let characters = [];

let currentIndex = 0;
let stats = { correct: 0, attempts: 0 };
let isDrawing = false;
let showGuide = false;
let strokes = []; // Store each stroke for undo
let currentStroke = []; // Current stroke being drawn

// Elements
const canvas = document.getElementById('drawingCanvas');
if (!canvas) {
  console.error('Canvas element not found!');
  throw new Error('Canvas element not found');
}
const ctx = canvas.getContext('2d');
const targetCharacter = document.getElementById('targetCharacter');
const characterPinyin = document.getElementById('characterPinyin');
const characterMeaning = document.getElementById('characterMeaning');
const guideCharacter = document.getElementById('guideCharacter');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const backBtn = document.getElementById('backBtn');
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const showGuideBtn = document.getElementById('showGuideBtn');
const playAudioBtn = document.getElementById('playAudioBtn');
const skipBtn = document.getElementById('skipBtn');
const checkBtn = document.getElementById('checkBtn');

// Validate critical elements
if (!targetCharacter || !characterPinyin || !characterMeaning || !backBtn || !clearBtn || !undoBtn || !showGuideBtn || !checkBtn || !skipBtn) {
  console.error('Required elements not found!');
  alert('Error: Page elements not loaded correctly. Please refresh.');
}

// Setup canvas
function setupCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  ctx.strokeStyle = '#4A90E2';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

setupCanvas();
window.addEventListener('resize', setupCanvas);

// Drawing functions
function startDrawing(e) {
  isDrawing = true;
  const pos = getPosition(e);
  currentStroke = [pos];
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!isDrawing) return;
  e.preventDefault();
  const pos = getPosition(e);
  currentStroke.push(pos);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function stopDrawing() {
  if (isDrawing && currentStroke.length > 0) {
    strokes.push([...currentStroke]);
    currentStroke = [];
    stats.attempts++;
    updateStats();
  }
  isDrawing = false;
}

// Redraw all strokes
function redrawStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes.forEach(stroke => {
    if (stroke.length > 0) {
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  });
}

function getPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
}

// Event listeners for drawing
if (canvas) {
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', stopDrawing);
}

// Undo last stroke
if (undoBtn) {
  undoBtn.addEventListener('click', () => {
    if (strokes.length > 0) {
      strokes.pop();
      redrawStrokes();
    }
  });
}

// Clear canvas
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes = [];
    currentStroke = [];
  });
}

// Toggle guide
if (showGuideBtn) {
  showGuideBtn.addEventListener('click', () => {
    showGuide = !showGuide;
    if (guideCharacter) guideCharacter.style.display = showGuide ? 'flex' : 'none';
    const icon = showGuideBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = showGuide ? 'visibility_off' : 'visibility';
  });
}

// Play audio
if (playAudioBtn) {
  playAudioBtn.addEventListener('click', () => {
    const char = characters[currentIndex];
    if (char) {
      // Try to play audio from URL first
      if (char.audio_url) {
        const audio = new Audio(char.audio_url);
        audio.play().catch(err => {
          console.error('Audio playback failed:', err);
          // Fallback to TTS
          if (window.tts) {
            tts.speak(char.char);
          }
        });
      } else if (window.tts) {
        // Use TTS if no audio URL
        tts.speak(char.char);
      }
    }
  });
}

// Load character
function loadCharacter(index) {
  const char = characters[index];
  targetCharacter.textContent = char.char;
  characterPinyin.textContent = char.pinyin;
  characterMeaning.textContent = char.meaning;
  guideCharacter.textContent = char.char;
  progress.textContent = `${index + 1} / ${characters.length}`;
  progressBar.style.width = `${((index + 1) / characters.length) * 100}%`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  strokes = [];
  currentStroke = [];
  showGuide = false;
  guideCharacter.style.display = 'none';
  const icon = showGuideBtn.querySelector('.material-symbols-outlined');
  icon.textContent = 'visibility';
}

// Check answer (simplified - in real app, would use OCR or stroke order validation)
if (checkBtn) {
  checkBtn.addEventListener('click', () => {

    // Simplified check - just count as correct if they drew something
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasDrawing = imageData.data.some(channel => channel !== 0);

    if (hasDrawing) {
      stats.correct++;
      updateStats();

      // Show success feedback
      const originalBg = checkBtn.style.backgroundColor;
      checkBtn.style.backgroundColor = '#50E3C2';
      checkBtn.innerHTML = '<span class="material-symbols-outlined">check</span> Correct!';

      setTimeout(() => {
        checkBtn.style.backgroundColor = originalBg;
        checkBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Check';
        nextCharacter();
      }, 1000);
    } else {
      alert('Please draw the character first!');
    }
  });
}

// Skip
if (skipBtn) {
  skipBtn.addEventListener('click', () => {
    nextCharacter();
  });
}

// Next character
function nextCharacter() {
  if (currentIndex < characters.length - 1) {
    currentIndex++;
    loadCharacter(currentIndex);
  } else {
    // Finished
    const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
    alert(`Practice complete! 🎉\n\nCorrect: ${stats.correct}\nAttempts: ${stats.attempts}\nAccuracy: ${accuracy}%`);
    window.location.href = '/practice.html';
  }
}

// Update stats
function updateStats() {
  document.getElementById('correctCount').textContent = stats.correct;
  document.getElementById('attemptCount').textContent = stats.attempts;
  const accuracy = stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0;
  document.getElementById('accuracyPercent').textContent = accuracy + '%';
}

// Back button
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = '/practice.html';
  });
}

// Load vocabulary from API
async function loadVocabulary() {
  try {
    const response = await fetch(API_CONFIG.url(API_CONFIG.endpoints.vocabulary));
    const data = await response.json();
    characters = data.slice(0, 10).map(word => ({
      char: word.chinese,
      pinyin: word.pinyin,
      meaning: word.uzbek || word.english,
      audio_url: word.audio_url
    }));

    if (characters.length > 0) {
      loadCharacter(currentIndex);
    } else {
      alert('No characters available. Please add vocabulary first.');
    }
  } catch (error) {
    console.error('Failed to load vocabulary:', error);
    alert('Failed to load vocabulary. Please try again.');
  }
}

// Initialize
loadVocabulary();
