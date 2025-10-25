# Testing Guide - PDF Features Environment Detection

## Quick Test Summary

✅ **Code Changes Completed:**
- Server-side LibreOffice detection
- Health and Capabilities API endpoints
- Frontend auto-detection and conditional UI
- User-friendly messaging

✅ **Linting:** No errors found

## How to Test

### Test 1: Local Development (No LibreOffice)

**Start Server:**
```bash
node server.js
```

**Expected Console Output:**
```
📁 File storage initialized
📄 PDF conversion: ⚠️ Unavailable (install LibreOffice)
Server running on port 3000
```

**Test Endpoints:**
```bash
# Health check
curl http://localhost:3000/api/health

# Capabilities check
curl http://localhost:3000/api/capabilities
```

**Expected Capabilities Response:**
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

**Test in Browser:**
1. Open: http://localhost:3000
2. Generate a presentation
3. **Verify:**
   - ✅ PPTX download buttons appear
   - ❌ PDF buttons are hidden
   - ℹ️ Warning message shown: "PDF features are currently unavailable"

**Browser Console:**
```javascript
// Check capabilities
window.serverCapabilities
// Should show: pdfConversion: false
```

---

### Test 2: Docker Production (With LibreOffice)

**Build and Start:**
```bash
docker-compose up --build
```

**Expected Docker Console Output:**
```
📁 File storage initialized
📄 PDF conversion: ✅ Available (LibreOffice)
Server running on port 3000
```

**Test Endpoints:**
```bash
# Health check
curl http://localhost:3000/api/health

# Capabilities check
curl http://localhost:3000/api/capabilities
```

**Expected Capabilities Response:**
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

**Test in Browser:**
1. Open: http://localhost:3000
2. Generate a presentation
3. **Verify:**
   - ✅ PPTX download buttons appear
   - ✅ PDF download button appears
   - ✅ PDF viewer button appears
   - ❌ No warning message

**Browser Console:**
```javascript
// Check capabilities
window.serverCapabilities
// Should show: pdfConversion: true
```

**Check Generated Files:**
```bash
docker exec ai-text2ppt-pro ls -lh /app/workspace/generated/*/
```

**Expected Files:**
```
presentation.pptx
presentation.pdf     ← Should exist in Docker!
metadata.json
```

---

### Test 3: Automated Test Script

**Run the test script:**
```bash
# Start server first
node server.js

# In another terminal
node test-capabilities.js
```

**Expected Output:**
```
🧪 Testing Server Endpoints...

✅ Health Check Response:
{
  "status": "ok",
  "timestamp": "2025-10-25T..."
}

✅ Capabilities API Response:
{
  "pdfConversion": false,  // or true in Docker
  "environment": "development",
  "features": { ... }
}

📊 Feature Status:
  PDF Conversion: ❌ Unavailable  // or ✅ Available in Docker
  Environment: development
  Message: PDF features disabled - LibreOffice not installed

✅ All tests passed!
```

---

## UI Behavior Matrix

### Local Dev (No LibreOffice)

| Feature | Visible? | Functional? | Notes |
|---------|----------|-------------|-------|
| Download PPTX (blob) | ✅ Yes | ✅ Yes | Works perfectly |
| Direct PPTX Link | ✅ Yes | ✅ Yes | Works perfectly |
| View Slides Online | ✅ Yes | ✅ Yes | Works perfectly |
| View PDF Online | ❌ Hidden | N/A | Not available |
| Download PDF | ❌ Hidden | N/A | Not available |
| Warning Message | ✅ Shown | N/A | Explains PDF unavailable |

### Docker Prod (With LibreOffice)

| Feature | Visible? | Functional? | Notes |
|---------|----------|-------------|-------|
| Download PPTX (blob) | ✅ Yes | ✅ Yes | Works perfectly |
| Direct PPTX Link | ✅ Yes | ✅ Yes | Works perfectly |
| View Slides Online | ✅ Yes | ✅ Yes | Works perfectly |
| View PDF Online | ✅ Yes | ✅ Yes | Works perfectly |
| Download PDF | ✅ Yes | ✅ Yes | Works perfectly |
| Warning Message | ❌ Hidden | N/A | Not shown |

---

## Integration Test Checklist

### Backend Tests
- [ ] Server starts without errors
- [ ] `/api/health` returns 200 with JSON
- [ ] `/api/capabilities` returns correct detection
- [ ] LibreOffice detection works correctly
- [ ] LIBREOFFICE_AVAILABLE flag is set properly

### Frontend Tests
- [ ] `checkServerCapabilities()` runs on page load
- [ ] `window.serverCapabilities` is populated
- [ ] PDF buttons hidden when pdfConversion=false
- [ ] PDF buttons shown when pdfConversion=true
- [ ] Warning message appears when PDF unavailable
- [ ] Warning message hidden when PDF available

### End-to-End Tests
- [ ] Generate presentation in dev (no LibreOffice)
  - [ ] Only PPTX download works
  - [ ] Warning message displayed
- [ ] Generate presentation in Docker (with LibreOffice)
  - [ ] Both PPTX and PDF downloads work
  - [ ] No warning message
  - [ ] PDF file exists in filesystem

---

## Troubleshooting

### Issue: Server won't start
**Solution:** Check for syntax errors
```bash
node -c server.js
```

### Issue: Capabilities endpoint returns 404
**Solution:** Make sure you're using the updated server.js file

### Issue: PDF buttons still showing in dev
**Solution:** 
1. Clear browser cache
2. Hard reload (Ctrl+Shift+R)
3. Check browser console for `window.serverCapabilities`

### Issue: PDF buttons not showing in Docker
**Solution:**
1. Check Docker logs for LibreOffice installation
2. Verify Dockerfile includes LibreOffice
3. Test LibreOffice in container:
```bash
docker exec ai-text2ppt-pro soffice --version
```

---

## Success Criteria

✅ **Local Development:**
- Server starts successfully
- Console shows "PDF conversion: ⚠️ Unavailable"
- Capabilities API returns `pdfConversion: false`
- UI hides PDF buttons
- Warning message is displayed

✅ **Docker Production:**
- Server starts successfully
- Console shows "PDF conversion: ✅ Available"
- Capabilities API returns `pdfConversion: true`
- UI shows all PDF buttons
- No warning message
- PDF files are generated

✅ **Code Quality:**
- No linting errors
- Clean console output
- Proper error handling
- User-friendly messaging

---

## Next Steps

After testing both environments:

1. **If everything works:** Deploy to production with confidence
2. **If issues found:** Review the PDF-FEATURES-ENVIRONMENT-GUIDE.md for troubleshooting
3. **Optional:** Install LibreOffice locally for full dev experience (see INSTALL-LIBREOFFICE-WINDOWS.md)

---

## Quick Reference

**Start Local Server:**
```bash
node server.js
```

**Start Docker Server:**
```bash
docker-compose up --build
```

**Test Endpoints:**
```bash
# Health
curl http://localhost:3000/api/health

# Capabilities
curl http://localhost:3000/api/capabilities
```

**Check Browser Console:**
```javascript
window.serverCapabilities
```

