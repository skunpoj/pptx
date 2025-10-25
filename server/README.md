# Backend Modules

Organized, reusable backend components for the AI Text2PPT Pro application.

## 📁 Directory Structure

```
server/
├── config/           # Configuration files
│   └── constants.js  # Application constants
├── routes/           # API route handlers
│   └── content.js    # Content generation routes
└── utils/            # Utility functions
    ├── ai.js         # AI provider communication
    ├── helpers.js    # Common helper functions
    ├── workspace.js  # Workspace management
    ├── prompts.js    # AI prompt templates
    ├── slideLayouts.js # HTML slide templates
    └── generators.js # Main generators
```

## 🔧 Modules Overview

### `config/constants.js`
**Purpose:** Centralized configuration  
**Exports:** SERVER_CONFIG, AI_PROVIDERS, PPTX_CONFIG, CHART_TYPES, etc.

### `routes/content.js`
**Purpose:** Content generation endpoints  
**Routes:** POST /api/generate-content

### `utils/ai.js`
**Purpose:** AI API communication  
**Functions:** callAI(provider, apiKey, prompt)

### `utils/helpers.js`
**Purpose:** Common utilities  
**Functions:** generateCSS, escapeHtml, validateSlideData, parseAIResponse, etc.

### `utils/workspace.js`
**Purpose:** Workspace management  
**Functions:** setupWorkspace, setupDependencies, runScript, scheduleCleanup

### `utils/prompts.js`
**Purpose:** AI prompt templates  
**Functions:** getPreviewPrompt, getContentGenerationPrompt, etc.

### `utils/slideLayouts.js`
**Purpose:** HTML slide generation  
**Functions:** generateTitleSlide, generateBulletSlide, generateChartSlide

### `utils/generators.js`
**Purpose:** Main generators (orchestrator)  
**Functions:** generateSlideHTML, generateConversionScript

## 💡 Usage Examples

### Using AI Module
```javascript
const { callAI } = require('./utils/ai');

const response = await callAI('anthropic', apiKey, 'Generate content...');
```

### Using Workspace Module
```javascript
const { setupWorkspace, setupDependencies } = require('./utils/workspace');

await setupWorkspace(workDir);
await setupDependencies(workDir);
```

### Using Prompts Module
```javascript
const { getPreviewPrompt } = require('./utils/prompts');

const prompt = getPreviewPrompt(userText);
const slideData = await callAI(provider, apiKey, prompt);
```

## 🎯 Design Principles

1. **Single Responsibility** - Each module has one clear purpose
2. **DRY** - No code duplication
3. **Reusability** - Functions used across multiple routes
4. **Testability** - Pure functions, easy to test
5. **Documentation** - JSDoc comments on all exports

## 📖 Further Reading

- [MODULAR-STRUCTURE.md](../MODULAR-STRUCTURE.md) - Complete architecture
- [DEVELOPER-GUIDE.md](../DEVELOPER-GUIDE.md) - Developer reference
- [CODE-CLEANUP-SUMMARY.md](../CODE-CLEANUP-SUMMARY.md) - Cleanup details

