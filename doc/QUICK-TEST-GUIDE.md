# 🚀 Quick Test Guide

## Step 1: Start the Server

```bash
node server.js
```

You should see:
```
Server running on http://localhost:3000
```

## Step 2: Run Diagnostic Tests

1. Open your browser to: **http://localhost:3000/diagnostic.html**

2. Click these buttons in order:
   - ✅ **Test Generate Preview Button** - Should show all green checks
   - ✅ **Test Expand Idea Button** - Should show all green checks  
   - ✅ **Test Status Notification** - Should show status messages in the app

3. Check the console output - all should be green ✅

## Step 3: Run Integration Tests

1. Open: **http://localhost:3000/test-integration.html**

2. Tests will auto-run. You should see:
   - All modules loaded ✅
   - All functions exported ✅
   - All DOM elements found ✅
   - Theme system working ✅

## Step 4: Test Main Application

1. Open: **http://localhost:3000/**

2. **Without API Key** (should show warning):
   - Type some text in "Presentation Content" area
   - Click "👁️ Generate Preview"
   - Should see: "⚠️ Please enter your API key first!"
   
3. **Set API Key**:
   - Scroll to "⚙️ Advanced Configuration"
   - Select provider (Anthropic, OpenAI, etc.)
   - Enter your API key
   - Click "Save Key"
   - Should see: "✅ API key saved!"

4. **Test Generate Preview**:
   - Go back to top
   - Type or load example content
   - Click "👁️ Generate Preview"
   - Should see loading animation and then slide previews

5. **Test Expand Idea**:
   - Scroll to "💡 AI Idea Generator" section
   - Enter an idea (or keep default)
   - Click "🚀 Expand Idea into Full Content"
   - Should see content generated in the text area above

## Expected Results

### ✅ What Should Work:
1. Generate Preview button - creates slide previews
2. Expand Idea button - generates content from prompt
3. Status notifications - appear below action buttons
4. Welcome modal - shows on first visit
5. Theme selection - allows choosing color schemes
6. File upload - accepts documents
7. Example loading - quick start templates
8. Slide modification - AI-powered edits
9. PowerPoint generation - downloads PPTX

### ❌ Common Issues:

**"Function not defined" errors:**
- Solution: Refresh page, check browser console
- Verify all .js files loaded in Network tab

**"Please enter API key" even after saving:**
- Solution: Check localStorage in browser DevTools
- Try saving key again
- Check provider selection matches saved key

**No status notifications appearing:**
- Solution: Check #status element exists
- Refresh diagnostic page
- Check browser console for errors

**Buttons don't respond:**
- Solution: Open diagnostic.html first
- Check all function tests pass
- Verify onclick handlers in HTML

## Browser Console Commands

Open DevTools (F12) and run these to verify:

```javascript
// Check functions exist
typeof window.generatePreview        // Should be "function"
typeof window.generateFromPrompt     // Should be "function"
typeof window.showStatus             // Should be "function"
typeof window.displayPreview         // Should be "function"

// Check themes loaded
Object.keys(window.colorThemes).length  // Should be > 0

// Check current provider
window.currentProvider  // Should be "anthropic" or your selection

// Test status manually
window.showStatus('Test message', 'success')
```

## Troubleshooting Steps

1. **Clear browser cache**: Ctrl+Shift+Del
2. **Hard refresh**: Ctrl+F5
3. **Check server is running**: Should see "Server running..." in terminal
4. **Restart server**: Stop (Ctrl+C) and restart `node server.js`
5. **Check all files exist**: Verify public/js/ has all 8 .js files

## Files to Check

All these should exist:
```
public/
├── index.html                 ✅ Main app
├── diagnostic.html            ✅ Diagnostic tool
├── test-integration.html      ✅ Integration tests
├── js/
│   ├── api.js                ✅ API calls
│   ├── app.js                ✅ App state
│   ├── charts.js             ✅ Charts
│   ├── fileHandler.js        ✅ File handling
│   ├── preview.js            ✅ Preview rendering
│   ├── promptEditor.js       ✅ Prompt editor
│   ├── themes.js             ✅ Theme system
│   └── ui.js                 ✅ UI functions
└── css/
    └── styles.css            ✅ Styles
```

## Success Checklist

- [ ] Server starts without errors
- [ ] Diagnostic page shows all green checks
- [ ] Integration tests all pass
- [ ] Main page loads without console errors
- [ ] Generate Preview button shows "API key" warning (before key set)
- [ ] Expand Idea button shows "API key" warning (before key set)
- [ ] API key can be saved successfully
- [ ] Status notifications appear correctly
- [ ] Welcome modal appears on first visit
- [ ] Theme selector displays themes

## Getting Help

If all tests pass but something still doesn't work:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Take screenshot of any errors
4. Note which button/feature isn't working
5. Share console errors for debugging

---

✅ **All systems should be operational after these tests!**

