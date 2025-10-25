# Docker Fixes for html2pptx/Playwright

## Changes Made

### Dockerfile Updates

1. **Changed base image** from `node:18-bullseye-slim` to `node:18-bullseye`
   - Slim version lacks dependencies needed for Playwright/Chromium
   - Full version includes necessary system libraries

2. **Added Playwright environment variables**
   ```dockerfile
   ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
   ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
   ```

3. **Improved npm install command** with fallback
   - Tries to install @ant/html2pptx from npm first
   - Falls back to local tgz file if needed
   ```dockerfile
   RUN npm install -g pptxgenjs jszip sharp playwright @ant/html2pptx || \
       npm install -g pptxgenjs jszip sharp playwright /tmp/html2pptx.tgz
   ```

4. **Set workspace permissions**
   ```dockerfile
   RUN chmod 777 /app/workspace
   ```

### docker-compose.yml Updates

1. **Added Playwright environment variable**
   ```yaml
   environment:
     - PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
   ```

2. **Increased shared memory for Chromium**
   ```yaml
   shm_size: '2gb'
   ```
   - Chromium needs sufficient shared memory to run properly
   - Default is only 64MB which causes crashes

## How to Rebuild

```bash
# Stop existing container
docker-compose down

# Rebuild with no cache to ensure all changes are applied
docker-compose build --no-cache

# Start the container
docker-compose up -d

# View logs to verify it's working
docker-compose logs -f
```

## Testing

1. Open http://localhost:3000
2. Enter your API key
3. Click "Preview Slides" - should work
4. Click "Generate PowerPoint" - should now complete successfully

## Troubleshooting

If you still get errors:

1. **Check logs:**
   ```bash
   docker-compose logs text2ppt-pro
   ```

2. **Check if Playwright is installed:**
   ```bash
   docker-compose exec text2ppt-pro npx playwright --version
   ```

3. **Check if Chromium is available:**
   ```bash
   docker-compose exec text2ppt-pro ls /ms-playwright/chromium-*/
   ```

4. **Test html2pptx manually:**
   ```bash
   docker-compose exec text2ppt-pro node -e "const {html2pptx} = require('@ant/html2pptx'); console.log('html2pptx loaded');"
   ```

## Common Issues

### Issue: "browserType.launch: Executable doesn't exist"
**Solution:** Rebuild container with `docker-compose build --no-cache`

### Issue: "Failed to launch chromium"
**Solution:** Check shm_size in docker-compose.yml is set to at least 1gb

### Issue: "Permission denied" errors
**Solution:** The workspace directory permissions are now set to 777 in Dockerfile

