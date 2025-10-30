# Dark Mode Implementation Guide

## Overview
The app uses Tailwind CSS dark mode with class-based toggling. Dark mode preference is stored in localStorage and persists across sessions.

## Architecture

### 1. Global Settings (settings.js)
Location: `/public/settings.js`

Manages theme state globally:
- Reads from `localStorage.getItem('darkMode')`
- Falls back to system preference if not set
- Provides `toggleDarkMode()`, `setDarkMode()`, `isDarkMode()` methods
- Adds/removes `dark` class on `<html>` element

### 2. Main App (main-app.html)
Location: `/public/main-app.html`

**Initialization:**
```javascript
// Runs immediately in <head> before any rendering
const stored = localStorage.getItem('darkMode');
const isDark = stored === 'true' || 
               (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
if (isDark) {
  document.documentElement.classList.add('dark');
}
```

**Tailwind Config:**
```javascript
tailwind.config = {
  darkMode: "class",  // Uses .dark class on <html>
  theme: {
    extend: {
      colors: {
        // Light mode colors
        "background-light": "#f6f7f8",
        "surface-light": "#ffffff",
        "text-primary-light": "#111417",
        "text-secondary-light": "#647487",
        "border-light": "#dce0e5",
        
        // Dark mode colors
        "background-dark": "#111921",
        "surface-dark": "#18222c",
        "text-primary-dark": "#f0f4f8",
        "text-secondary-dark": "#a0aec0",
        "border-dark": "#2d3748",
        
        // Theme colors (same in both modes)
        "primary": "#448fe4",
        "secondary": "#50E3C2",
        "accent": "#F5A623",
        "success": "#4CAF50"
      }
    }
  }
}
```

**Dynamic Page Loading:**
- Loads settings.js globally once
- When loading pages dynamically, skips:
  - Duplicate Tailwind CDN loads
  - Inline `tailwind.config` scripts
  - Dark mode init scripts
  - settings.js/study-tracker.js re-loads

### 3. Standalone Pages
Pages loaded outside main-app (e.g., profile-language-select.html, quiz.html):

**Must include:**
1. Dark mode init script (before body renders)
2. Tailwind config with matching colors
3. settings.js import

**Example:**
```html
<script src="https://cdn.tailwindcss.com"></script>

<!-- Dark mode init -->
<script>
  (function() {
    const stored = localStorage.getItem('darkMode');
    const isDark = stored === 'true' || 
                   (stored === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  })();
</script>

<!-- Tailwind config -->
<script>
  tailwind.config = {
    darkMode: "class",
    theme: { extend: { colors: { /* same as main-app */ } } }
  };
</script>

<script src="/settings.js"></script>
```

## Color System

### Usage Patterns

**Backgrounds:**
```html
<div class="bg-background-light dark:bg-background-dark">
<div class="bg-surface-light dark:bg-surface-dark">
```

**Text:**
```html
<p class="text-text-primary-light dark:text-text-primary-dark">
<p class="text-text-secondary-light dark:text-text-secondary-dark">
```

**Borders:**
```html
<div class="border border-border-light dark:border-border-dark">
```

**Cards (common pattern):**
```html
<div class="bg-surface-light dark:bg-surface-dark 
            border border-border-light dark:border-border-dark 
            text-text-primary-light dark:text-text-primary-dark">
  <!-- content -->
</div>
```

## Color Palette Reference

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `primary` | #448fe4 | #448fe4 | Buttons, links, accents |
| `secondary` | #50E3C2 | #50E3C2 | Success states, highlights |
| `accent` | #F5A623 | #F5A623 | Warnings, special features |
| `success` | #4CAF50 | #4CAF50 | Positive feedback |
| `background-light/dark` | #f6f7f8 | #111921 | Page backgrounds |
| `surface-light/dark` | #ffffff | #18222c | Card backgrounds |
| `text-primary-light/dark` | #111417 | #f0f4f8 | Primary text |
| `text-secondary-light/dark` | #647487 | #a0aec0 | Secondary text |
| `border-light/dark` | #dce0e5 | #2d3748 | Borders, dividers |

## Toggle Implementation

### Profile Page
Location: `/public/profile.html`

```javascript
// Theme toggle checkbox
<input type="checkbox" id="themeToggle" class="sr-only peer">
<div class="toggle-bg peer-checked:bg-primary"></div>
<div class="toggle-dot peer-checked:translate-x-6"></div>

// Handler
themeToggle.addEventListener('change', () => {
  settings.toggleDarkMode();
  updateThemeUI();
});
```

## Common Issues & Solutions

### Issue: White borders in dark mode
**Cause:** Missing dark mode border classes
**Fix:** Add `dark:border-border-dark` or `dark:border-gray-800`

### Issue: Light background in dark mode
**Cause:** Missing dark background class or hardcoded light color
**Fix:** 
- Add `dark:bg-surface-dark` or `dark:bg-gray-800`
- Remove inline `style="background: white"` or use CSS variables

### Issue: Page loads in wrong mode
**Cause:** Dark mode init script not running early enough
**Fix:** Place init script immediately after Tailwind CDN, before any content

### Issue: Colors don't match design
**Cause:** Page has its own Tailwind config overriding main-app
**Fix:** Ensure all configs use identical color values, or rely on main-app config when loaded inside it

### Issue: Theme toggle doesn't work
**Cause:** settings.js not loaded or toggle not calling `settings.toggleDarkMode()`
**Fix:** Import settings.js and bind toggle to `settings.toggleDarkMode()`

## Testing Checklist

When adding/modifying pages:

- [ ] Dark mode init script present and runs before body
- [ ] Tailwind config includes all color tokens
- [ ] All backgrounds have `dark:` variants
- [ ] All text colors have `dark:` variants
- [ ] All borders have `dark:` variants
- [ ] No hardcoded light colors in inline styles
- [ ] No `!important` overrides preventing dark mode
- [ ] settings.js is imported
- [ ] Toggle updates localStorage correctly
- [ ] Hard refresh respects saved preference
- [ ] System preference fallback works when no localStorage value

## Files with Dark Mode Support

### Core Files
- `/public/settings.js` - Global theme state
- `/public/main-app.html` - Main container with unified config

### Pages (dynamically loaded)
- `/public/lessons.html`
- `/public/practice.html`
- `/public/flashcards.html`
- `/public/character-writing.html`
- `/public/profile.html`
- `/public/lesson.html`

### Standalone Pages (direct access)
- `/public/profile-language-select.html`
- `/public/profile-level-select.html`
- `/public/daily-goal.html`
- `/public/quiz.html`
- `/public/quiz-levels.html`
- `/public/quiz-comprehensive.html`

## Maintenance

When adding new pages:
1. Copy dark mode init script from main-app.html or existing page
2. Copy Tailwind config with complete color palette
3. Import settings.js
4. Use color token classes (`bg-surface-light dark:bg-surface-dark`)
5. Never use hardcoded hex colors in HTML/styles for theme-dependent elements
6. Test in both light and dark modes

When modifying colors:
1. Update main-app.html Tailwind config
2. Update this documentation
3. Test all pages in both modes
4. Consider backward compatibility if users have old cached pages
