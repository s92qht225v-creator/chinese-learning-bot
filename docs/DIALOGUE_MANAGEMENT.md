# Dialogue Management System

## Overview
Complete dialogue management system with multi-language support (English, Russian, Uzbek), admin panel, search/filter capabilities, and bulk operations.

## Features Implemented

### ✅ Database Schema
- Added `speaker` field to track dialogue speakers
- Added `lesson_id` foreign key to associate dialogues with lessons
- Created indexes for performance optimization
- UTF-8 encoding for proper Cyrillic support

### ✅ Backend API

#### Public Endpoints (for frontend)
- `GET /api/lessons/:lessonId/dialogues` - Get dialogues for a specific lesson

#### Admin Endpoints (password protected)
- `GET /api/admin/dialogues` - List all dialogues with optional filters
  - Query params: `search`, `lesson_id`, `visible`
- `GET /api/admin/dialogues/:id` - Get single dialogue with all translations
- `POST /api/admin/dialogues` - Create new dialogue
- `PUT /api/admin/dialogues/:id` - Update existing dialogue
- `DELETE /api/admin/dialogues/:id` - Delete dialogue
- `PATCH /api/admin/dialogues/bulk` - Bulk update dialogues (visibility toggle)

### ✅ Admin Panel Features

#### Dialogue Form
- Lesson selection dropdown
- Title input
- Speaker field (e.g., "Person A", "Person B")
- Chinese text input
- Pinyin input
- English translation
- Uzbek translation (optional)
- Russian translation (optional)
- Dialogue order (line number)

#### Search & Filter
- Real-time search by title or Chinese text
- Filter by lesson
- Filter by visibility status (All/Visible/Hidden)

#### Bulk Operations
- Select multiple dialogues with checkboxes
- Bulk show/hide selected dialogues
- Select all checkbox
- Selected count display

#### Table Display
- Checkbox column for bulk operations
- Title
- Speaker
- Associated lesson
- Dialogue order
- Visibility status (✅/❌)
- Edit and Delete actions

## Database Migration

Run the migration to add new columns:

```bash
psql -U your_user -d chinese_learning < migrations/update-dialogues-schema.sql
```

Or via Supabase dashboard SQL editor:

```sql
ALTER TABLE dialogues 
ADD COLUMN IF NOT EXISTS speaker VARCHAR(100),
ADD COLUMN IF NOT EXISTS lesson_id INTEGER REFERENCES lessons(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_dialogues_lesson_id ON dialogues(lesson_id);
CREATE INDEX IF NOT EXISTS idx_dialogues_order ON dialogues(dialogue_order);
```

## API Examples

### Create Dialogue
```bash
POST /api/admin/dialogues
Headers: x-admin-password: admin123
Content-Type: application/json

{
  "lesson_id": 1,
  "title": "Greeting Conversation",
  "speaker": "Person A",
  "chinese": "你好！最近怎么样？",
  "pinyin": "Nǐ hǎo! Zuìjìn zěnmeyàng?",
  "english": "Hello! How have you been recently?",
  "russian": "Привет! Как дела в последнее время?",
  "uzbek": "Salom! Yaqinda qanday?",
  "dialogue_order": 1,
  "visible": true
}
```

### Search Dialogues
```bash
GET /api/admin/dialogues?search=greeting&lesson_id=1&visible=true
Headers: x-admin-password: admin123
```

### Bulk Update Visibility
```bash
PATCH /api/admin/dialogues/bulk
Headers: x-admin-password: admin123
Content-Type: application/json

{
  "ids": [1, 2, 3],
  "updates": {
    "visible": false
  }
}
```

## Frontend Integration

The existing lesson.js already fetches and displays dialogues:

```javascript
// Fetch dialogues for a lesson
const response = await fetch(`/api/lessons/${lessonId}/dialogues`);
const dialogues = await response.json();

// Dialogues include all language translations
// Frontend displays based on user's language preference
```

## Testing

### Test Dialogue Creation
1. Open admin panel: `https://lokatsiya.online/admin/`
2. Enter password: `admin123`
3. Go to "Dialogues" tab
4. Fill in all fields with multi-language translations
5. Click "Add Dialogue"

### Test Search
1. Type in search box - results filter in real-time
2. Select a lesson from dropdown
3. Toggle visibility filter

### Test Bulk Operations
1. Check multiple dialogue checkboxes
2. Click "Show Selected" or "Hide Selected"
3. Verify visibility updates in table

### Test Edit
1. Click "Edit" button on any dialogue
2. Form populates with dialogue data
3. Modify fields and click "Update Dialogue"
4. Verify changes in table

## Code Structure

### Database Layer (`database.js`)
```javascript
db.getDialogues(options)  // With search/filter support
db.getDialogue(id)
db.addDialogue(dialogue)
db.updateDialogue(id, dialogue)
db.deleteDialogue(id)
db.bulkUpdateDialogues(ids, updates)
db.getDialoguesByLesson(lessonId)  // For frontend
```

### API Layer (`bot.js`)
- Admin authentication middleware
- Input validation
- Error handling with proper HTTP status codes
- Comprehensive logging

### Admin UI (`public/admin/index.html`)
- Inline JavaScript functions for CRUD operations
- Real-time search and filtering
- Bulk operations with checkbox management
- Form validation
- Success/error messaging

## Best Practices Implemented

1. **Database Transactions** - Ensured by Supabase
2. **Input Validation** - Required fields checked on server
3. **Error Handling** - User-friendly messages
4. **Performance** - Indexed columns for fast queries
5. **Security** - Admin password protection
6. **UX** - Real-time feedback, loading states
7. **Accessibility** - Semantic HTML, labels for inputs
8. **Multi-language** - UTF-8 encoding, all 3 languages supported

## Future Enhancements

- [ ] Audio file upload for dialogue pronunciation
- [ ] Batch import from CSV/Excel
- [ ] Duplicate dialogue checker
- [ ] Version history for edits
- [ ] Export dialogues to PDF/printable format
- [ ] Dialogue preview before saving
- [ ] Collaborative editing with multiple admins
- [ ] Auto-translate suggestions (AI integration)

## Troubleshooting

### Dialogues not appearing in frontend
- Check `visible` flag is set to `true`
- Verify `lesson_id` is correctly associated
- Check browser console for API errors

### Search not working
- Ensure `allDialogues` array is populated
- Check console for JavaScript errors
- Verify search input has correct ID

### Bulk operations failing
- Verify checkboxes have correct `dialogue-checkbox` class
- Check network tab for API errors
- Ensure admin password is correct

### Russian text not displaying
- Database must use UTF-8 encoding
- Check HTML has `<meta charset="utf-8">`
- Verify Supabase column encoding settings

## Support

For issues or questions:
1. Check browser console for errors
2. Check server logs: `pm2 logs bot`
3. Verify database schema matches migration
4. Test API endpoints directly with curl/Postman
