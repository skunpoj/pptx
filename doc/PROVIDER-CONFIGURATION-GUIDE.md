# Provider Configuration Guide

## Overview

You can now configure **separate providers** for different tasks:
1. **Content Generation** - Writing presentation text and structure
2. **Image Generation** - Creating actual images from descriptions

## How It Works

### Step 1: Configure Content Generation Provider

Navigate to **Advanced Configuration → API Keys** and select your provider:

```
📝 Content Generation Provider
┌────────────────────────────────────┐
│ [Anthropic] [OpenAI] [Gemini] [...] │
└────────────────────────────────────┘
```

**Providers:**
- **Anthropic** - Claude (Sonnet 4.5)
- **OpenAI** - GPT-4
- **Gemini** - Google Gemini
- **OpenRouter** - Multiple models

**Enter API Key** for your selected provider below the buttons.

---

### Step 2: Configure Image Generation Provider

Select which AI creates the actual images:

```
🎨 Image Generation Provider  
┌────────────────────────────────────┐
│ [DALL-E 3] [Stability AI] [Gemini]│
└────────────────────────────────────┘
```

**Providers:**
- **DALL-E 3** - OpenAI (uses OpenAI API key)
- **Stability AI** - Stable Diffusion (uses Stability API key)
- **Gemini Imagen** - Google (uses Gemini API key)

---

## API Key Management

### Same Key, Multiple Uses

Some providers can be used for BOTH tasks with the **same API key**:

#### OpenAI Key
```
✅ OpenAI API Key: sk-...

Can be used for:
- Content Generation (GPT-4)
- Image Generation (DALL-E 3)
```

#### Gemini Key
```
✅ Gemini API Key: AIza...

Can be used for:
- Content Generation (Gemini 1.5 Pro)
- Image Generation (Imagen 3)
```

### Separate Keys

You can also mix and match:

```
Content Generation: Anthropic (sk-ant-...)
Image Generation:   OpenAI DALL-E (sk-...)

OR

Content Generation: OpenAI GPT-4 (sk-...)
Image Generation:   Stability AI (sk-...)
```

---

## Configuration Examples

### Example 1: All OpenAI
```
📝 Content: OpenAI (GPT-4)
🎨 Images: DALL-E 3

API Key: sk-... (OpenAI)
```
**Benefit:** Single API key for everything

---

### Example 2: All Gemini
```
📝 Content: Gemini
🎨 Images: Gemini Imagen

API Key: AIza... (Google)
```
**Benefit:** Single API key, Google ecosystem

---

### Example 3: Mixed (Best Quality)
```
📝 Content: Anthropic (Claude)
🎨 Images: DALL-E 3 (OpenAI)

API Keys:
- sk-ant-... (Anthropic)
- sk-... (OpenAI)
```
**Benefit:** Best content + best images

---

### Example 4: Mixed (Most Affordable)
```
📝 Content: Gemini
🎨 Images: Stability AI

API Keys:
- AIza... (Google)
- sk-... (Stability)
```
**Benefit:** Lower costs

---

### Example 5: FREE Content + Paid Images
```
📝 Content: Amazon Bedrock (FREE!)
🎨 Images: DALL-E 3

API Keys:
- None needed (Bedrock)
- sk-... (OpenAI for images)
```
**Benefit:** Free content, only pay for images

---

## Where Keys Are Stored

All API keys are stored in **browser localStorage** with these keys:

```javascript
localStorage.setItem('anthropic_api_key', 'sk-ant-...');
localStorage.setItem('openai_api_key', 'sk-...');
localStorage.setItem('gemini_api_key', 'AIza...');
localStorage.setItem('openrouter_api_key', 'sk-or-...');
localStorage.setItem('stability_api_key', 'sk-...');
```

**Security:** Keys stay in your browser, never sent to our servers.

---

## How Image Generation Uses Keys

When you click "🎨 Generate Images", the system:

1. Checks which **Image Provider** you selected
2. Retrieves the appropriate API key from localStorage
3. Sends image descriptions to that provider's API

### Key Mapping

| Image Provider | API Key Used |
|----------------|--------------|
| DALL-E 3 | `openai_api_key` |
| Stability AI | `stability_api_key` |
| Gemini Imagen | `gemini_api_key` |

---

## Complete Workflow Example

### Scenario: Using Gemini for Everything

**Step 1: Get Gemini API Key**
- Visit: https://makersuite.google.com/app/apikey
- Create key: `AIza...`

**Step 2: Configure in App**
```
Advanced Configuration → API Keys
  
📝 Content Generation Provider:
  Click [Gemini]
  
  Enter key in "Google Gemini API" section:
  AIza...
  
  Click [Save Key]
  
🎨 Image Generation Provider:
  Click [Gemini Imagen]
```

**Step 3: Use**
```
1. Enter idea: "AI in healthcare presentation"
2. ✅ Check "Include AI-generated image suggestions"
3. Click "Expand Idea" → Uses Gemini (content generation)
4. Content appears with [IMAGE: ...] descriptions
5. Click "Generate Preview" → Creates slides
6. Click "Generate Images" → Uses Gemini Imagen (image generation)
7. Download PPTX with real images
```

**Result:** Everything powered by single Gemini API key!

---

## API Costs Reference

### Content Generation (per presentation)

| Provider | Model | Typical Cost |
|----------|-------|--------------|
| Bedrock | Claude 3.5 | $0.00 (FREE) |
| Anthropic | Claude 3.5 | $0.03 |
| OpenAI | GPT-4 | $0.05 |
| Gemini | Gemini 1.5 | $0.02 |

### Image Generation (per image)

| Provider | Cost |
|----------|------|
| DALL-E 3 | $0.04 |
| Stability AI | $0.01 |
| Gemini Imagen | $0.02 |

### Example: 10-slide presentation with 8 images

**Option A: Bedrock + DALL-E**
- Content: $0.00
- Images: $0.32 (8 × $0.04)
- **Total: $0.32**

**Option B: Gemini + Gemini Imagen**
- Content: $0.02
- Images: $0.16 (8 × $0.02)
- **Total: $0.18**

**Option C: Claude + Stability**
- Content: $0.03
- Images: $0.08 (8 × $0.01)
- **Total: $0.11**

---

## Troubleshooting

### Error: "Please enter your OpenAI API key"
**Cause:** Selected DALL-E 3 but no OpenAI key saved
**Fix:** Go to Advanced Configuration → OpenAI section → Enter key

### Error: "Please enter your Google Gemini API key"
**Cause:** Selected Gemini Imagen but no Gemini key saved
**Fix:** Go to Advanced Configuration → Gemini section → Enter key

### Error: "Please enter your Stability AI API key"
**Cause:** Selected Stability AI but no Stability key saved
**Fix:** Go to Advanced Configuration → Stability AI section → Enter key

---

## Settings Storage

Your selections are saved automatically:

```javascript
// Content provider
localStorage.getItem('ai_provider')  // 'anthropic', 'openai', 'gemini', etc.

// Image provider
localStorage.getItem('image_provider')  // 'dalle', 'stability', 'gemini'
```

**Persistence:** Settings remain even after closing browser.

---

## Best Practices

### 1. Start with Free Option
```
Content: Bedrock (FREE)
Images: Skip (use placeholders)
Cost: $0
```

### 2. Add Images Later
```
After testing, add image generation:
Content: Bedrock (FREE)
Images: Stability AI ($0.01/image - cheapest)
```

### 3. Use Same Provider When Possible
```
If you have OpenAI key:
Content: GPT-4
Images: DALL-E 3
(Same key for both!)
```

### 4. Mix for Best Results
```
Best content: Anthropic Claude
Best images: OpenAI DALL-E 3
(Two keys, best quality)
```

---

## Summary

✅ **Separate configuration** for content and images
✅ **Same API key system** as before
✅ **Keys stored in localStorage**
✅ **Can reuse same key** (OpenAI, Gemini)
✅ **Mix and match** providers
✅ **FREE option available** (Bedrock)

---

**Date:** 2025-10-25  
**Version:** 2.0  
**Status:** Production Ready

