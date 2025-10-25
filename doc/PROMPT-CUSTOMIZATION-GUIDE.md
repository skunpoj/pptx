# 📝 AI Prompt Customization Feature

## Complete Guide to Customizable AI Prompts

---

## 🎯 Overview

All AI prompts are now centralized in a **single editable JSON file** (`config/prompts.json`) and can be customized through the frontend UI in the **Advanced Settings** tab.

---

## 📁 Architecture

### Centralized Prompt Storage

```
config/
└── prompts.json          ✨ Single source of truth
    ├─ Content Generation
    ├─ Slide Design
    ├─ File Processing
    ├─ JSON Schema
    └─ Image Instructions
```

### Backend Management

```
server/
├── utils/
│   └── promptManager.js  ✨ Prompt loader & manager
└── routes/
    └── prompts.js        ✨ API endpoints
```

### Frontend Editor

```
public/js/
└── promptEditor.js       ✨ UI for editing prompts
```

---

## 🔧 Features

### 1. **Centralized Configuration** ✅

All AI prompts in one place:
- `config/prompts.json` - Single source of truth
- Easy to find and edit
- Version controlled
- Automatic backups

### 2. **Frontend Editor** ✅

Beautiful UI for editing prompts:
- **Advanced Settings Tab** in UI
- **Syntax highlighting** (monospace font)
- **Character counter** for each prompt
- **Format button** to clean up text
- **View/Hide toggle** for each prompt

### 3. **Safety Features** ✅

- **Automatic Backup** before saving
- **Restore from Backup** option
- **Reset to Defaults** option
- **Confirmation dialogs** for destructive actions
- **Error handling** for invalid JSON

### 4. **Variable System** ✅

Dynamic variables in prompts:
- `{{userPrompt}}` - User's input
- `{{numSlides}}` - Number of slides
- `{{userContent}}` - Content to convert
- `{{fileCount}}` - Number of files
- `{{filesContent}}` - Combined file content

---

## 📝 Prompts Available for Customization

### 1. Content Generation Prompt

**Purpose:** Expands user ideas into full presentation content

**Variables:**
- `{{numSlides}}` - Total slides to generate
- `{{numContentSlides}}` - Content slides (numSlides - 1)
- `{{userPrompt}}` - User's idea/topic
- `{{imageInstructions}}` - Image generation instructions (optional)

**Default Behavior:**
- Generates N well-structured paragraphs
- Each paragraph becomes a slide
- Professional consultant style
- Includes data points and insights

### 2. Slide Design Prompt

**Purpose:** Converts content into structured slides with layouts

**Variables:**
- `{{userContent}}` - Text content to convert
- `{{jsonSchema}}` - Expected JSON output format

**Default Behavior:**
- Creates 4-12 slides
- Suggests appropriate layouts
- Recommends color theme
- Generates charts for data
- Adds visual elements

### 3. File Processing Prompt

**Purpose:** Synthesizes multiple uploaded files into presentation content

**Variables:**
- `{{fileCount}}` - Number of files uploaded
- `{{filesContent}}` - All file contents combined

**Default Behavior:**
- Analyzes all files
- Extracts key information
- Creates coherent narrative
- Structures into 5-8 sections

### 4. JSON Schema

**Purpose:** Defines expected output format for slide structure

**No Variables** - Pure JSON template

**Includes:**
- Theme configuration
- Slide types
- Layout options
- Chart examples
- Graphics options

### 5. Image Generation Instructions

**Purpose:** Additional instructions when user enables images

**No Variables** - Appended to content generation

---

## 🖥️ Frontend UI

### Accessing the Editor

1. **Open application** in browser
2. **Scroll to bottom** → Settings section
3. **Click "📝 AI Prompts" tab**
4. **Click "📝 Open Prompt Editor" button**

### Editor Interface

```
┌──────────────────────────────────────────────┐
│ 📝 AI Prompt Customization                   │
│                                               │
│ [🔄 Reset] [⏮️ Restore] [💾 Save Changes]   │
│                                               │
│ ⚠️ Advanced Feature: Edit these prompts...  │
│ ✏️ Customized: Last modified...              │
├──────────────────────────────────────────────┤
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ Content Generation Prompt          [View]│ │
│ │ Used when expanding user ideas...        │ │
│ │ Variables: {{userPrompt}} {{numSlides}}  │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ Slide Design & Structure Prompt    [View]│ │
│ │ Used when creating slide structure...    │ │
│ │ Variables: {{userContent}} {{jsonSchema}}│ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ File Processing Prompt             [View]│ │
│ │ Used when synthesizing files...          │ │
│ │ Variables: {{fileCount}} {{filesContent}}│ │
│ └──────────────────────────────────────────┘ │
│                                               │
└──────────────────────────────────────────────┘
```

### Editing a Prompt

1. **Click "📖 View"** button on any prompt
2. **Edit** the text in the textarea
3. **Click "✨ Format"** to clean up formatting
4. **Click "💾 Save Changes"** to save all prompts

---

## 🔌 Backend API

### Endpoints

#### GET /api/prompts
Returns all prompts configuration

**Response:**
```json
{
  "version": "1.0.0",
  "prompts": { ... },
  "metadata": {
    "lastModified": "2025-10-25T...",
    "customized": true
  }
}
```

#### POST /api/prompts
Updates prompts configuration

**Request:**
```json
{
  "prompts": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Prompts updated successfully",
  "backup": true
}
```

#### POST /api/prompts/reset
Resets all prompts to defaults

**Response:**
```json
{
  "success": true,
  "message": "Prompts reset to defaults",
  "prompts": { ... }
}
```

#### POST /api/prompts/restore
Restores prompts from last backup

**Response:**
```json
{
  "success": true,
  "message": "Prompts restored from backup",
  "prompts": { ... }
}
```

#### GET /api/prompts/:key
Gets a specific prompt by key

**Example:** `GET /api/prompts/contentGeneration`

---

## 💻 Usage Examples

### Backend - Using Prompts

```javascript
const {
    getContentGenerationPrompt,
    getSlideDesignPrompt,
    getFileProcessingPrompt
} = require('./server/utils/promptManager');

// Generate content prompt
const prompt = await getContentGenerationPrompt(userIdea, 6, true);
const response = await callAI('anthropic', apiKey, prompt);

// Generate slide design prompt
const prompt2 = await getSlideDesignPrompt(content);
const slideData = await callAI('anthropic', apiKey, prompt2);

// Generate file processing prompt
const prompt3 = await getFileProcessingPrompt(filesArray);
const synthesized = await callAI('anthropic', apiKey, prompt3);
```

### Frontend - Loading Prompts

```javascript
// Load all prompts
const prompts = await loadAllPrompts();

// Show editor
window.showPromptEditor();

// Save changes
await saveCustomPrompts();

// Reset to defaults
await resetPromptsToDefaults();
```

---

## 🎨 Customization Examples

### Example 1: Change Tone

**Default:**
```
"Write in a clear, professional, consultant-style..."
```

**Customized:**
```
"Write in a friendly, conversational, engaging style..."
```

### Example 2: Modify Slide Count

**Default:**
```
"Create 4-12 slides total (including title slide)"
```

**Customized:**
```
"Create 6-15 slides total (including title slide)"
```

### Example 3: Add New Instructions

**Default:**
```
"Include comparative analysis, pros/cons..."
```

**Customized:**
```
"Include comparative analysis, pros/cons, case studies, and real-world examples from Fortune 500 companies..."
```

### Example 4: Change Output Format

**Default:**
```
"Do NOT include any JSON, markdown formatting..."
```

**Customized:**
```
"Format as XML with <slide> tags for each section..."
```

---

## 🔒 Safety & Backup System

### Automatic Backups

Every save creates a backup:
```
config/
├── prompts.json         ← Current (editable)
└── prompts.backup.json  ← Last backup (auto)
```

### Restore Options

1. **Restore from Backup** - Reverts to last saved version
2. **Reset to Defaults** - Returns to original prompts
3. **Manual Restore** - Copy backup file manually

### Safety Checks

```javascript
// Confirmation before reset
if (!confirm('Reset all prompts to defaults?')) return;

// Automatic backup before save
await backupPrompts();

// Error handling for corrupted files
try {
    JSON.parse(promptData);
} catch (error) {
    showStatus('Invalid JSON format', 'error');
}
```

---

## 🎯 Use Cases

### Use Case 1: Industry-Specific Language

**Scenario:** Creating presentations for healthcare industry

**Customization:**
```
Change: "business-focused" 
To: "healthcare-focused with clinical terminology"

Change: "consultant-style"
To: "medical professional style with evidence-based language"
```

### Use Case 2: Different Languages

**Scenario:** Generate presentations in Spanish

**Customization:**
```
Add to instructions:
"Generate ALL content in Spanish language. Use professional business Spanish terminology."
```

### Use Case 3: Brand Voice

**Scenario:** Match company's brand voice

**Customization:**
```
Add to instructions:
"Use our brand voice: innovative, customer-centric, and data-driven. Avoid jargon. Use active voice."
```

### Use Case 4: More Technical Content

**Scenario:** Technical architecture presentations

**Customization:**
```
Add to instructions:
"Include technical diagrams, system architectures, code examples where appropriate. Use precise technical terminology."
```

---

## 📊 Prompt Variables System

### How Variables Work

1. **Define in JSON:**
```json
{
  "template": "Hello {{name}}, you have {{count}} messages",
  "variables": ["name", "count"]
}
```

2. **Backend applies values:**
```javascript
const prompt = applyVariables(template, {
    name: "John",
    count: 5
});
// Result: "Hello John, you have 5 messages"
```

### Available Variables

| Variable | Used In | Description |
|----------|---------|-------------|
| `{{userPrompt}}` | Content Gen | User's idea/topic |
| `{{numSlides}}` | Content Gen | Total slides |
| `{{numContentSlides}}` | Content Gen | Non-title slides |
| `{{imageInstructions}}` | Content Gen | Image gen text |
| `{{userContent}}` | Slide Design | Content to structure |
| `{{jsonSchema}}` | Slide Design | Expected JSON format |
| `{{fileCount}}` | File Processing | Number of files |
| `{{filesContent}}` | File Processing | All file content |

---

## ⚙️ Configuration

### prompts.json Structure

```json
{
  "version": "1.0.0",
  "description": "...",
  "prompts": {
    "promptKey": {
      "name": "Display Name",
      "description": "What this prompt does",
      "template": "The actual prompt with {{variables}}",
      "variables": ["list", "of", "variables"]
    }
  },
  "metadata": {
    "lastModified": "ISO date",
    "customized": true/false,
    "backupAvailable": true/false
  }
}
```

### Adding New Prompts

1. **Edit `config/prompts.json`:**
```json
"newPromptKey": {
  "name": "My New Prompt",
  "description": "What it does",
  "template": "Your prompt with {{variable}}",
  "variables": ["variable"]
}
```

2. **Add backend function in `promptManager.js`:**
```javascript
async function getMyNewPrompt(variable) {
    const prompt = await getPrompt('newPromptKey');
    return applyVariables(prompt.template, { variable });
}
```

3. **Use in routes:**
```javascript
const prompt = await getMyNewPrompt(value);
const response = await callAI(provider, apiKey, prompt);
```

---

## 🛠️ Technical Details

### Prompt Manager (`server/utils/promptManager.js`)

**Functions:**
- `loadPrompts()` - Loads from JSON file
- `savePrompts(prompts)` - Saves to JSON file
- `backupPrompts()` - Creates backup
- `restoreFromBackup()` - Restores from backup
- `resetToDefaults()` - Resets to original
- `getPrompt(key)` - Gets specific prompt
- `applyVariables(template, vars)` - Replaces {{variables}}
- `getContentGenerationPrompt(...)` - Pre-built getter
- `getSlideDesignPrompt(...)` - Pre-built getter
- `getFileProcessingPrompt(...)` - Pre-built getter

### Prompt Routes (`server/routes/prompts.js`)

**Endpoints:**
- `GET /api/prompts` - Get all prompts
- `POST /api/prompts` - Update prompts
- `POST /api/prompts/reset` - Reset to defaults
- `POST /api/prompts/restore` - Restore backup
- `GET /api/prompts/:key` - Get specific prompt

### Frontend Editor (`public/js/promptEditor.js`)

**Functions:**
- `showPromptEditor()` - Displays editor UI
- `togglePromptView(key)` - Show/hide specific prompt
- `formatPrompt(key)` - Format prompt text
- `saveCustomPrompts()` - Save all changes
- `resetPromptsToDefaults()` - Reset all
- `restorePromptsFromBackup()` - Restore backup

---

## 🎨 UI Screenshots

### Settings Tabs

```
┌────────────────────────────────────┐
│ [🔑 API Keys] [📝 AI Prompts]     │ ← Tabs
└────────────────────────────────────┘
```

### Prompt Editor

```
┌──────────────────────────────────────────────┐
│ 📝 AI Prompt Customization                   │
│                                               │
│ [🔄 Reset] [⏮️ Restore] [💾 Save]           │
│                                               │
│ ⚠️ Advanced Feature: Edit these prompts...  │
│ ✏️ Customized: Last modified Oct 25, 2025   │
├──────────────────────────────────────────────┤
│ Content Generation Prompt           [📖 View]│
│ Used when expanding user ideas...            │
│ Variables: {{userPrompt}} {{numSlides}}      │
│ ┌──────────────────────────────────────────┐ │
│ │ You are a professional content writer... │ │
│ │ ...                                      │ │
│ │                                          │ │
│ │ [Edit prompt here]                       │ │
│ │                                          │ │
│ └──────────────────────────────────────────┘ │
│ Characters: 2,450                    [✨ Format]│
├──────────────────────────────────────────────┤
│ Slide Design & Structure Prompt     [📖 View]│
│ ... (similarly for each prompt)              │
└──────────────────────────────────────────────┘
```

---

## 📖 Workflow

### Viewing Prompts

1. Navigate to **Settings section** at bottom
2. Click **📝 AI Prompts** tab
3. Click **📝 Open Prompt Editor**
4. Click **📖 View** on any prompt to expand

### Editing Prompts

1. **View** the prompt you want to edit
2. **Modify** the text in the textarea
3. **Format** (optional) to clean up
4. **Save Changes** to apply

**Note:** Changes take effect immediately for new generations

### Resetting Prompts

**Reset to Defaults:**
1. Click **🔄 Reset to Defaults**
2. Confirm the action
3. All prompts restored to original

**Restore from Backup:**
1. Click **⏮️ Restore Backup**
2. Confirm the action
3. Prompts restored to last save

---

## 🔍 How It Works

### Loading Sequence

```
1. App starts
2. Backend reads config/prompts.json
3. Prompts cached in memory
4. When AI call needed:
   ├─ Load prompt from cache
   ├─ Apply variables
   └─ Send to AI
```

### Saving Sequence

```
1. User edits prompts in UI
2. Clicks "Save Changes"
3. Frontend sends POST /api/prompts
4. Backend:
   ├─ Creates backup
   ├─ Validates JSON
   ├─ Saves to file
   ├─ Clears cache
   └─ Returns success
5. UI shows confirmation
```

### Backup Sequence

```
Before each save:
1. Read current prompts.json
2. Write to prompts.backup.json
3. Save new prompts.json
4. Metadata updated

Result: Always have last working version
```

---

## 💡 Advanced Customization

### Adding Custom Instructions

```json
{
  "template": "...existing instructions...\n\n9. CUSTOM: Always include a summary slide at the end\n10. CUSTOM: Use bullet points starting with action verbs..."
}
```

### Changing AI Personality

```json
{
  "template": "You are a [ROLE] specializing in [SPECIALTY]..."
}

Examples:
- "You are a creative storyteller..."
- "You are a data analyst..."
- "You are a marketing strategist..."
```

### Modifying Output Format

```json
{
  "template": "...OUTPUT FORMAT:\n[Your custom format instructions]..."
}
```

### Adding Domain Knowledge

```json
{
  "template": "...Consider these industry best practices:\n- Practice 1\n- Practice 2\n..."
}
```

---

## ⚠️ Important Notes

### What to Avoid

❌ **Don't remove variables** - Backend expects them
❌ **Don't break JSON schema** - Parsing will fail
❌ **Don't remove critical instructions** - AI may not behave correctly
❌ **Don't make prompts too short** - Results may be generic

### Best Practices

✅ **Test changes** - Generate a preview after editing
✅ **Keep backups** - Don't disable automatic backups
✅ **Document changes** - Add comments about modifications
✅ **Iterate gradually** - Make small changes and test

---

## 🐛 Troubleshooting

### Issue: Changes not applying

**Solution:**
- Ensure you clicked "Save Changes"
- Refresh the page
- Check browser console for errors

### Issue: AI behavior unexpected

**Solution:**
- Review your custom prompts
- Check variable replacements
- Try "Reset to Defaults"
- Restore from backup

### Issue: Can't save prompts

**Solution:**
- Check server logs for errors
- Verify file permissions on config/
- Ensure valid JSON format
- Try restoring from backup

### Issue: Lost customizations

**Solution:**
- Use "Restore from Backup"
- Check config/prompts.backup.json manually
- Contact support if backup missing

---

## 📚 Files Created

### Backend
1. ✅ `config/prompts.json` - Main prompts file
2. ✅ `config/prompts.backup.json` - Auto-created on first save
3. ✅ `server/utils/promptManager.js` - Prompt loader
4. ✅ `server/routes/prompts.js` - API endpoints

### Frontend
5. ✅ `public/js/promptEditor.js` - UI for editing

### Documentation
6. ✅ `PROMPT-CUSTOMIZATION-GUIDE.md` - This guide

---

## 🎯 Benefits

### For Users
- ✅ **Customize AI behavior** without code changes
- ✅ **Match brand voice** and industry language
- ✅ **Fine-tune output** quality
- ✅ **Quick iterations** - no deployments needed

### For Developers
- ✅ **Single source of truth** for all prompts
- ✅ **Easy to modify** - just edit JSON
- ✅ **Version controlled** - track changes in git
- ✅ **No code deployment** for prompt updates

### For Business
- ✅ **A/B testing** different prompts
- ✅ **Rapid iterations** without dev time
- ✅ **Custom workflows** per client
- ✅ **Competitive advantage** through optimization

---

## 🔐 Security

### File Permissions

Ensure proper permissions on config directory:
```bash
chmod 644 config/prompts.json
chmod 644 config/prompts.backup.json
```

### Validation

- JSON structure validated before save
- Variables checked for existence
- Metadata preserved

### Backup Policy

- Automatic backup before each save
- Manual restore available
- Default reset available
- Backup retained until overwritten

---

## 📈 Impact

### Before This Feature

❌ Prompts scattered across code  
❌ 3 locations with duplicate prompts  
❌ Hard to modify (requires code changes)  
❌ Need redeploy for each tweak  
❌ No easy A/B testing  

### After This Feature

✅ All prompts in one JSON file  
✅ Zero duplication  
✅ Edit from UI (no code changes)  
✅ Live updates (no redeploy)  
✅ Easy A/B testing  

---

## ✨ Summary

### What You Can Now Do

1. **View all AI prompts** in one place
2. **Edit prompts** from the UI
3. **Test changes** immediately
4. **Reset anytime** to defaults
5. **Restore backups** if needed
6. **Customize behavior** without code

### Key Features

- 📝 **Centralized** - One file for all prompts
- 🎨 **Customizable** - Edit from frontend
- 💾 **Safe** - Automatic backups
- 🔄 **Reversible** - Reset/restore options
- 🚀 **Live** - No deployment needed
- 📊 **Trackable** - Version control ready

---

**You now have complete control over AI behavior through a simple, safe, and powerful prompt customization system!** 🎉

**Location:** Settings → 📝 AI Prompts Tab

