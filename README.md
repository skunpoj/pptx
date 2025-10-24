# 🎨 AI Text2PPT Pro

Professional AI-powered text-to-PowerPoint converter using **Claude AI** for content structuring and **html2pptx** for high-quality presentation rendering.

## ✨ Features

### Core Features
- 🤖 **AI-Powered**: Claude analyzes your content and creates intelligent slide structure
- 👁️ **Live Preview**: See your slides before generating - preview structure, theme, and colors
- 🎨 **Professional Design**: Uses html2pptx workflow for high-quality layouts
- 🌈 **Smart Theming**: AI chooses color palettes that match your content
- 📊 **Clean Layouts**: Professional typography, spacing, and visual hierarchy
- 💾 **Real PowerPoint**: Downloads actual .pptx files compatible with PowerPoint/Google Slides

### 🆕 New Features (October 2024)
- ✨ **AI Prompt Generator**: Describe your presentation idea, AI creates the content
- 📚 **Example Templates**: 6 professional categories (Tech, Business, Education, Healthcare, Marketing, Environment)
- 🔧 **Enhanced Error Handling**: Better validation and user-friendly error messages
- 🎯 **Improved Workflow**: Multiple pathways to create presentations

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd text2ppt-pro
   ```

2. **Dependencies are already installed!** (If not, run: `npm install`)

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Go to: `http://localhost:3000`

### Usage

1. **Enter your API key** (one-time setup)
   - Get it from [console.anthropic.com](https://console.anthropic.com/)
   - Paste it in the API Configuration section
   - Click "Save Key"

2. **Create your content** (3 ways)
   
   **Option A: AI Prompt Generator** 🆕
   - Describe what presentation you want
   - Click "✨ Generate Content from Idea"
   - Example: "Create a presentation about cybersecurity for small businesses"
   
   **Option B: Example Templates** 🆕
   - Click any category (💻 Tech, 💼 Business, 📚 Education, 🏥 Healthcare, 📈 Marketing, 🌍 Environment)
   - Professional content loads instantly
   
   **Option C: Manual Input**
   - Paste any text (article, notes, report, etc.)
   - Write your own content

3. **Preview your slides** (recommended)
   - Click "👁️ Preview Slides"
   - See the AI-designed structure, theme, and colors
   - Review slide titles and content

4. **Generate presentation**
   - Click "✨ Generate Professional PowerPoint"
   - Downloads a professional .pptx file
   - Preview data is reused for faster generation

## 🎯 How It Works

### The Professional Workflow

This app follows the **html2pptx best practices** from the Claude PPTX skill:

1. **AI Analysis**: Claude examines your content and creates a structured outline
2. **Live Preview**: See the slide structure, theme, and colors before generating
3. **Design Selection**: AI chooses colors and layouts that match your topic
4. **HTML Generation**: Creates professional HTML slides with proper typography
5. **PowerPoint Conversion**: html2pptx converts HTML to high-quality .pptx

### Why This Is Better

**Basic approach** (browser-only):
- Simple layouts
- Limited styling
- Generic appearance

**Professional approach** (this app):
- ✅ Content-aware design
- ✅ Professional typography
- ✅ Consistent spacing
- ✅ Theme-appropriate colors
- ✅ Better visual hierarchy

## 📁 Project Structure

```
text2ppt-pro/
├── server.js           # Express backend
├── public/
│   └── index.html      # Frontend interface
├── workspace/          # Temporary files (auto-created)
├── package.json
└── README.md
```

## 🛠️ Technical Details

### Technologies Used

- **Backend**: Node.js + Express
- **AI**: Claude Sonnet 4 via Anthropic API
- **PPT Generation**: html2pptx + PptxGenJS
- **Frontend**: Vanilla HTML/CSS/JavaScript

### Flow

```
User Text → Claude API (structure) → Live Preview → HTML Slides → html2pptx → PowerPoint File
                                           ↓
                                    Review & Approve
```

**Preview Mode**: 
- `/api/preview` - Returns slide structure as JSON (~3-5 seconds)
- Frontend renders visual preview of slides

**Generate Mode**:
- `/api/generate` - Uses cached preview data if available
- Creates HTML slides and converts to PPTX (~10-15 seconds)

## 💡 Tips for Best Results

### Content Guidelines

- **Be concise**: Presentations work best with brief content
- **Clear structure**: Organize your thoughts before pasting
- **Key points**: Focus on main ideas rather than details

### What Works Well

✅ Meeting notes
✅ Blog posts
✅ Research summaries
✅ Product descriptions
✅ Business proposals
✅ Training materials

## 🔧 Troubleshooting

### "API Error" or "Failed to fetch"

- Check your API key is correct
- Verify you have API credits
- Check internet connection

### "Cannot find module"

```bash
npm install
```

### Port 3000 already in use

Edit `server.js` and change:
```javascript
const PORT = 3000;  // Change to 3001, 8080, etc.
```

## 🎓 Learning Resources

Want to understand the professional approach?

- Read `/mnt/skills/public/pptx/SKILL.md` - Complete PPTX workflow guide
- Read `/mnt/skills/public/pptx/html2pptx.md` - HTML slide creation guide
- Read `/mnt/skills/public/pptx/css.md` - CSS framework reference

## 📝 Example Content

Try pasting this:

```
The Future of Remote Work

Remote work has transformed from a necessity to a preferred work model. 
Companies are adopting hybrid approaches, balancing flexibility with collaboration.

Benefits include improved work-life balance, access to global talent, 
reduced office costs, and increased productivity for many roles.

Challenges remain around communication, team culture, and ensuring 
work-life boundaries. Companies need clear policies and the right tools.

Success factors: Strong communication tools, defined expectations, 
regular check-ins, and deliberate culture building.
```

## 🌟 What Makes This "Pro"?

| Feature | Basic Version | Pro Version (This App) |
|---------|--------------|------------------------|
| AI Structuring | ✅ | ✅ |
| Live Preview | ❌ | ✅ Full slide preview |
| Color Themes | ❌ | ✅ Content-aware |
| Typography | Basic | Professional |
| Layout Quality | Simple | html2pptx powered |
| Consistency | Variable | Design system |
| User Control | Direct generate | Preview → Review → Generate |
| Setup | None | Node.js required |

## 📖 Documentation

### Getting Started
- **[QUICK-REFERENCE.md](QUICK-REFERENCE.md)** - ⭐ Quick reference card (START HERE)
- **[USER-GUIDE.md](USER-GUIDE.md)** - Comprehensive user guide with examples
- **[QUICKSTART-PREVIEW.md](QUICKSTART-PREVIEW.md)** - Quick guide to using the preview feature

### For Users
- **[PREVIEW-GUIDE.md](PREVIEW-GUIDE.md)** - Visual guide showing what to expect
- **[PREVIEW-DEMO.md](PREVIEW-DEMO.md)** - Step-by-step visual walkthrough

### For Developers
- **[IMPROVEMENTS-APPLIED.md](IMPROVEMENTS-APPLIED.md)** - 🆕 Latest improvements (Oct 2024)
- **[TESTING-CHECKLIST.md](TESTING-CHECKLIST.md)** - 🆕 Complete testing suite
- **[COMPLETION-SUMMARY.md](COMPLETION-SUMMARY.md)** - 🆕 Project completion status
- **[SLIDE-PREVIEW-FEATURE.md](SLIDE-PREVIEW-FEATURE.md)** - Technical documentation
- **[IMPLEMENTATION-SUMMARY.md](IMPLEMENTATION-SUMMARY.md)** - Complete implementation details

## 🤝 Credits

Built using:
- [Anthropic Claude API](https://www.anthropic.com/)
- [html2pptx](https://github.com/your-repo/html2pptx) workflow
- [PptxGenJS](https://gitbrent.github.io/PptxGenJS/)

## 📄 License

MIT License - Feel free to use and modify!

---

**Ready to create professional presentations?** 🎉

Run `npm start` and open `http://localhost:3000`
