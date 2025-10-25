# Developer Guide - Modular Architecture

## 🎯 Quick Start for Developers

This guide helps developers understand and work with the new modular architecture.

---

## 📁 Module Overview

### Backend Modules (Node.js)

```javascript
server/
├── utils/
│   ├── ai.js              // AI provider communication
│   └── generators.js      // HTML/CSS/Script generation
├── routes/
│   ├── content.js         // Content generation endpoints
│   ├── presentation.js    // Presentation endpoints (to create)
│   └── files.js           // File processing endpoints (to create)
└── config/
    └── themes.js          // Theme configurations (optional)
```

### Frontend Modules (Browser JavaScript)

```javascript
public/js/
├── themes.js         // Color theme management
├── api.js            // API communication
├── ui.js             // UI state & progress (to create)
├── preview.js        // Preview rendering (to create)
├── charts.js         // Chart SVG generation (to create)
└── fileHandler.js    // File upload handling (to create)
```

---

## 🔧 Using Backend Modules

### 1. AI Communication (`server/utils/ai.js`)

```javascript
const { callAI } = require('./server/utils/ai');

// Call any AI provider
async function generateContent() {
    const response = await callAI(
        'anthropic',           // Provider: anthropic|openai|gemini|openrouter
        process.env.API_KEY,   // API key
        'Generate a slide...'  // Prompt
    );
    return response;
}
```

**Supported Providers:**
- `anthropic` → Claude Sonnet 4
- `openai` → GPT-4o
- `gemini` → Gemini 1.5 Pro
- `openrouter` → Claude via OpenRouter

### 2. HTML Generation (`server/utils/generators.js`)

```javascript
const { generateSlideHTML, generateCSS } = require('./server/utils/generators');

// Generate slide HTML
const slideHTML = generateSlideHTML(slideData, themeObject);

// Generate theme CSS
const css = generateCSS(themeObject);
```

**Available Generators:**
- `generateCSS(theme)` - CSS variables
- `escapeHtml(text)` - Sanitize HTML
- `generateSlideHTML(slide, theme)` - Full slide HTML
- `generateConversionScript(htmlFiles, slides)` - pptxgen script

### 3. Content Routes (`server/routes/content.js`)

```javascript
const contentRoutes = require('./server/routes/content');
app.use('/api', contentRoutes);
```

**Endpoints:**
- `POST /api/generate-content` - Generate content from prompt
  - Body: `{ prompt, apiKey, provider, numSlides, generateImages, stream }`
  - Returns: `{ content }` or streaming SSE

---

## 🎨 Using Frontend Modules

### 1. Theme Management (`public/js/themes.js`)

```javascript
// Access global theme object
console.log(window.colorThemes['corporate-blue']);

// Display theme selector
window.displayThemeSelector('vibrant-purple');

// Change theme
window.selectTheme('ocean-teal');

// Get selected theme
const current = window.selectedTheme;
```

**Theme Object Structure:**
```javascript
{
    name: 'Corporate Blue',
    description: 'Professional and trustworthy',
    colorPrimary: '#1C2833',
    colorSecondary: '#2E4053',
    colorAccent: '#3498DB',
    colorBackground: '#FFFFFF',
    colorText: '#1d1d1d',
    category: ['business', 'corporate', 'finance']
}
```

### 2. API Communication (`public/js/api.js`)

```javascript
// Generate preview
await window.generatePreview();

// Generate PowerPoint
await window.generatePresentation();

// Get API key
const apiKey = window.getApiKey();
```

**Flow:**
```
generatePreview() → /api/preview → currentSlideData updated → displayPreview()
generatePresentation() → /api/generate → Download PPTX
```

### 3. Chart Generation (`public/js/charts.js` - to create)

```javascript
// Generate chart SVG
const svg = window.generateChartSVG(
    chartObject,     // Chart data
    themeObject,     // Color theme
    400,             // Width
    250              // Height
);
```

**Chart Data Structure:**
```javascript
{
    type: 'column',
    title: 'Quarterly Revenue',
    data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
            name: 'Revenue ($M)',
            values: [45, 52, 68, 73]
        }]
    }
}
```

---

## 🔨 Common Development Tasks

### Adding a New Theme

**File:** `public/js/themes.js`

```javascript
colorThemes['new-theme'] = {
    name: 'New Theme Name',
    description: 'Theme description',
    colorPrimary: '#1C2833',
    colorSecondary: '#2E4053',
    colorAccent: '#3498DB',
    colorBackground: '#FFFFFF',
    colorText: '#1d1d1d',
    category: ['industry1', 'industry2']
};
```

**Result:** Theme automatically appears in selector ✅

### Adding a New Chart Type

**File:** `public/js/charts.js` (to create)

```javascript
function generateChartSVG(chart, theme, width, height) {
    // ... existing code ...
    
    else if (type === 'newType') {
        // Your chart rendering logic
        let svg = `<svg width="${width}" height="${height}">`;
        // ... draw chart ...
        svg += '</svg>';
        return svg;
    }
}
```

**Also update:**
- Server AI prompt to suggest new type
- PptxGenJS chart generation

### Adding a New API Endpoint

**1. Create route file:**
```javascript
// server/routes/newFeature.js
const express = require('express');
const router = express.Router();

router.post('/api/new-feature', async (req, res) => {
    try {
        // Your logic here
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
```

**2. Import in server.js:**
```javascript
const newFeatureRoutes = require('./server/routes/newFeature');
app.use('/api', newFeatureRoutes);
```

**3. Call from frontend:**
```javascript
// public/js/newFeature.js
async function callNewFeature() {
    const response = await fetch('/api/new-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
    });
    return await response.json();
}
```

---

## 🧪 Testing Modules

### Testing Backend Modules

```javascript
// test/ai.test.js
const { callAI } = require('../server/utils/ai');

test('AI returns content', async () => {
    const result = await callAI('anthropic', API_KEY, 'Test prompt');
    expect(result).toBeTruthy();
});

// test/generators.test.js
const { generateCSS } = require('../server/utils/generators');

test('CSS generation includes colors', () => {
    const theme = { colorPrimary: '#1C2833' };
    const css = generateCSS(theme);
    expect(css).toContain('#1C2833');
});
```

### Testing Frontend Modules

```javascript
// test/themes.test.js
describe('Theme Management', () => {
    test('Theme selection works', () => {
        selectTheme('corporate-blue');
        expect(window.selectedTheme).toBe('corporate-blue');
    });
    
    test('Theme has required properties', () => {
        const theme = window.colorThemes['corporate-blue'];
        expect(theme.colorPrimary).toBeDefined();
        expect(theme.name).toBe('Corporate Blue');
    });
});
```

---

## 📖 Module Dependencies

### Backend Dependencies

```
server.js
  ├─ server/routes/content.js
  │    └─ server/utils/ai.js
  ├─ server/routes/presentation.js
  │    ├─ server/utils/ai.js
  │    └─ server/utils/generators.js
  └─ server/routes/files.js
       └─ multer
```

### Frontend Dependencies

```
index.html
  ├─ js/themes.js (loaded first)
  ├─ js/charts.js (used by preview.js)
  ├─ js/ui.js (used by all)
  ├─ js/api.js (uses themes, ui)
  ├─ js/preview.js (uses charts, themes)
  └─ js/fileHandler.js (uses themes)
```

**Load Order Matters!** ⚠️
```html
<!-- Correct order -->
<script src="/js/themes.js"></script>
<script src="/js/charts.js"></script>
<script src="/js/ui.js"></script>
<script src="/js/api.js"></script>
<script src="/js/preview.js"></script>
<script src="/js/fileHandler.js"></script>
```

---

## 🔍 Debugging Guide

### Backend Issues

**Problem:** Route not found
```bash
# Check route registration in server.js
app.use('/api', contentRoutes);  // Is this line present?

# Check route definition
router.post('/api/generate-content', ...);  // Correct path?
```

**Problem:** AI API error
```bash
# Check server/utils/ai.js
# Add logging:
console.log('Calling AI:', provider, prompt.substring(0, 100));
```

### Frontend Issues

**Problem:** Function not defined
```bash
# Check module load order in index.html
# Ensure dependencies load first

# Check window export
window.functionName = functionName;  // In module file
```

**Problem:** Theme not applying
```bash
# Check themes.js loaded
console.log(window.colorThemes);  // Should show all themes

# Check theme selection
console.log(window.selectedTheme);  // Should show selected key
```

---

## 📚 Module API Reference

### `server/utils/ai.js`

```typescript
interface AIModule {
    callAI(
        provider: 'anthropic' | 'openai' | 'gemini' | 'openrouter',
        apiKey: string,
        userPrompt: string
    ): Promise<string>;
}
```

### `server/utils/generators.js`

```typescript
interface GeneratorsModule {
    generateCSS(theme: Theme): string;
    escapeHtml(text: string): string;
    generateSlideHTML(slide: Slide, theme: Theme): string;
    generateConversionScript(htmlFiles: string[], slides: Slide[]): string;
}
```

### `public/js/themes.js`

```typescript
interface ThemesModule {
    colorThemes: { [key: string]: Theme };
    selectedTheme: string | null;
    displayThemeSelector(suggestedThemeKey: string): void;
    selectTheme(themeKey: string): void;
}
```

### `public/js/api.js`

```typescript
interface APIModule {
    getApiKey(): string | null;
    generatePreview(): Promise<void>;
    generatePresentation(): Promise<void>;
}
```

---

## 🎓 Best Practices

### 1. Module Exports
```javascript
// ✅ Good - Export only what's needed
module.exports = { callAI, parseResponse };

// ❌ Avoid - Exporting too much
module.exports = { everything, including, internal, helpers };
```

### 2. Error Handling
```javascript
// ✅ Good - Handle errors in module
async function callAI(provider, apiKey, prompt) {
    try {
        const response = await fetch(...);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        return data;
    } catch (error) {
        console.error('AI Call Error:', error);
        throw error;
    }
}

// ❌ Avoid - Silent failures
async function callAI() {
    const response = await fetch(...);
    return response.json();  // No error handling
}
```

### 3. Dependencies
```javascript
// ✅ Good - Minimal dependencies
const { callAI } = require('../utils/ai');

// ❌ Avoid - Circular dependencies
const routes = require('../routes/presentation');  // Don't import routes in utils
```

### 4. Global Variables
```javascript
// ✅ Good - Explicit window exports
window.selectTheme = selectTheme;

// ❌ Avoid - Implicit globals
selectTheme = function() { }  // Missing var/let/const
```

---

## 🔄 Migration Checklist

For developers migrating existing code:

- [ ] Identify logical module boundaries
- [ ] Extract functions into appropriate modules
- [ ] Update imports/requires
- [ ] Export functions to window (frontend)
- [ ] Test each module independently
- [ ] Update documentation
- [ ] Remove old code from monolithic files
- [ ] Test integrated functionality

---

## 📞 Support

- **Documentation:** See MODULAR-STRUCTURE.md
- **Refactoring Details:** See REFACTORING-GUIDE.md
- **Complete Changes:** See ALL-FIXES-SUMMARY.md
- **Main README:** See README.md

---

**The modular architecture makes the codebase professional, maintainable, and scalable!** 🚀

