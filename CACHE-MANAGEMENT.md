# Cache Management Guide

## Problem: Persistent "SyntaxError: Parser error" in Browser

### Root Cause
The recurring syntax error in `lessons.js:328` (and similar files) is caused by **aggressive browser caching**. The browser serves stale, corrupted, or outdated versions of JavaScript files even after updates.

### Why This Happens
1. **Dynamic Loading**: `main-app.html` fetches pages like `lessons.html` via `fetch()` and injects them dynamically
2. **Double Loading**: Scripts are loaded both:
   - As static files with cache headers
   - Dynamically via DOM injection with query parameters
3. **Browser Cache Priority**: Browsers cache JavaScript files aggressively and may ignore server cache headers
4. **Telegram WebApp Context**: Telegram's in-app browser has its own caching behavior

## Solution: Multi-Layer Cache Busting

### 1. Server-Side Cache Control (bot.js)

**Implementation:**
```javascript
app.use(express.static('public', {
  maxAge: 0,
  etag: false,
  lastModified: true,
  setHeaders: (res, path) => {
    // Prevent caching for HTML and JavaScript
    if (path.endsWith('.html') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    // Allow short caching for assets (CSS, images)
    else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
  }
}));
```

**Headers Sent:**
- `Cache-Control: no-cache, no-store, must-revalidate` - Forces browser to revalidate
- `Pragma: no-cache` - HTTP/1.0 backward compatibility
- `Expires: 0` - Marks content as immediately expired

### 2. Static Version Query Parameters

**In HTML files:**
```html
<script src="lessons.js?v=20251030-fix2"></script>
```

**Update Version:**
- Change the version string after every code change
- Use format: `YYYYMMDD-identifier`
- Examples: `?v=20251030-fix2`, `?v=20251031-hotfix`

### 3. Dynamic Cache Busting (main-app.html)

**For HTML Pages:**
```javascript
const url = tabs[tabName].url + '?v=' + Date.now();
```

**For JavaScript Files:**
```javascript
// Add timestamp to bust cache for app scripts
let finalSrc = srcAttr;
if (!srcAttr.includes('supabase') && 
    !srcAttr.includes('tailwindcss') && 
    !srcAttr.includes('telegram-web-app') &&
    !srcAttr.includes('i18n.js')) {
  const separator = srcAttr.includes('?') ? '&' : '?';
  finalSrc = srcAttr + separator + 'cb=' + Date.now();
}
newScript.src = finalSrc;
```

**Why Timestamp:**
- `Date.now()` generates a unique number every millisecond
- Forces browser to treat it as a new resource
- Works even when server headers are ignored

**Exceptions:**
- **External libraries** (Supabase, Tailwind) - Don't cache-bust to avoid re-downloading large CDN files
- **Global scripts** (i18n.js) - Loaded once in main-app, shouldn't reload per tab

## Testing Cache Issues

### 1. Check Browser Cache
**Chrome DevTools:**
1. Open DevTools (F12)
2. Network tab
3. Disable cache checkbox
4. Reload page (Ctrl/Cmd + Shift + R)

**Check Headers:**
```bash
curl -I http://localhost:3000/lessons.js
```

Expected response:
```
HTTP/1.1 200 OK
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

### 2. Hard Refresh Methods

**Desktop Browsers:**
- Chrome/Edge: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Safari: `Cmd+Option+R`

**Telegram WebApp:**
- Close and reopen the Mini App
- On iOS: Close Telegram completely from app switcher
- On Android: Force stop Telegram app

### 3. Clear Specific Cache

**Chrome:**
1. DevTools → Application tab
2. Storage → Clear site data
3. Check "Cache storage" and "Cached images and files"
4. Click "Clear site data"

**Telegram:**
- Settings → Data and Storage → Storage Usage → Clear Cache

## Deployment Checklist

When deploying code changes:

- [ ] Update version in HTML script tags (`?v=YYYYMMDD-identifier`)
- [ ] Restart backend server to apply new cache headers
- [ ] Clear CDN cache if using Cloudflare/similar
- [ ] Test in incognito/private window first
- [ ] Ask users to hard-refresh or reinstall Mini App if needed

## Common Symptoms

### Symptom: "SyntaxError: Parser error at line X"
**Cause:** Stale JavaScript file  
**Solution:** Hard refresh + version bump

### Symptom: Changes not appearing after deploy
**Cause:** Browser cache or CDN cache  
**Solution:** Update version strings, clear cache

### Symptom: "Function X is not defined"
**Cause:** Script loaded but not executed, or wrong version loaded  
**Solution:** Check console logs for load order, verify cache busting

### Symptom: Intermittent errors
**Cause:** Mix of old and new files loaded  
**Solution:** Ensure all files have matching version strings

## Best Practices

### For Development
1. **Always use DevTools with "Disable cache" checked**
2. **Hard refresh after every code change**
3. **Use unique version strings per deploy**
4. **Test in incognito window before sharing**

### For Production
1. **Increment version strings in lockstep** - All files that depend on each other should have matching versions
2. **Use semantic versions** - `?v=1.2.3` or `?v=20251030-feature-name`
3. **Log script versions** - Add console logs with version info for debugging
4. **Monitor error reports** - Parser errors indicate cache issues

### Version String Strategy

**Option 1: Date-based (current)**
```html
<script src="lessons.js?v=20251030-fix2"></script>
```
- ✅ Simple, chronological
- ✅ Easy to see when file was last updated
- ❌ Need to manually update

**Option 2: Git commit hash**
```bash
# In deploy script
VERSION=$(git rev-parse --short HEAD)
sed -i "s/?v=[^\"]*/?v=$VERSION/g" public/*.html
```
- ✅ Automatic, unique per commit
- ✅ Traceable to exact code version
- ❌ Requires build step

**Option 3: File content hash**
```javascript
// Build-time script
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('md5').update(fs.readFileSync('lessons.js')).digest('hex').slice(0, 8);
// Update HTML with ?v=${hash}
```
- ✅ Changes only when content changes
- ✅ Perfect cache invalidation
- ❌ More complex build process

## Emergency Fix

If users report persistent errors after deploy:

1. **Immediate:**
   ```bash
   # Restart server to apply cache headers
   pm2 restart chinese-learning-bot
   ```

2. **Short-term:**
   - Update all version strings to current timestamp
   - Notify users to hard refresh
   - Consider clearing CDN cache

3. **Long-term:**
   - Implement automated version management
   - Add cache validation in CI/CD
   - Monitor cache headers in production

## Files Requiring Version Management

### Critical (must update together):
- `/public/lessons.html` + `/public/lessons.js`
- `/public/practice.html` + `/public/practice.js`
- `/public/profile.html` + `/public/profile.js`
- `/public/main-app.html` (controls all loading)

### Shared (update less frequently):
- `/public/settings.js` - Global theme/settings
- `/public/i18n.js` - Translation system
- `/public/study-tracker.js` - Progress tracking

### External (never version):
- Telegram WebApp SDK
- Tailwind CSS CDN
- Supabase SDK
- Google Fonts

## Monitoring

### Add Version Logging
```javascript
// In lessons.js
console.log('📦 lessons.js version: 20251030-fix2');
```

### Check Loaded Versions
```javascript
// In browser console
performance.getEntriesByType('resource')
  .filter(r => r.name.includes('.js'))
  .map(r => r.name);
```

### Track Cache Hits
```javascript
// In bot.js
let cacheHits = 0;
app.use((req, res, next) => {
  if (req.headers['if-none-match'] || req.headers['if-modified-since']) {
    cacheHits++;
    console.log(`[CACHE] Potential cache hit: ${req.path} (total: ${cacheHits})`);
  }
  next();
});
```

## References

- [MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Telegram Mini Apps: Debugging](https://core.telegram.org/bots/webapps#debugging-mini-apps)
- [Express static options](https://expressjs.com/en/4x/api.html#express.static)
