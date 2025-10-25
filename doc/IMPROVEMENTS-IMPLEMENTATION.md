# Implementation Plan: UI & Feature Improvements

## Tasks to Complete

### 1. Fix Chart Rendering in Downloaded PPT ✅
**Issue:** Charts not showing in downloaded PowerPoint files
**Root Cause:** pptxgenjs chart type mapping issue
**Solution:** Use correct ChartType enum values

### 2. Add Auto PPT-to-PDF Conversion ✅
**Feature:** Automatic PDF generation from PowerPoint
**Implementation:** Use LibreOffice/unoconv or similar
**View:** Standard HTML `<embed>` or `<iframe>` tag

### 3. Move Modify/Download Buttons Above Status ✅
**Current:** Below preview area
**New:** Above status notification for better UX

### 4. Split Input Sections into Separate Divs ✅
**Current:** Content and AI Idea Generator mixed
**New:** Clear visual separation with borders

## Implementation Details

### Chart Fix Strategy
pptxgenjs supports these chart types:
- `pptx.ChartType.bar` (horizontal bars)
- `pptx.ChartType.col` (vertical columns) 
- `pptx.ChartType.pie`
- `pptx.ChartType.line`
- `pptx.ChartType.area`

Current code uses: `BAR`, `COLUMN`, `PIE`, `LINE`, `AREA` (uppercase)
Need to use: `bar`, `col`, `pie`, `line`, `area` (lowercase, and `col` not `column`)

### PDF Conversion Options
1. **LibreOffice (Recommended):**
   - Command: `soffice --headless --convert-to pdf presentation.pptx`
   - Pros: Free, good quality, widely supported
   - Cons: Requires installation

2. **unoconv:**
   - Wrapper around LibreOffice
   - Easier CLI interface

3. **pdf-lib (JavaScript):**
   - Pure JS solution
   - No external dependencies
   - Limited PowerPoint support

## Next Steps
1. Fix chart type mapping
2. Install LibreOffice for PDF conversion
3. Add PDF generation endpoint
4. Update UI layout
5. Test all features

