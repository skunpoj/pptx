# Scroll Bar Debug Guide

## Problem
The vertical scroll bar is not appearing in the right panel (slide preview section).

## Current CSS Configuration

The CSS is set up correctly in `public/css/styles.css`:

```css
.preview-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.preview-container .preview {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto !important;
    overflow-x: hidden;
}
```

## Debugging Steps

### Step 1: Check Browser Cache
The most common issue is browser caching. Try these in order:

1. **Hard Refresh:**
   - Windows/Linux: `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

2. **Clear Cache:**
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"

3. **Force CSS Reload:**
   - Add `?v=2` to the CSS link in `public/index.html`:
   ```html
   <link rel="stylesheet" href="/css/styles.css?v=2">
   ```

### Step 2: Check with Browser DevTools

1. Open the app in browser
2. Press F12 to open DevTools
3. Click on the preview panel
4. In the Elements tab, find: `<div class="preview" id="preview">`
5. Look at the Computed styles on the right
6. Check these values:
   - `overflow-y` should be `auto`
   - `flex` should be `1 1 auto`
   - `min-height` should be `0px`

### Step 3: Manual CSS Injection Test

In the browser console (F12 > Console tab), paste this:

```javascript
const preview = document.querySelector('.preview-container .preview');
preview.style.overflowY = 'auto';
preview.style.flex = '1 1 auto';
preview.style.minHeight = '0';
preview.style.maxHeight = '100%';
console.log('Scroll fix applied. Check if scroll bar appears now.');
```

If the scroll bar appears after running this, then it's definitely a caching issue.

### Step 4: Check Preview Content

The scroll bar only appears when content overflows. Make sure:

1. You've clicked "Preview Slides" button
2. The slides are actually loaded (you should see slide previews)
3. There are enough slides to cause overflow (6+ slides)

### Step 5: Browser-Specific Issues

Try opening in a different browser:
- Chrome
- Firefox
- Edge

If it works in one browser but not another, it's browser-specific.

## Alternative Fix (if all else fails)

Add this inline style directly to the preview div in `public/index.html`:

Find this line:
```html
<div class="preview" id="preview"></div>
```

Replace with:
```html
<div class="preview" id="preview" style="overflow-y: auto !important; flex: 1; min-height: 0;"></div>
```

## Test Page

Open `http://localhost:3000` and view the test-scroll.html to verify the CSS works in isolation.

If the test page shows scroll bars but your main app doesn't, the issue is with how the preview content is being rendered, not the CSS.

