# Study Time Tracking - Testing Guide

## Overview
The study time tracking system now tracks real user study sessions instead of showing hardcoded demo data.

## How It Works

### Automatic Tracking
- **Quiz Pages**: Time is automatically tracked when you take a quiz
  - Session starts when quiz loads
  - Session ends when quiz completes or user leaves
  - Time is saved to localStorage

### Viewing Study Data
- **Profile Page**: Shows weekly study time breakdown
  - Monday through Sunday with actual minutes studied
  - Progress bars show completion toward daily goal
  - Days exceeding goal are highlighted in green
  - "Today" section shows current day progress

## Testing the System

### Method 1: Take a Quiz (Real Usage)
1. Navigate to the quiz page
2. Complete a quiz (or navigate away early)
3. Go to the profile page
4. You should see the time added to today's study time

### Method 2: Add Test Data (Quick Testing)
1. Open the profile page
2. Open browser console (F12)
3. Run: `studyTracker.populateTestData()`
4. Refresh the page
5. You should see a week of study data populated

### Method 3: Add Manual Time
```javascript
// Add 25 minutes to today
studyTracker.addManualTime(25);

// Add 15 minutes to a specific date
studyTracker.addManualTime(15, '2025-10-28');

// View all data
console.log(studyTracker.getWeekData());
```

## Available Functions

### Study Tracker Methods
```javascript
// Start a session
studyTracker.startSession('quiz');

// End current session (returns minutes)
const minutes = studyTracker.endSession();

// Get today's minutes
const todayMinutes = studyTracker.getTodayMinutes();

// Get weekly breakdown
const weekData = studyTracker.getWeekData();
// Returns: [{ day: 'Monday', date: '2025-10-27', minutes: 15, isToday: false }, ...]

// Get study streak
const streak = studyTracker.getStreak();

// Clear all data
studyTracker.clearData();

// Populate test data
studyTracker.populateTestData();
```

## Data Storage

### localStorage (Default)
- Data is stored locally in the browser
- Persists across page refreshes
- Key: `studyTimeData`
- Format:
```json
{
  "sessions": [
    {
      "activity": "quiz",
      "date": "2025-10-28",
      "timestamp": 1730142000000,
      "durationMinutes": 5
    }
  ],
  "totalMinutes": 5
}
```

### Database Sync (When Available)
- If Supabase is configured, data can sync to database
- API endpoints available at:
  - `POST /api/study-time` - Save session
  - `GET /api/study-time/:user_id` - Get user history
  - `GET /api/study-time/:user_id/summary` - Get summary stats

## Features

✅ **Real-time tracking** - Sessions tracked as users study
✅ **Persistent data** - Saved in localStorage
✅ **Weekly view** - Monday through Sunday breakdown
✅ **Daily goal tracking** - Visual progress toward goal
✅ **Accurate timing** - Tracks actual time spent
✅ **Automatic cleanup** - Handles page navigation gracefully
✅ **Test helpers** - Easy to populate test data

## Example Output

After taking quizzes and studying, the profile page will show:

```
Study Time This Week
━━━━━━━━━━━━━━━━━━━
Monday     15 min  ████████████████░░░░  75%
Tuesday    20 min  ████████████████████ 100%
Wednesday  10 min  ██████████░░░░░░░░░░  50%
Thursday   18 min  ██████████████████░░  90%
Friday     22 min  ████████████████████ 100% ✓ (Exceeded goal)
Saturday    0 min  ░░░░░░░░░░░░░░░░░░░░   0%
Sunday      0 min  ░░░░░░░░░░░░░░░░░░░░   0%

Today
━━━━━
0 min / 🎯 20 min  ░░░░░░░░░░░░░░░░░░░░   0%
```

## Troubleshooting

### Data Not Showing?
1. Check console for errors (F12)
2. Verify `studyTracker` is defined: `console.log(studyTracker)`
3. Check if data exists: `console.log(studyTracker.getData())`
4. Try adding test data: `studyTracker.populateTestData()`

### Session Not Tracking?
1. Check if session started: `console.log(studyTracker.currentSession)`
2. Manually end session: `studyTracker.endSession()`
3. Check localStorage: Look for `studyTimeData` key

### Want to Reset?
```javascript
studyTracker.clearData();
location.reload();
```

## Future Enhancements

Potential additions:
- [ ] Database integration for cross-device sync
- [ ] Study streaks and achievements
- [ ] Weekly/monthly reports
- [ ] Export study data
- [ ] Study reminders based on goals
- [ ] Category-based tracking (vocabulary, grammar, listening, etc.)
