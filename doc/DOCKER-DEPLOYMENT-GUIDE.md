# 🐳 Docker Deployment Guide - AI Text2PPT Pro

## ✅ All Integration Fixes Applied

The following fixes have been applied and will be included in your Docker deployment:

### Fixed Issues:
1. ✅ **Generate Preview Button** - Now uses `window.generatePreview()`
2. ✅ **Expand Idea Button** - Now uses `window.generateFromPrompt()`
3. ✅ **Status Notifications** - All 29+ instances fixed to use `window.showStatus()`
4. ✅ **Function References** - All cross-module function calls use proper window prefix
5. ✅ **Layout** - AI Generator and Theme Selector repositioned below main panels
6. ✅ **Step Labels** - Removed confusing "Step 0" and "Step 1" labels

### Modified Files (will be built into Docker image):
- ✅ `public/js/api.js` - 30+ fixes for window function calls
- ✅ `public/index.html` - Layout reorganization
- ✅ `public/diagnostic.html` - New diagnostic tool
- ✅ `public/test-integration.html` - New integration tests

---

## 🚀 Deployment Steps

### Step 1: Build Docker Image

```bash
docker-compose build
```

This will:
- Install Node.js 18
- Install LibreOffice (for PDF conversion)
- Copy all application files (including fixes)
- Install npm dependencies
- Create workspace directories

**Expected output:**
```
Successfully built [image-id]
Successfully tagged ai-text2ppt-pro:latest
```

### Step 2: Start Container

```bash
docker-compose up -d
```

**Expected output:**
```
Creating ai-text2ppt-pro ... done
```

### Step 3: Check Container Status

```bash
docker-compose ps
```

**Should show:**
```
NAME               STATUS          PORTS
ai-text2ppt-pro   Up X seconds    0.0.0.0:3000->3000/tcp
```

### Step 4: View Logs

```bash
docker-compose logs -f
```

**Expected output:**
```
Server running on http://localhost:3000
```

---

## 🧪 Testing in Production

### Method 1: Diagnostic Page (Recommended)

Once deployed, access:
```
http://your-domain.com/diagnostic.html
```

**Tests to run:**
1. Click "Test Generate Preview Button" - Should show all ✅
2. Click "Test Expand Idea Button" - Should show all ✅
3. Click "Test Status Notification" - Should show messages
4. Check "System Information" section - Should show loaded modules
5. Check "Required Elements Status" - All should be green

**Expected Results:**
```
✅ window.generatePreview function exists
✅ window.showStatus function exists
✅ window.getApiKey function exists
✅ #textInput element exists
✅ #previewBtn element exists
All checks passed! Generate Preview should work
```

### Method 2: Integration Tests

Access:
```
http://your-domain.com/test-integration.html
```

**Should show:**
- Total Tests: ~30
- Passed: ~30
- Failed: 0

### Method 3: Main Application

Access:
```
http://your-domain.com/
```

**Verification Steps:**

1. **Check Layout** ✅
   - Header at top
   - Two panels side-by-side (Content left, Preview right)
   - AI Generator and Theme Selector below in two columns
   - No "Step 0" or "Step 1" labels

2. **Test Generate Preview Button** ✅
   - Enter some text in "Presentation Content"
   - Click "👁️ Generate Preview"
   - Should show: "⚠️ Please enter your API key first!" (if no key)
   - Status message should appear below action buttons

3. **Test Expand Idea Button** ✅
   - Scroll to "💡 AI Idea Generator" section
   - Should be below main panels, on left side
   - Click "🚀 Expand Idea into Full Content"
   - Should show: "⚠️ Please enter your API key first!" (if no key)

4. **Test Status Notifications** ✅
   - Click any button
   - Status message should appear in the notification area
   - Should have colored background (red for error, green for success)

5. **Set API Key and Test** ✅
   - Scroll to "⚙️ Advanced Configuration"
   - Select provider (Anthropic/OpenAI/Gemini)
   - Enter API key
   - Click "Save Key"
   - Should see: "✅ API key saved!"
   - Now test buttons - should work with real API calls

---

## 🔍 Browser Console Checks

Open browser DevTools (F12) → Console tab:

```javascript
// All should return "function"
typeof window.generatePreview
typeof window.generateFromPrompt
typeof window.showStatus
typeof window.displayPreview
typeof window.getApiKey

// Should return number > 0
Object.keys(window.colorThemes).length

// Should return string (e.g., "anthropic")
window.currentProvider

// Test status manually
window.showStatus('Test message', 'success')
```

**Expected Console Output:**
- No red errors
- No "undefined function" errors
- No "ReferenceError" messages

---

## 📊 Health Check

Check container health:
```bash
docker-compose ps
```

Or direct health check:
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{"status":"ok"}
```

---

## 🐛 Troubleshooting

### Issue: "Function not defined" errors

**Solution:**
```bash
# Rebuild with no cache
docker-compose build --no-cache
docker-compose up -d
```

### Issue: Buttons don't respond

**Check:**
1. Open `/diagnostic.html` first
2. Verify all tests pass
3. Check browser console for errors
4. Hard refresh browser (Ctrl+F5)

**Verify files in container:**
```bash
docker exec ai-text2ppt-pro ls -la /app/public/js/
```

Should show all 8 .js files with recent timestamps.

### Issue: Status notifications don't appear

**Check:**
1. Inspect element, verify `<div id="status">` exists
2. Check CSS is loaded
3. Open `/diagnostic.html` and run status test

### Issue: Layout looks wrong

**Solution:**
```bash
# Clear browser cache
# Hard refresh (Ctrl+Shift+F5)
# Check /diagnostic.html shows all elements found
```

### Issue: Changes not appearing after rebuild

**Solution:**
```bash
# Stop and remove containers
docker-compose down

# Remove images
docker rmi ai-text2ppt-pro

# Rebuild from scratch
docker-compose build --no-cache
docker-compose up -d
```

---

## 📝 Deployment Checklist

Before going live:

- [ ] Build Docker image successfully
- [ ] Container starts without errors
- [ ] Health check passes
- [ ] Access main page (shows new layout)
- [ ] Access `/diagnostic.html` (all tests green)
- [ ] Access `/test-integration.html` (all tests pass)
- [ ] Generate Preview button shows API key warning
- [ ] Expand Idea button shows API key warning
- [ ] Status notifications appear correctly
- [ ] No console errors in browser
- [ ] API key can be saved
- [ ] Theme selector displays themes
- [ ] Welcome modal appears on first visit

After going live with API key:

- [ ] Generate Preview creates slides
- [ ] Expand Idea generates content
- [ ] PowerPoint download works
- [ ] PDF generation works
- [ ] Slide modification works
- [ ] File upload works
- [ ] Theme selection works

---

## 🔐 Environment Variables (Optional)

You can pre-configure in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  # Optional: Pre-configure provider (users can still change)
  - DEFAULT_PROVIDER=anthropic
```

---

## 📦 What's Included in Docker Image

All fixed files:
```
/app/
├── server.js                      ✅ Main server
├── package.json                   ✅ Dependencies
├── public/
│   ├── index.html                ✅ Fixed layout
│   ├── diagnostic.html           ✅ NEW: Diagnostic tool
│   ├── test-integration.html     ✅ NEW: Integration tests
│   ├── js/
│   │   ├── api.js               ✅ FIXED: All window calls
│   │   ├── app.js               ✅ App state
│   │   ├── charts.js            ✅ Chart generation
│   │   ├── fileHandler.js       ✅ File handling
│   │   ├── preview.js           ✅ Preview rendering
│   │   ├── promptEditor.js      ✅ Prompt editor
│   │   ├── themes.js            ✅ Theme system
│   │   └── ui.js                ✅ UI functions
│   └── css/
│       └── styles.css           ✅ Styling
├── server/
│   └── [backend modules]        ✅ API routes
└── workspace/                   ✅ Temp files
```

---

## 🌐 Production URLs

Replace `your-domain.com` with your actual domain:

- **Main App**: `https://your-domain.com/`
- **Diagnostic**: `https://your-domain.com/diagnostic.html`
- **Tests**: `https://your-domain.com/test-integration.html`
- **Health**: `https://your-domain.com/api/health`

---

## 🎯 Success Criteria

✅ **Deployment Successful When:**

1. Container health check shows "healthy"
2. Diagnostic page shows all green checks
3. Integration tests all pass
4. Main page loads with new layout
5. Both buttons show API key warning (before key set)
6. Status notifications appear and display correctly
7. No browser console errors
8. API key can be saved successfully

✅ **Application Working When:**

1. Generate Preview creates slide previews (with API key)
2. Expand Idea generates content (with API key)
3. PowerPoint files download successfully
4. PDF conversion works
5. All features from feature list work

---

## 📞 Quick Reference Commands

```bash
# Build and start
docker-compose up -d --build

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check container
docker-compose ps

# Access container shell
docker exec -it ai-text2ppt-pro /bin/bash

# Check files
docker exec ai-text2ppt-pro ls -la /app/public/js/
```

---

✅ **All fixes are ready for Docker deployment!**

Build and deploy with confidence - all integration issues have been resolved.

