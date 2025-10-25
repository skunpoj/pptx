# Install Node.js on Windows - Quick Guide

## Your Situation

You're seeing this error because you're trying to use an **external hosted service** (`https://pptx.coder.garden`) which is **blocked by your organization's Zscaler firewall**.

**This is NOT a code bug.** Your network security is preventing you from downloading files from external services.

## The Solution

You need to **run the application locally** on your computer. To do this, you need Node.js installed first.

## Step 1: Download Node.js

1. Open your web browser
2. Go to: **https://nodejs.org**
3. Click the **LTS** button (Long Term Support) - currently v20.x or v18.x
4. Download the Windows Installer (.msi file)

## Step 2: Install Node.js

1. Run the downloaded `.msi` file
2. Click "Next" through the installer
3. **Accept the license agreement**
4. **Leave all default settings** (install location, components, etc.)
5. ✅ **IMPORTANT**: Make sure "Add to PATH" is checked (it should be by default)
6. Click "Install"
7. Wait for installation to complete
8. Click "Finish"

## Step 3: Verify Installation

1. **Close PowerShell** (if you have it open)
2. **Open a NEW PowerShell window**
3. Run these commands:

```powershell
node --version
```
Should show: `v20.x.x` or `v18.x.x`

```powershell
npm --version
```
Should show: `10.x.x` or similar

## Step 4: Install Project Dependencies

In your project folder (`C:\Users\skunpojt\Desktop\pptx-1`):

```powershell
npm install
```

This will download all required packages (may take 2-5 minutes).

## Step 5: Start the Local Server

```powershell
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
```

## Step 6: Use the Application

1. Open your browser
2. Go to: **http://localhost:3000**
3. Enter your API key (Anthropic, OpenAI, or Gemini)
4. Generate presentations!

## Why This Works

| External Service (Blocked) | Local Server (Works) |
|---------------------------|---------------------|
| ❌ `https://pptx.coder.garden` | ✅ `http://localhost:3000` |
| ❌ Goes through Zscaler | ✅ Stays on your PC |
| ❌ Files blocked by firewall | ✅ Files saved locally |
| ❌ Network security issue | ✅ No network blocking |

## Common Issues

### "I can't download Node.js - it's blocked!"

If `nodejs.org` is blocked, try:
1. Ask IT department to download it for you
2. Use organization's software center/portal
3. Download from a USB drive from home

### "npm install" fails with proxy error

Your organization may use a proxy. Try:
```powershell
npm config set strict-ssl false
npm config set registry http://registry.npmjs.org/
npm install
```

### "Port 3000 is already in use"

Another app is using port 3000. Options:
1. Find and stop that app
2. Use a different port:
   - Edit `package.json`
   - Change `3000` to `3001`
   - Start server again

## Important Notes

- ⚠️ **You MUST install Node.js first** - nothing will work without it
- ⚠️ **Close and reopen PowerShell** after installing Node.js
- ⚠️ **Run in NEW PowerShell** - old sessions won't have Node.js in PATH
- ✅ Once running locally, Zscaler cannot block it
- ✅ All files are generated on YOUR computer
- ✅ Only AI API calls go to the internet (which should work)

## After Installation

You'll run the server locally every time you want to use it:

```powershell
# Navigate to project folder
cd C:\Users\skunpojt\Desktop\pptx-1

# Start server
npm start

# Leave this PowerShell window open
# Open browser to http://localhost:3000
```

When done, press `Ctrl+C` in PowerShell to stop the server.

---

**Bottom line**: The "parsing error" you see is actually Zscaler's HTML blocking page. Installing Node.js and running locally is the **only way** to make this work in your environment.

