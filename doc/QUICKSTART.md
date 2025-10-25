# 🚀 Quick Start Guide - AI Text2PPT Pro

## What You Got

A professional Node.js application that:
- ✅ Uses Claude AI to intelligently structure content
- ✅ Generates high-quality PowerPoint presentations
- ✅ Follows professional design principles
- ✅ Creates real .pptx files

## Prerequisites

You need:
1. **Node.js** installed ([download here](https://nodejs.org/))
2. **Anthropic API key** ([get one here](https://console.anthropic.com/))

## 3-Step Setup

### Step 1: Extract & Navigate

```bash
# If you downloaded the .tar.gz file:
tar -xzf text2ppt-pro.tar.gz
cd text2ppt-pro

# If you downloaded the folder directly:
cd text2ppt-pro
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs Express and other required packages.

### Step 3: Start the Server

```bash
npm start
```

You should see:
```
🚀 AI Text2PPT Pro Server Running!
📍 Open your browser to: http://localhost:3000
```

## Using the App

1. **Open browser** → Go to `http://localhost:3000`

2. **Add API key**:
   - Get your key from [console.anthropic.com](https://console.anthropic.com/)
   - Paste it in the API Configuration section
   - Click "Save Key" (stored in browser, not on server)

3. **Create presentation**:
   - Paste your text
   - Click "Generate Professional PowerPoint"
   - Download the .pptx file!

## 💡 Try It Out

Click "Load example text" in the app to see how it works!

## 🐛 Troubleshooting

**"Port 3000 already in use"**
- Edit `server.js` line 8: Change `PORT = 3000` to another port like `3001`

**"Cannot find module"**
- Make sure you ran `npm install`

**"API Error"**
- Check your API key is correct
- Verify you have API credits at console.anthropic.com

## 📚 Full Documentation

See `README.md` for complete documentation including:
- How it works
- Technical details
- Content guidelines
- Troubleshooting

## 🎓 Why This Is "Pro"

Unlike the simple browser version:
- ✅ Uses html2pptx workflow (professional rendering)
- ✅ Content-aware color themes
- ✅ Professional typography & spacing
- ✅ Better visual hierarchy
- ✅ Consistent design system

## Questions?

Check the full `README.md` file for more details!

---

**Ready?** Run `npm start` and open `http://localhost:3000` 🎉
