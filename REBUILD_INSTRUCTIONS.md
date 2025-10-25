# Rebuild Instructions for Playwright Fix

## Issue Fixed
The Playwright browser cache permission error has been fixed in the Dockerfile by installing Playwright as `appuser` instead of `root`.

## How to Rebuild and Deploy

### Option 1: Using Railway (Recommended)
1. Commit the changes:
   ```bash
   git add Dockerfile config/prompts.json
   git commit -m "Fix Playwright permissions and update examples with charts/images/shapes"
   git push origin main
   ```

2. Railway will automatically rebuild and deploy

3. Wait for the deployment to complete (check Railway dashboard)

### Option 2: Local Docker Testing
1. Stop the current container:
   ```bash
   docker-compose down
   ```

2. Rebuild the image:
   ```bash
   docker-compose build --no-cache
   ```

3. Start the container:
   ```bash
   docker-compose up -d
   ```

4. Check logs:
   ```bash
   docker-compose logs -f
   ```

## What Was Changed

### 1. Dockerfile (Fixed Playwright Permissions)
- Moved Playwright installation to run **after** switching to `appuser`
- This ensures the Playwright cache directory (`.cache/ms-playwright`) is owned by `appuser`
- **Before**: Playwright installed as root → permission denied for appuser
- **After**: Playwright installed as appuser → full permissions

### 2. Example Templates (Enhanced with Charts/Images/Shapes)
All 6 example templates now include:
- ✅ Explicit chart data with specific values
- ✅ Image placeholders with `[IMAGE: description]`
- ✅ Shape usage instructions (rectangles, circles, arrows, etc.)

## After Rebuild
Test by:
1. Open the application
2. Select any example template
3. Click "Preview Slides"
4. Verify charts, images, and shapes appear
5. Click "Generate PowerPoint"
6. Download and verify the .pptx file

## If Charts/Images Still Don't Appear
The AI might need a different content format. We can adjust the example template structure if needed.

