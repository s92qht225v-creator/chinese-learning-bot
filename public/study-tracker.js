// Study Time Tracker
// Tracks user study sessions and provides analytics

class StudyTracker {
  constructor() {
    this.currentSession = null;
    this.storageKey = 'studyTimeData';
  }

  // Get all study time data
  getData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : { sessions: [], totalMinutes: 0 };
  }

  // Save study time data
  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  // Start a study session
  startSession(activity = 'study') {
    this.currentSession = {
      activity: activity,
      startTime: Date.now(),
      endTime: null
    };
    console.log('Study session started:', activity);
  }

  // End current study session
  endSession() {
    if (!this.currentSession) {
      console.warn('No active study session to end');
      return 0;
    }

    this.currentSession.endTime = Date.now();
    const durationMs = this.currentSession.endTime - this.currentSession.startTime;
    const durationMinutes = Math.round(durationMs / 60000);

    // Save session to history
    const data = this.getData();
    data.sessions.push({
      activity: this.currentSession.activity,
      date: new Date(this.currentSession.startTime).toISOString().split('T')[0], // YYYY-MM-DD
      timestamp: this.currentSession.startTime,
      durationMinutes: durationMinutes
    });
    data.totalMinutes += durationMinutes;

    this.saveData(data);
    console.log(`Study session ended: ${durationMinutes} minutes`);

    const session = this.currentSession;
    this.currentSession = null;

    return durationMinutes;
  }

  // Get study time for a specific date (YYYY-MM-DD)
  getTimeForDate(date) {
    const data = this.getData();
    const sessions = data.sessions.filter(s => s.date === date);
    return sessions.reduce((total, session) => total + session.durationMinutes, 0);
  }

  // Get study time for current week (Mon-Sun)
  getWeekData() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate Monday of current week
    const monday = new Date(now);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday, go back 6 days
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const weekData = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const minutes = this.getTimeForDate(dateStr);

      // Check if this is today
      const isToday = dateStr === now.toISOString().split('T')[0];

      weekData.push({
        day: dayNames[i],
        date: dateStr,
        minutes: minutes,
        isToday: isToday
      });
    }

    return weekData;
  }

  // Get today's study time
  getTodayMinutes() {
    const today = new Date().toISOString().split('T')[0];
    return this.getTimeForDate(today);
  }

  // Get total study time (all time)
  getTotalMinutes() {
    const data = this.getData();
    return data.totalMinutes;
  }

  // Get study streak (consecutive days)
  getStreak() {
    const data = this.getData();
    if (data.sessions.length === 0) return 0;

    // Get unique study dates, sorted newest first
    const studyDates = [...new Set(data.sessions.map(s => s.date))].sort().reverse();

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < studyDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      if (studyDates[i] === expectedDateStr) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Clear all study time data (for testing/reset)
  clearData() {
    localStorage.removeItem(this.storageKey);
    this.currentSession = null;
    console.log('Study time data cleared');
  }

  // Add manual study time (for testing or manual entry)
  addManualTime(minutes, date = null, activity = 'manual') {
    const dateStr = date || new Date().toISOString().split('T')[0];
    const data = this.getData();

    data.sessions.push({
      activity: activity,
      date: dateStr,
      timestamp: Date.now(),
      durationMinutes: minutes
    });
    data.totalMinutes += minutes;

    this.saveData(data);
    console.log(`Added ${minutes} minutes for ${dateStr}`);
  }
}

// Create global instance
if (typeof studyTracker === 'undefined') {
  var studyTracker = new StudyTracker();
}

// Helper function to populate test data for this week
// Call this from console: studyTracker.populateTestData()
StudyTracker.prototype.populateTestData = function() {
  console.log('Populating test study data for this week...');

  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(now.getDate() + diff);

  // Add some realistic study times for each day
  const testData = [
    { offset: 0, minutes: 15 },  // Monday
    { offset: 1, minutes: 20 },  // Tuesday
    { offset: 2, minutes: 10 },  // Wednesday
    { offset: 3, minutes: 18 },  // Thursday
    { offset: 4, minutes: 22 },  // Friday
    { offset: 5, minutes: 0 },   // Saturday
    { offset: 6, minutes: 0 }    // Sunday (today - leave empty initially)
  ];

  testData.forEach(day => {
    if (day.minutes > 0) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + day.offset);
      const dateStr = date.toISOString().split('T')[0];
      this.addManualTime(day.minutes, dateStr, 'test');
    }
  });

  console.log('✅ Test data populated! Reload the profile page to see it.');
  console.log('Data:', this.getWeekData());
};
