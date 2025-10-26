// Admin Panel JavaScript
const ADMIN_PASSWORD = 'admin123'; // Change this in production!
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:3000'
  : 'https://lingo.uz';

// Supabase configuration
const SUPABASE_URL = 'https://aveoqedskzbbgcazpskn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZW9xZWRza3piYmdjYXpwc2tuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0Nzk1MjYsImV4cCI6MjA3NzA1NTUyNn0.NfTfTWKNDmsmiLF_MX5XGGq48xbX8OOUWhVmb5U-VXM';

// Check if already logged in
if (sessionStorage.getItem('adminLoggedIn') === 'true') {
  showDashboard();
  loadData();
}

// Login function
function login(event) {
  event.preventDefault();
  const password = document.getElementById('password').value;
  
  if (password === ADMIN_PASSWORD) {
    sessionStorage.setItem('adminLoggedIn', 'true');
    showDashboard();
    loadData();
  } else {
    alert('Incorrect password');
  }
}

// Logout function
function logout() {
  sessionStorage.removeItem('adminLoggedIn');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
}

// Show dashboard
function showDashboard() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminDashboard').classList.remove('hidden');
}

// Load all data
async function loadData() {
  await Promise.all([
    loadStats(),
    loadVocabulary(),
    loadUsers(),
    loadAnalytics()
  ]);
}

// Load stats
async function loadStats() {
  try {
    // Get total users
    const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=count`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const usersData = await usersRes.json();
    document.getElementById('totalUsers').textContent = usersData.length || 0;

    // Get total vocabulary
    const vocabRes = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary?select=count`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const vocabData = await vocabRes.json();
    document.getElementById('totalVocab').textContent = vocabData.length || 0;

    // Get total quiz attempts
    const progressRes = await fetch(`${SUPABASE_URL}/rest/v1/user_progress?select=count`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const progressData = await progressRes.json();
    document.getElementById('totalQuizzes').textContent = progressData.length || 0;

    // Active today (simplified - showing total users for now)
    document.getElementById('activeToday').textContent = usersData.length || 0;
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

// Load vocabulary
async function loadVocabulary() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary?select=*&order=id`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const vocabulary = await response.json();
    
    const tbody = document.getElementById('vocabularyTableBody');
    tbody.innerHTML = vocabulary.map(word => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${word.chinese}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${word.pinyin}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${word.english}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">HSK ${word.hsk_level || 1}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button onclick="deleteVocabulary(${word.id})" class="text-red-600 hover:text-red-900">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load vocabulary:', error);
  }
}

// Load users
async function loadUsers() {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const users = await response.json();
    
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(user => `
      <tr>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.telegram_id}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.username || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">HSK ${user.hsk_level || 1}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(user.created_at).toLocaleDateString()}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <button onclick="viewUserProgress(${user.telegram_id})" class="text-blue-600 hover:text-blue-900">View</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

// Load analytics
async function loadAnalytics() {
  try {
    // Get most difficult words (lowest accuracy)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_progress?select=vocabulary_id,correct_count,incorrect_count&order=incorrect_count.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const progressData = await response.json();
    
    // Get vocabulary details
    const vocabIds = progressData.map(p => p.vocabulary_id).join(',');
    const vocabRes = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary?id=in.(${vocabIds})&select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    const vocabData = await vocabRes.json();
    
    const difficultWordsDiv = document.getElementById('difficultWords');
    if (progressData.length > 0) {
      difficultWordsDiv.innerHTML = progressData.map(p => {
        const vocab = vocabData.find(v => v.id === p.vocabulary_id);
        if (!vocab) return '';
        const total = p.correct_count + p.incorrect_count;
        const accuracy = total > 0 ? Math.round((p.correct_count / total) * 100) : 0;
        return `
          <div class="flex justify-between items-center">
            <span class="text-sm font-medium">${vocab.chinese} (${vocab.pinyin})</span>
            <span class="text-sm text-gray-500">${accuracy}% accuracy</span>
          </div>
        `;
      }).join('');
    } else {
      difficultWordsDiv.innerHTML = '<p class="text-sm text-gray-500">No data yet</p>';
    }
  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
}

// Show add vocabulary modal
function showAddVocabModal() {
  document.getElementById('addVocabModal').classList.remove('hidden');
}

// Close add vocabulary modal
function closeAddVocabModal() {
  document.getElementById('addVocabModal').classList.add('hidden');
  document.getElementById('newChinese').value = '';
  document.getElementById('newPinyin').value = '';
  document.getElementById('newEnglish').value = '';
}

// Add vocabulary
async function addVocabulary(event) {
  event.preventDefault();
  
  const newWord = {
    chinese: document.getElementById('newChinese').value,
    pinyin: document.getElementById('newPinyin').value,
    english: document.getElementById('newEnglish').value,
    hsk_level: parseInt(document.getElementById('newHSK').value),
    difficulty: document.getElementById('newDifficulty').value
  };
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(newWord)
    });
    
    if (response.ok) {
      alert('Vocabulary added successfully!');
      closeAddVocabModal();
      loadVocabulary();
      loadStats();
    } else {
      alert('Failed to add vocabulary');
    }
  } catch (error) {
    console.error('Failed to add vocabulary:', error);
    alert('Failed to add vocabulary');
  }
}

// Delete vocabulary
async function deleteVocabulary(id) {
  if (!confirm('Are you sure you want to delete this word?')) return;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/vocabulary?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    if (response.ok) {
      alert('Vocabulary deleted successfully!');
      loadVocabulary();
      loadStats();
    } else {
      alert('Failed to delete vocabulary');
    }
  } catch (error) {
    console.error('Failed to delete vocabulary:', error);
    alert('Failed to delete vocabulary');
  }
}

// View user progress
function viewUserProgress(userId) {
  alert(`View progress for user ${userId} - Coming soon!`);
}

// Show tab
function showTab(tab) {
  // Hide all tabs
  document.getElementById('vocabularyTab').classList.add('hidden');
  document.getElementById('usersTab').classList.add('hidden');
  document.getElementById('analyticsTab').classList.add('hidden');
  
  // Remove active class from all buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'text-blue-600');
    btn.classList.add('border-transparent', 'text-gray-500');
  });
  
  // Show selected tab
  if (tab === 'vocabulary') {
    document.getElementById('vocabularyTab').classList.remove('hidden');
    document.getElementById('tabVocab').classList.add('border-blue-500', 'text-blue-600');
  } else if (tab === 'users') {
    document.getElementById('usersTab').classList.remove('hidden');
    document.getElementById('tabUsers').classList.add('border-blue-500', 'text-blue-600');
  } else if (tab === 'analytics') {
    document.getElementById('analyticsTab').classList.remove('hidden');
    document.getElementById('tabAnalytics').classList.add('border-blue-500', 'text-blue-600');
  }
}
