# 🎯 Getting Started - AI Text2PPT Pro

Choose the best way to run the app based on what you have installed:

## 🐳 Option 1: Docker (EASIEST - Recommended!)

**Best if you have Docker installed**

✅ No Node.js required
✅ Everything pre-configured
✅ One command to run

```bash
cd text2ppt-pro
docker-compose up --build
```

Open: **http://localhost:3000**

📖 See [DOCKER.md](DOCKER.md) for full Docker guide

---

## 📦 Option 2: Local Node.js

**Best if you have Node.js installed or prefer local setup**

✅ Direct installation
✅ Fast performance
✅ Easy debugging

```bash
cd text2ppt-pro
npm install
npm start
```

Open: **http://localhost:3000**

📖 See [README.md](README.md) for full setup guide

---

## 🤔 Which Should I Choose?

### Choose Docker if:
- ✅ You have Docker installed
- ✅ You want the easiest setup
- ✅ You don't want to install Node.js
- ✅ You want isolated environment

### Choose Local Node.js if:
- ✅ You already have Node.js
- ✅ You want faster startup
- ✅ You're familiar with npm
- ✅ You want to modify the code

---

## 🚀 Quick Comparison

| Feature | Docker | Local Node.js |
|---------|--------|---------------|
| Setup Time | 2 minutes | 2 minutes |
| Prerequisites | Docker | Node.js + npm |
| Commands | `docker-compose up` | `npm install && npm start` |
| Isolation | Full | None |
| Performance | Good | Excellent |
| Updates | Rebuild image | `npm install` |

---

## 📝 After Starting

Regardless of which method you choose:

1. **Get API Key**
   - Visit [console.anthropic.com](https://console.anthropic.com/)
   - Create an API key
   - Copy it

2. **Configure in UI**
   - Open http://localhost:3000
   - Paste your API key
   - Click "Save Key"

3. **Create Presentations**
   - Paste your text
   - Click "Generate Professional PowerPoint"
   - Download your .pptx file!

---

## 🆘 Need Help?

- **Docker issues**: See [DOCKER.md](DOCKER.md)
- **Local setup issues**: See [README.md](README.md)
- **Quick start**: See [QUICKSTART.md](QUICKSTART.md)

---

## 🎉 What's Next?

Once you're up and running:
- Try the example text (click "Load example text" button)
- Experiment with different content types
- See how AI structures your content
- Download professional presentations!

---

**Let's get started!** Pick your option above 👆
