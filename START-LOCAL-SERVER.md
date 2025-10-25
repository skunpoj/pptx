# Quick Start: Run Local Server

## The Problem
Zscaler (Bank of Thailand's security software) is blocking `pptx.coder.garden`. You need to run the application **locally on your computer** instead.

## Solution: 3 Simple Steps

### Step 1: Check Node.js
Open PowerShell and run:
```powershell
node --version
```

**If you see a version number (like v18.x.x or v20.x.x):**
✅ You're ready! Go to Step 2.

**If you see an error:**
❌ Install Node.js from: https://nodejs.org (download LTS version)

### Step 2: Install Dependencies
In your project folder (`C:\Users\skunpojt\Desktop\pptx-1`), run:
```powershell
npm install
```

This will download all required packages (only needed once).

### Step 3: Start the Server
```powershell
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000
```

### Step 4: Open in Browser
Open your browser and go to:
```
http://localhost:3000
```

## Why This Works

| External Service | Local Server |
|-----------------|--------------|
| ❌ Blocked by Zscaler | ✅ Runs on your PC |
| ❌ Needs network access | ✅ No network blocking |
| ❌ Files go through firewall | ✅ Files stay on your PC |
| ❌ Slow (network latency) | ✅ Fast (no network) |

## What You Can Do Locally

Everything works exactly the same:
- ✅ Generate slide previews
- ✅ Create PowerPoint presentations
- ✅ Use charts and graphics
- ✅ Customize themes
- ✅ Edit slides with AI

The only external calls are to AI APIs (Anthropic, OpenAI, etc.) which are likely already whitelisted.

## Troubleshooting

### "node: command not found"
**Solution:** Node.js is not installed or not in PATH
1. Download from https://nodejs.org
2. Install (use default settings)
3. Close and reopen PowerShell
4. Try again

### "npm install" fails
**Solution:** May need to configure npm proxy
```powershell
npm config set strict-ssl false
npm install
```

### Port 3000 already in use
**Solution:** Use a different port
```powershell
# Edit package.json, change port 3000 to 3001
# Or stop other applications using port 3000
```

### Server starts but browser shows error
**Solution:** Check your API key is entered correctly
- The application needs your Anthropic/OpenAI/Gemini API key
- Enter it in the Settings section

## Next Steps

Once the server is running locally:
1. Enter your AI API key (Anthropic, OpenAI, or Gemini)
2. Select a theme
3. Enter your text/topic
4. Click "Generate Preview"
5. Review slides
6. Click "Generate PowerPoint"
7. File downloads directly to your computer!

## Need Help?

If you encounter any errors while starting the local server, share:
1. The exact error message
2. Your Node.js version (`node --version`)
3. Your npm version (`npm --version`)

I'll help you troubleshoot!

