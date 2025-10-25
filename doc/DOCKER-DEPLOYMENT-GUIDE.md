# 🐳 Docker Deployment Guide

## Quick Start

All changes are now applied to your code. To deploy them to production:

### 1. Rebuild Docker Image
```bash
cd /path/to/pptx-1
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Why `--no-cache`?**
- Ensures all code changes are included
- Prevents using old cached layers
- Guarantees fresh build with latest fixes

### 2. Verify Deployment
```bash
# Check container is running
docker-compose ps

# Check logs
docker-compose logs -f
```

### 3. Test the Application

Visit these URLs (replace with your production URL):

**Test Page:**
```
https://your-production-url/test-features.html
```
- Click "🚀 Run All Tests"
- All tests should pass ✅

**Main Application:**
```
https://your-production-url/
```
- Generate preview
- Verify scroll bar appears
- Create PowerPoint

---

## What Was Fixed

### ✅ File Organization
- All `.md` files now in `doc/` folder
- Test JavaScript files in `test/` folder
- Clean project structure

### ✅ Error Messages
- Clear, user-friendly error messages
- No more console output shown as errors
- Proper error handling

### ✅ Progressive Rendering
- Slides render smoothly with animation
- `renderSlidePreviewCard` function properly exported
- Module dependencies fixed

### ✅ Scroll Bar
- CSS confirmed correct
- Appears automatically when content exceeds container
- Test page included to verify

---

## Testing Instructions

### Test Page Features

1. **Open Test Page**
   ```
   https://your-production-url/test-features.html
   ```

2. **Run All Tests**
   - Click "🚀 Run All Tests"
   - Should see all green checkmarks ✅

3. **Test Scroll Bar**
   - Click "📜 Test Scroll Bar"
   - Scrollable container appears
   - Metrics show scroll is working

4. **Test Progressive Rendering**
   - Click "⚡ Test Progressive Rendering"
   - Watch 6 slides render with animation
   - Scroll bar appears if content is tall

### Main Application Testing

1. **Load Example Content**
   - Click any category (Tech, Business, etc.)
   - Content loads in textarea

2. **Generate Preview**
   - Enter your API key
   - Click "👁️ Preview Slides"
   - Slides render progressively
   - Scroll bar appears with multiple slides

3. **Generate PowerPoint**
   - Click "✨ Generate PowerPoint"
   - Wait for generation
   - Download should start
   - Error messages are clear if issues occur

---

## Browser Console Checks

Open browser DevTools (F12) and check:

### ✅ Expected (No Errors)
```javascript
// These should all be available
typeof window.showStatus           // "function"
typeof window.displayPreview        // "function"
typeof window.renderSlidePreviewCard // "function"
typeof window.colorThemes           // "object"
typeof window.switchView            // "function"
```

### ❌ Should NOT See
- `Uncaught ReferenceError: switchView is not defined`
- `module is not defined`
- `renderSlidePreviewCard is not a function`

---

## Docker Commands Reference

### View Logs
```bash
# Follow logs in real-time
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service logs
docker-compose logs -f web
```

### Check Container Status
```bash
# List running containers
docker-compose ps

# Detailed info
docker ps -a
```

### Restart Container
```bash
# Restart without rebuilding
docker-compose restart

# Stop and start
docker-compose down
docker-compose up -d
```

### Complete Rebuild
```bash
# Nuclear option - completely fresh build
docker-compose down -v
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

---

## Troubleshooting

### Issue: Changes Not Visible

**Solution:**
```bash
# Force rebuild without cache
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clear browser cache too
# Hard reload: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
```

### Issue: Container Won't Start

**Check logs:**
```bash
docker-compose logs

# Look for:
# - Port conflicts
# - Missing dependencies
# - npm install errors
```

**Solution:**
```bash
# Check if port 3000 is in use
docker-compose down
docker ps | grep 3000

# If another container is using it, stop it
docker stop <container-id>

# Restart
docker-compose up -d
```

### Issue: "module.exports" Errors in Browser

**This is fixed in the code, but if you still see it:**
```bash
# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d

# Hard refresh browser
# Ctrl+Shift+R
```

### Issue: Test Page Shows Failures

**Check which tests fail:**
- Server Version → Check if container is running
- Function Tests → Hard refresh browser (Ctrl+Shift+R)
- Scroll Bar → Might be expected if content fits
- Progressive Rendering → Check browser console for errors

**Solution:**
```bash
# Rebuild and hard refresh
docker-compose build --no-cache
docker-compose up -d
# Then hard refresh browser
```

### Issue: Scroll Bar Not Showing

**This might be expected!**
- Scroll bar only appears when content height > container height
- With few slides, content might fit
- Use test page "Test Progressive Rendering" to see with 6 slides

---

## Files Modified in This Update

### Server-Side
- `server/utils/helpers.js` - Error handling fixed

### Client-Side
- `public/js/preview.js` - Module exports fixed
- `public/test-features.html` - New test page added

### Documentation
- `doc/FIXES-APPLIED-2025-10-25.md` - Detailed changelog
- `doc/DOCKER-DEPLOYMENT-GUIDE.md` - This guide

### Organization
- All `.md` files moved to `doc/`
- Test `.js` files moved to `test/`

---

## Verification Checklist

After deployment, verify:

- [ ] Container is running: `docker-compose ps`
- [ ] Logs show no errors: `docker-compose logs`
- [ ] Test page loads: `/test-features.html`
- [ ] All tests pass on test page
- [ ] Main app loads: `/`
- [ ] Preview generation works
- [ ] Scroll bar appears with many slides
- [ ] PowerPoint generation works
- [ ] Error messages are clear
- [ ] No console errors in browser

---

## Production URL Setup

If you need to update your production URL in any configs:

1. **Check docker-compose.yml**
   - Environment variables
   - Port mappings

2. **Check Dockerfile**
   - EXPOSE directives
   - ENV variables

3. **Check reverse proxy** (if using)
   - nginx/Apache configuration
   - SSL certificates
   - Domain routing

---

## Support

### Quick Debug Steps
1. Check Docker logs: `docker-compose logs -f`
2. Check browser console: F12 → Console
3. Try test page: `/test-features.html`
4. Hard refresh browser: Ctrl+Shift+R
5. Rebuild if needed: `docker-compose build --no-cache`

### Log Locations
- **Docker logs:** `docker-compose logs`
- **Browser console:** F12 → Console tab
- **Network tab:** F12 → Network tab (for API calls)

### Still Having Issues?
1. Ensure you ran `docker-compose build --no-cache`
2. Hard refresh your browser (Ctrl+Shift+R)
3. Check browser console for JavaScript errors
4. Check Docker logs for server errors
5. Try the test page first to isolate the issue

---

## Version Information

**Update Date:** October 25, 2025  
**Version:** 2.0.1-fixes  
**Deployment:** Docker Production  
**Status:** ✅ Ready to Deploy

