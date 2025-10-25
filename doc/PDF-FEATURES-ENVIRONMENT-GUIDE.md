# PDF Features - Environment-Aware Solution

## Problem Solved ✅

**Issue:** PDF files don't exist when running locally on Windows (development environment)

**Root Cause:** LibreOffice is required for PDF conversion, but it's only installed in the Docker container (production environment), not on local Windows development machines.

## Solution Implemented

The application now **intelligently detects** LibreOffice availability and **conditionally enables/disables** PDF features based on the environment.

---

## How It Works

### 1. Server-Side Detection

**File:** `server.js`

```javascript
// Global state for LibreOffice availability
let LIBREOFFICE_AVAILABLE = false;

// Check on startup
(async () => {
    LIBREOFFICE_AVAILABLE = await checkLibreOffice();
    console.log(`📄 PDF conversion: ${LIBREOFFICE_AVAILABLE ? '✅ Available' : '⚠️ Unavailable'}`);
})();
```

### 2. Capabilities API Endpoint

**New Endpoint:** `GET /api/capabilities`

**Response:**
```json
{
  "pdfConversion": true/false,
  "environment": "development|production",
  "features": {
    "pptxDownload": true,
    "pdfDownload": true/false,
    "pdfViewer": true/false,
    "shareableLinks": true,
    "onlineViewer": true
  },
  "message": "All features available" 
            // OR "PDF features disabled - LibreOffice not installed"
}
```

### 3. Frontend Auto-Detection

**File:** `public/js/api.js`

- Automatically checks `/api/capabilities` on page load
- Stores result in `window.serverCapabilities`
- Conditionally shows/hides PDF buttons based on availability

### 4. User-Friendly Messaging

When LibreOffice is **NOT available** (local dev):
- ❌ PDF download/view buttons are **hidden**
- ℹ️ Warning message is shown:
  > "PDF features are currently unavailable (LibreOffice not installed in dev environment). Use Docker deployment for full PDF conversion and viewing features."

When LibreOffice **IS available** (Docker prod):
- ✅ All PDF buttons are **visible**
- ✅ PDF conversion happens automatically
- ✅ PDF viewer and download work perfectly

---

## Environment Comparison

### Local Development (Windows)

**What Works:**
- ✅ PPTX generation
- ✅ PPTX download (blob URL)
- ✅ PPTX download (direct link)
- ✅ Online slide viewer
- ✅ Shareable links (PPTX only)

**What's Disabled:**
- ❌ PDF conversion
- ❌ PDF download
- ❌ PDF viewer

**Console Output:**
```
📁 File storage initialized
📄 PDF conversion: ⚠️ Unavailable (install LibreOffice)
```

### Docker Production (Linux)

**What Works:**
- ✅ PPTX generation
- ✅ PPTX download (blob URL)
- ✅ PPTX download (direct link)
- ✅ **PDF conversion** ⭐
- ✅ **PDF download** ⭐
- ✅ **PDF viewer** ⭐
- ✅ Online slide viewer
- ✅ Shareable links (PPTX + PDF)

**Console Output:**
```
📁 File storage initialized
📄 PDF conversion: ✅ Available (LibreOffice)
⏳ Auto-converting to PDF...
✅ PDF conversion complete
```

---

## Testing Both Environments

### Test in Development (Windows - No LibreOffice)

```bash
# Start local server
node server.js

# Generate a presentation
# Expected: Only PPTX download buttons, warning message about PDF
```

**Expected Behavior:**
1. Server console shows: `⚠️ Unavailable (install LibreOffice)`
2. Frontend only shows PPTX buttons
3. Warning message appears explaining PDF features are unavailable
4. `/api/capabilities` returns `pdfConversion: false`

### Test in Docker Production (Linux - Has LibreOffice)

```bash
# Build and run Docker container
docker-compose up --build

# Generate a presentation
# Expected: PPTX + PDF download buttons, no warnings
```

**Expected Behavior:**
1. Server console shows: `✅ Available (LibreOffice)`
2. Frontend shows both PPTX and PDF buttons
3. PDF file is auto-generated in background
4. `/api/capabilities` returns `pdfConversion: true`
5. PDF viewer and download work perfectly

---

## API Endpoints Reference

### Health Check
```
GET /api/health
```
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T12:00:00.000Z"
}
```

### Capabilities Check (New! ⭐)
```
GET /api/capabilities
```
**Response (LibreOffice Available):**
```json
{
  "pdfConversion": true,
  "environment": "production",
  "features": {
    "pptxDownload": true,
    "pdfDownload": true,
    "pdfViewer": true,
    "shareableLinks": true,
    "onlineViewer": true
  },
  "message": "All features available"
}
```

**Response (LibreOffice NOT Available):**
```json
{
  "pdfConversion": false,
  "environment": "development",
  "features": {
    "pptxDownload": true,
    "pdfDownload": false,
    "pdfViewer": false,
    "shareableLinks": true,
    "onlineViewer": true
  },
  "message": "PDF features disabled - LibreOffice not installed (use Docker for full features)"
}
```

---

## Files Modified

### Backend
- ✅ `server.js` - Added LibreOffice detection, health/capabilities endpoints
- ✅ `server/utils/fileStorage.js` - Already had LibreOffice check function

### Frontend
- ✅ `public/js/api.js` - Added auto-detection, conditional UI rendering

---

## User Experience

### Development Environment (No PDF)
```
┌─────────────────────────────────────────┐
│  Your Presentation is Ready! 📊         │
├─────────────────────────────────────────┤
│  📦 File size: 487 KB                   │
│  📅 Generated: Oct 25, 2025, 2:30 PM    │
├─────────────────────────────────────────┤
│  [⬇️ Download PPTX]                     │
│  [⬇️ Direct PPTX Link]                  │
│  [👁️ View Slides Online]                │
├─────────────────────────────────────────┤
│  ℹ️ PDF features are currently          │
│     unavailable (LibreOffice not        │
│     installed in dev environment).      │
│     Use Docker for full features.       │
└─────────────────────────────────────────┘
```

### Production Environment (With PDF)
```
┌─────────────────────────────────────────┐
│  Your Presentation is Ready! 📊         │
├─────────────────────────────────────────┤
│  📦 File size: 487 KB                   │
│  📅 Generated: Oct 25, 2025, 2:30 PM    │
├─────────────────────────────────────────┤
│  [⬇️ Download PPTX]                     │
│  [⬇️ Direct PPTX Link]                  │
│  [👁️ View Slides Online]                │
│  [📄 View PDF Online]        ⭐         │
│  [⬇️ Download PDF]           ⭐         │
└─────────────────────────────────────────┘
```

---

## Optional: Install LibreOffice Locally

If you want PDF features in development, install LibreOffice on Windows:

**Quick Install (Chocolatey):**
```powershell
# Run as Administrator
choco install libreoffice-fresh -y
```

**Manual Install:**
1. Download: https://www.libreoffice.org/download/
2. Install to default location
3. Add to PATH: `C:\Program Files\LibreOffice\program`
4. Restart terminal
5. Verify: `soffice --version`
6. Restart Node.js server

**After Installation:**
- Server will auto-detect LibreOffice
- PDF features will become available
- No code changes needed! 🎉

---

## Deployment Checklist

### For Production (Docker)
- ✅ LibreOffice is pre-installed in Dockerfile
- ✅ All features work automatically
- ✅ No additional setup needed

### For Development (Local)
- ⚠️ PDF features disabled by default
- ℹ️ Users see helpful message
- ✅ PPTX features work perfectly
- 🔧 Optional: Install LibreOffice for full features

---

## Summary

✅ **Problem Fixed:** App no longer shows broken PDF buttons in dev environment

✅ **Smart Detection:** Server auto-detects LibreOffice availability

✅ **Environment Aware:** UI adapts based on server capabilities

✅ **User Friendly:** Clear messaging when features are unavailable

✅ **Production Ready:** Full PDF features work in Docker deployment

✅ **No Breaking Changes:** Existing functionality preserved

🎉 **Result:** Seamless experience across both environments!

