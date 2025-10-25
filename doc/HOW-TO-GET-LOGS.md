# How to Get Error Logs for Debugging

## 📋 What I Added

I've added detailed console.log statements to track exactly what's happening:

### Browser Console Logs (For Scroll Bar Issue)
- Preview element detection
- Computed CSS styles
- Scroll height vs client height
- Whether scroll should appear

### Server Logs (For PowerPoint Generation)
- Step-by-step progress (✓ or ⏳)
- Number of slides being generated
- Theme being used
- Each HTML file created
- Conversion script output
- Detailed error messages with stack traces

---

## 🔍 How to Get the Logs

### For SCROLL BAR Issue:

1. **Open your production app in browser**
2. **Press F12** (or right-click → Inspect)
3. **Click "Console" tab**
4. **Click "Preview Slides" button**
5. **You'll see logs like:**
   ```
   === PREVIEW DEBUG START ===
   Preview element: <div class="preview">...</div>
   Preview computed styles: {overflowY: "auto", flex: "1 1 auto", ...}
   Theme selected: Vibrant Purple
   Number of slides: 6
   Rendering list view
   After render - Preview scroll info: {
     scrollHeight: 1234,
     clientHeight: 567,
     hasScroll: true,
     overflowY: "auto"
   }
   === PREVIEW DEBUG END ===
   ```

6. **Copy ALL the console output** and send it to me

---

### For POWERPOINT GENERATION Error:

#### Option A: If using Docker on Railway/Production

1. **Access your Railway dashboard** (or your hosting platform)
2. **Go to your service**
3. **Click "Deployments" tab**
4. **Click "View Logs"**
5. **Try to generate a PowerPoint** from the app
6. **You'll see detailed logs like:**
   ```
   ================================================================================
   POWERPOINT GENERATION REQUEST
   ================================================================================
   📁 Session ID: 1234567890
   📁 Working directory: /app/workspace/1234567890
   ✓ Using provided slide data
   📊 Slide count: 6
   🎨 Theme: Vibrant Purple
   ⏳ Validating slide data...
   ✓ Validation passed
   ⏳ Setting up workspace...
   ✓ Workspace created
   ⏳ Installing dependencies...
   ✓ Dependencies ready
   ⏳ Generating CSS...
   ✓ CSS file created
   ⏳ Generating HTML slides...
     ✓ Created slide0.html (title): My Title
     ✓ Created slide1.html (content): Introduction
     ...
   ✓ Generated 6 HTML files
   ⏳ Generating conversion script...
   ✓ Conversion script created
   ⏳ Running conversion script (this may take 30-60 seconds)...
      Launching Playwright/Chromium for HTML rendering...
   
   [IF ERROR OCCURS, YOU'LL SEE:]
   ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
   GENERATION ERROR
   ❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌
   Error type: Error
   Error message: [detailed error here]
   Error stack: [full stack trace]
   
   --- Script STDOUT ---
   [what the conversion script printed]
   
   --- Script STDERR ---
   [any errors from the conversion script]
   ```

7. **Copy EVERYTHING** between the === lines (especially the error section) and send to me

#### Option B: If running locally

1. **Look at your terminal/command prompt** where you ran the server
2. **Try to generate PowerPoint**
3. **Copy the entire output** from the terminal

---

## 📤 What to Send Me

### For Scroll Bar:
```
Copy from browser console (F12 → Console tab):
=== PREVIEW DEBUG START ===
[paste everything here]
=== PREVIEW DEBUG END ===
```

### For PowerPoint Generation:
```
Copy from server logs (Railway logs or terminal):
================================================================================
POWERPOINT GENERATION REQUEST
================================================================================
[paste everything here including any errors]
```

---

## 🎯 Quick Test Now

1. **Refresh your production app** to load the new logging code
2. **Open browser console** (F12)
3. **Click "Preview Slides"** 
4. **Copy the console output** → Send to me
5. **Try "Generate PowerPoint"**
6. **Check your server logs** (Railway dashboard → View Logs)
7. **Copy the server log output** → Send to me

That's it! With these logs, I can see exactly what's failing and fix it.

