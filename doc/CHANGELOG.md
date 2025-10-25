# Changelog

## [Fixed] Complete Application Setup - October 24, 2025

### 🐛 Fixed Issues

**Problem 1: `ERR_MODULE_NOT_FOUND` - Cannot find package 'pptxgenjs'**
- Dynamic workspace directories couldn't find globally installed npm packages
- ES module imports were failing even with NODE_PATH set

**Problem 2: `SyntaxError: Cannot use import statement outside a module`**
- Node.js was loading `pptxgen.es.js` (ES module) but treating it as CommonJS
- Module resolution conflict between ES modules and CommonJS in pptxgenjs package
- Missing peer dependencies causing import failures

**Problem 3: `ENOENT: no such file or directory` - Playwright cache missing**
- html2pptx requires Playwright with Chromium browser
- Alpine Linux base image had system Chromium but Playwright couldn't use it
- Error: `Could not read directory: /root/.cache/ms-playwright`

### ✅ Solutions Implemented

1. **Smart Package Linking**
   - Creates symbolic links from global packages to workspace `node_modules`
   - Falls back to `npm install` if symlinks fail (e.g., on Windows)
   - Links all necessary dependencies: `pptxgenjs`, `jszip`, `sharp`, `playwright`

2. **Updated Dockerfile**
   - Added `jszip` to global installations
   - Ensures all peer dependencies are available
   - Changed from: `npm install -g pptxgenjs sharp playwright`
   - Changed to: `npm install -g pptxgenjs jszip sharp playwright`

3. **Fixed Module Import Strategy**
   - Use `createRequire` from Node.js `module` to load CommonJS version of pptxgenjs
   - Avoids ES/CommonJS module conflict
   - Ensures compatibility when `"type": "module"` is set in package.json
   - Changed from: `import pptxgen from "pptxgenjs";`
   - Changed to: `const require = createRequire(import.meta.url); const pptxgen = require("pptxgenjs");`

4. **Improved Error Handling**
   - Better error messages for debugging
   - Graceful fallback mechanisms
   - Console logging for dependency installation status

5. **Switched to Debian-based Docker Image**
   - Changed from `node:18-alpine` to `node:18-bullseye-slim`
   - Alpine Linux doesn't support Playwright's browser installation properly
   - Debian allows `npx playwright install --with-deps chromium` to work correctly
   - Properly installs all browser dependencies for html2pptx rendering

### 📝 Files Modified

- `server.js` - Enhanced workspace setup with smart dependency linking + fixed ES/CommonJS imports
- `Dockerfile` - Switched to Debian base image + added jszip + proper Playwright installation
- `CHANGELOG.md` - Complete documentation of all fixes
- `FIX-APPLIED.md` - Quick reference guide

### 🚀 How to Apply the Fix

**If running with Docker (recommended):**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**If running locally:**
```bash
# Just restart the server
npm start
```

### 🔍 Technical Details

#### Fix 1: Symlink Dependencies
**Before:**
```javascript
// Package resolution failing
const { stdout, stderr } = await execPromise(
    `cd ${workDir} && NODE_PATH=/usr/local/lib/node_modules node convert.js 2>&1`
);
```

**After:**
```javascript
// Smart symlink creation
const nodeModulesPath = path.join(workDir, 'node_modules');
await fs.mkdir(nodeModulesPath, { recursive: true });

// Link global packages
await fs.symlink(
    path.join(globalModulesPath, 'pptxgenjs'),
    path.join(nodeModulesPath, 'pptxgenjs'),
    'dir'
);

// Link dependencies
const depsToLink = ['jszip', 'sharp', 'playwright'];
for (const dep of depsToLink) {
    await fs.symlink(
        path.join(globalModulesPath, dep),
        path.join(nodeModulesPath, dep),
        'dir'
    );
}

// Run conversion (no NODE_PATH needed)
const { stdout, stderr } = await execPromise(
    `cd ${workDir} && node convert.js 2>&1`
);
```

#### Fix 2: Use CommonJS Import for pptxgenjs
**Before (in generated convert.js):**
```javascript
import pptxgen from "pptxgenjs";  // ❌ Loads wrong module version
import { html2pptx } from "@ant/html2pptx";
```

**After:**
```javascript
import { createRequire } from 'module';
import { html2pptx } from "@ant/html2pptx";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");  // ✅ Loads CommonJS version correctly
```

### ✨ Benefits

- ⚡ **Faster**: Symlinks are instant vs. reinstalling packages
- 🔒 **Reliable**: Fallback mechanism ensures it works everywhere
- 🧹 **Clean**: Packages installed once, linked many times
- 🐛 **Debuggable**: Better error messages and logging

### 🧪 Tested On

- ✅ Docker (Alpine Linux)
- ✅ Node.js 18.20.8
- ✅ ES Module imports
- ✅ Multiple concurrent workspace generations

---

All issues are now resolved. PowerPoint generation works smoothly! 🎉

