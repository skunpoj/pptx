# Frontend JavaScript Modules

Clean, modular frontend code for the AI Text2PPT Pro application.

## 📁 Module Structure

```
public/js/
├── app.js          # Application state & initialization
├── ui.js           # UI state & progress management
├── charts.js       # Chart SVG generation
├── themes.js       # Color theme management
├── api.js          # API communication
├── fileHandler.js  # File upload & processing
└── preview.js      # Preview rendering
```

## 🎯 Load Order

**Important:** Modules must be loaded in this order:

```html
<script src="/js/app.js"></script>        <!-- 1. State -->
<script src="/js/ui.js"></script>         <!-- 2. UI utilities -->
<script src="/js/charts.js"></script>     <!-- 3. Charts -->
<script src="/js/themes.js"></script>     <!-- 4. Themes -->
<script src="/js/fileHandler.js"></script><!-- 5. Files -->
<script src="/js/api.js"></script>        <!-- 6. API (uses themes, ui) -->
<script src="/js/preview.js"></script>    <!-- 7. Preview (uses charts, themes) -->
```

## 🔧 Modules Overview

### `app.js` - Application State
**Purpose:** Global state management and initialization  
**Exports:**
- `window.currentSlideData`
- `window.currentProvider`
- `window.selectProvider()`
- `window.saveApiKey()`
- `window.loadExampleByCategory()`

### `ui.js` - UI Management
**Purpose:** UI state, status messages, progress tracking  
**Exports:**
- `window.showStatus(message, type)`
- `window.showProgress()`
- `window.hideProgress()`
- `window.updateProgress(percent, step)`
- `window.switchView(view)`
- `window.scrollToSlide(index)`

### `charts.js` - Chart Generation
**Purpose:** SVG chart rendering for preview  
**Exports:**
- `window.generateChartSVG(chart, theme, width, height)`

**Supported Charts:** bar, column, line, area, pie

### `themes.js` - Theme Management
**Purpose:** Color theme selection and management  
**Exports:**
- `window.colorThemes` - 8+ professional themes
- `window.selectedTheme`
- `window.displayThemeSelector(suggestedKey)`
- `window.selectTheme(themeKey)`

### `api.js` - API Communication
**Purpose:** Backend API calls  
**Exports:**
- `window.getApiKey()`
- `window.generatePreview()`
- `window.generatePresentation()`

### `fileHandler.js` - File Processing
**Purpose:** File uploads and processing  
**Exports:**
- `window.readFileAsText(file)`
- `window.extractColorsFromFiles(files)`
- `window.generateFromPrompt()`

### `preview.js` - Preview Rendering
**Purpose:** Slide preview display  
**Exports:**
- `window.displayPreview(slideData)`
- `window.displayGalleryView(slideData)`

**Features:** List view, gallery view, layout renderers

## 💡 Usage Examples

### Showing Status
```javascript
window.showStatus('Processing...', 'info');
window.showStatus('Success!', 'success');
window.showStatus('Error occurred', 'error');
```

### Managing Progress
```javascript
window.showProgress();
window.updateProgress(25, 'step1');
window.updateProgress(50, 'step2');
window.updateProgress(100, 'step4');
window.hideProgress();
```

### Generating Charts
```javascript
const svg = window.generateChartSVG(
    chartObject,
    themeObject,
    400,  // width
    250   // height
);
```

### Selecting Themes
```javascript
window.selectTheme('corporate-blue');
window.displayThemeSelector('vibrant-purple');
```

## 🎨 Global Variables

All modules export to `window` object for easy access:

```javascript
// State
window.currentSlideData
window.currentProvider
window.currentView
window.selectedTheme
window.templateFile

// Theme Data
window.colorThemes

// Functions (see module sections above)
```

## 🧪 Testing

Each module can be tested independently:

```javascript
// Test theme selection
window.selectTheme('ocean-teal');
console.assert(window.selectedTheme === 'ocean-teal');

// Test chart generation
const svg = window.generateChartSVG(testChart, testTheme);
console.assert(svg.startsWith('<svg'));

// Test status display
window.showStatus('Test', 'info');
console.assert(document.getElementById('status').textContent === 'Test');
```

## 🎯 Design Principles

1. **No Dependencies** - Modules are self-contained
2. **Clear Exports** - Explicit window.* exports
3. **Pure Functions** - No side effects where possible
4. **Error Handling** - Try-catch in all async functions
5. **Documentation** - JSDoc comments on all exports

## 📖 Further Reading

- [MODULAR-STRUCTURE.md](../../MODULAR-STRUCTURE.md) - Architecture
- [DEVELOPER-GUIDE.md](../../DEVELOPER-GUIDE.md) - Dev guide
- [CODE-CLEANUP-SUMMARY.md](../../CODE-CLEANUP-SUMMARY.md) - Cleanup details

