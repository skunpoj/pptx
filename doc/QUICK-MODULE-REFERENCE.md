# 🚀 Quick Module Reference Guide

## 30-Second Developer Onboarding

---

## 📂 Where to Find Code

### Need to...?

| Task | File | Function |
|------|------|----------|
| **Call AI** | `server/utils/ai.js` | `callAI(provider, key, prompt)` |
| **Generate HTML** | `server/utils/slideLayouts.js` | `generateTitleSlide()` |
| **Setup workspace** | `server/utils/workspace.js` | `setupWorkspace()` |
| **Create prompt** | `server/utils/prompts.js` | `getPreviewPrompt()` |
| **Show progress** | `public/js/ui.js` | `updateProgress(50, 'step2')` |
| **Render chart** | `public/js/charts.js` | `generateChartSVG()` |
| **Change theme** | `public/js/themes.js` | `selectTheme('corporate-blue')` |
| **Display preview** | `public/js/preview.js` | `displayPreview()` |
| **Handle files** | `public/js/fileHandler.js` | `extractColorsFromFiles()` |
| **Get constants** | `server/config/constants.js` | `SERVER_CONFIG.PORT` |

---

## 🔧 Common Tasks

### Add New AI Provider
**File:** `server/utils/ai.js`
```javascript
else if (provider === 'newProvider') {
    // Your implementation
}
```

### Add New Theme
**File:** `public/js/themes.js`
```javascript
colorThemes['new-theme'] = {
    name: 'New Theme',
    colorPrimary: '#...',
    // ...
};
```

### Add New Chart Type
**File:** `public/js/charts.js`
```javascript
case 'newType':
    return generateNewTypeChart(...);
```

### Add New Route
1. Create: `server/routes/newRoute.js`
2. Import in: `server.js`
3. Use: `app.use('/api', newRoutes);`

---

## 📝 Module Cheat Sheet

### Backend Quick Reference
```javascript
// AI
const { callAI } = require('./server/utils/ai');

// Helpers
const { escapeHtml, validateSlideData } = require('./server/utils/helpers');

// Workspace
const { setupWorkspace, runScript } = require('./server/utils/workspace');

// Prompts
const { getPreviewPrompt } = require('./server/utils/prompts');

// Layouts
const { generateTitleSlide } = require('./server/utils/slideLayouts');

// Constants
const { SERVER_CONFIG } = require('./server/config/constants');
```

### Frontend Quick Reference
```javascript
// State
window.currentSlideData
window.currentProvider

// UI
window.showStatus('Message', 'info');
window.updateProgress(75, 'step3');

// Charts
window.generateChartSVG(chart, theme, 400, 250);

// Themes
window.selectTheme('ocean-teal');

// API
window.generatePreview();
window.generatePresentation();

// Preview
window.displayPreview(slideData);
window.switchView('gallery');
```

---

## 🎯 File Size Guide

| File | Lines | Status |
|------|-------|--------|
| constants.js | 150 | ✅ Perfect |
| ai.js | 150 | ✅ Perfect |
| helpers.js | 120 | ✅ Perfect |
| workspace.js | 150 | ✅ Perfect |
| prompts.js | 180 | ✅ Perfect |
| slideLayouts.js | 200 | ✅ Perfect |
| generators.js | 170 | ✅ Perfect |
| app.js | 200 | ✅ Perfect |
| ui.js | 140 | ✅ Perfect |
| charts.js | 180 | ✅ Perfect |
| themes.js | 200 | ✅ Perfect |
| api.js | 150 | ✅ Perfect |
| fileHandler.js | 220 | ✅ Perfect |
| preview.js | 300 | ✅ Good |

**All files under 350 lines!** ✅

---

## 💡 Quick Tips

### Finding Code
1. **Know the layer** - Backend or Frontend?
2. **Know the category** - Config, Utils, Routes, UI?
3. **Check README** - Each directory has one

### Making Changes
1. **Find the module** - Use file size guide
2. **Read JSDoc** - Function documentation
3. **Make change** - Isolated, focused
4. **Test** - Module-level testing

### Adding Features
1. **Create module** - Or add to existing
2. **Export functions** - Clear API
3. **Document** - JSDoc comments
4. **Import** - In main files

---

## 📚 Full Documentation

For complete details, see:

- **Architecture:** `MODULAR-STRUCTURE.md`
- **Refactoring:** `REFACTORING-GUIDE.md`
- **Development:** `DEVELOPER-GUIDE.md`
- **Cleanup:** `CODE-CLEANUP-SUMMARY.md`
- **Features:** `ALL-FIXES-SUMMARY.md`
- **Report:** `FINAL-REFACTORING-REPORT.md`

---

**Quick start: Just read the README in each directory!** 📖

