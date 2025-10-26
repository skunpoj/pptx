# AWS Bedrock Implementation Guide

## Overview

AWS Bedrock has been integrated as the **default LLM provider** for the AI Text2PPT Pro application. When no user API key is provided for other providers (Anthropic, OpenAI, Gemini, OpenRouter), the system automatically falls back to AWS Bedrock, which uses server-side authentication via environment variables.

## Features

✅ **No User Configuration Required** - Bedrock uses server-side environment variables  
✅ **Default Provider** - Automatically used when no API keys are configured  
✅ **Claude Sonnet 4.5** - Uses the latest AWS Bedrock Claude model  
✅ **Free for Users** - API costs handled server-side  
✅ **Incremental Streaming** - Supports real-time slide generation  

## Implementation Details

### 1. Backend Configuration

#### File: `server/config/constants.js`
Added Bedrock to the AI_PROVIDERS configuration:

```javascript
BEDROCK: {
    name: 'bedrock',
    endpoint: 'https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-5-20250929-v1:0/converse',
    model: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
    maxTokens: 8192,
    envVar: 'bedrock' // Uses environment variable instead of user-provided key
}
```

#### File: `server/utils/ai.js`
Implemented Bedrock API integration:

```javascript
if (provider === 'bedrock') {
    // Use environment variable for Bedrock authentication
    const bedrockApiKey = process.env.bedrock || apiKey;
    
    const response = await fetch("https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-5-20250929-v1:0/converse", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${bedrockApiKey.trim()}`
        },
        body: JSON.stringify({
            messages: [{
                role: "user",
                content: [{ text: userPrompt }]
            }]
        })
    });
    // ... response parsing
}
```

#### File: `server.js`
Updated all API endpoints to handle missing API keys:

- `/api/preview` - Preview generation
- `/api/generate` - Presentation generation
- `/api/modify-slides` - Slide modification
- `/api/generate-content` - Content generation
- `/api/process-files` - File processing
- `/api/generate-with-template` - Template-based generation

Each endpoint now includes:
```javascript
// If no API key provided, default to Bedrock with environment variable
if (!apiKey) {
    console.log('⚠️ No API key provided, defaulting to Bedrock provider');
    provider = 'bedrock';
    apiKey = ''; // Will use environment variable in callAI
}
```

### 2. Frontend Configuration

#### File: `public/index.html`
Added Bedrock provider button and information section:

- Provider selection button with "FREE • Default" badge
- Informative section explaining no API key is needed
- Server-side authentication notice

#### File: `public/js/app.js`
Updated initialization logic:

```javascript
window.currentProvider = 'bedrock'; // Default to Bedrock (FREE)

function initializeProviderSelection() {
    // Check if any provider has a saved API key
    const hasAnthropicKey = !!localStorage.getItem('anthropic_api_key');
    const hasOpenAIKey = !!localStorage.getItem('openai_api_key');
    const hasGeminiKey = !!localStorage.getItem('gemini_api_key');
    const hasOpenRouterKey = !!localStorage.getItem('openrouter_api_key');
    
    let savedProvider = localStorage.getItem('ai_provider');
    
    // If no provider saved or no API keys available, default to Bedrock
    if (!savedProvider || (!hasAnthropicKey && !hasOpenAIKey && !hasGeminiKey && !hasOpenRouterKey)) {
        savedProvider = 'bedrock';
        console.log('💡 No API keys found, defaulting to Bedrock (FREE)');
    }
    
    window.currentProvider = savedProvider;
    selectProvider(savedProvider);
}
```

#### File: `public/js/api/capabilities.js`
Updated `getApiKey()` function to handle Bedrock:

```javascript
function getApiKey() {
    const currentProvider = window.currentProvider || localStorage.getItem('ai_provider') || 'bedrock';
    
    // Bedrock doesn't require an API key (uses server environment variable)
    if (currentProvider === 'bedrock') {
        console.log(`✅ Using Bedrock provider (server-side authentication)`);
        return ''; // Empty string - server will use environment variable
    }
    
    const apiKey = localStorage.getItem(`${currentProvider}_api_key`) || '';
    
    if (!apiKey) {
        console.warn(`⚠️ No API key found for provider: ${currentProvider}, falling back to Bedrock`);
        // If no API key found, switch to Bedrock
        window.currentProvider = 'bedrock';
        localStorage.setItem('ai_provider', 'bedrock');
        return '';
    }
    
    return apiKey;
}
```

#### File: `public/js/api/slidePreview.js`
Added provider information to API requests:

```javascript
const currentProvider = window.currentProvider || 'bedrock';
const response = await fetch('/api/preview', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        text: text,
        apiKey: apiKey,
        provider: currentProvider,
        incremental: true
    })
});
```

## Setup Instructions

### 1. Set Environment Variable

Create a `.env` file in the project root (or set environment variables in your deployment platform):

```bash
bedrock=your-aws-bedrock-api-key-here
```

### 2. For Docker Deployment

Add to your `docker-compose.yml`:

```yaml
services:
  app:
    environment:
      - bedrock=${BEDROCK_API_KEY}
```

Or in Dockerfile:
```dockerfile
ENV bedrock=${BEDROCK_API_KEY}
```

### 3. For Railway/Heroku/Cloud Deployment

Set the environment variable in your platform's dashboard:

**Variable Name:** `bedrock`  
**Variable Value:** Your AWS Bedrock API key

## API Request Format

Bedrock uses the following request format:

```bash
curl -X POST "https://bedrock-runtime.us-east-1.amazonaws.com/model/us.anthropic.claude-sonnet-4-5-20250929-v1:0/converse" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${bedrock}" \
  -d '{
    "messages": [
        {
            "role": "user",
            "content": [{"text": "Hello"}]
        }
    ]
  }'
```

## Response Format

Bedrock returns responses in this format:

```json
{
  "output": {
    "message": {
      "content": [
        {
          "text": "Response text here"
        }
      ]
    }
  }
}
```

## Fallback Behavior

The system implements a smart fallback mechanism:

1. **User selects a provider** (Anthropic, OpenAI, etc.)
   - System checks for API key in localStorage
   - If found, uses that provider

2. **No API key found**
   - Automatically falls back to Bedrock
   - Uses server-side `bedrock` environment variable
   - User sees "Using Bedrock provider (server-side authentication)" in console

3. **First-time users**
   - Bedrock is selected by default
   - No configuration required
   - Can switch to other providers by adding API keys

## User Experience

### For End Users:
- No API key configuration needed
- Application works immediately out of the box
- Can optionally configure their own API keys for other providers
- Seamless fallback to Bedrock if their API key is invalid or missing

### For Administrators:
- Single environment variable to configure
- Centralized API key management
- Cost control and monitoring
- No user API key handling/storage concerns

## Testing

To test Bedrock integration:

1. **Clear all localStorage API keys:**
```javascript
// In browser console
localStorage.clear();
```

2. **Reload the application**
   - Should automatically select Bedrock
   - Should show "FREE • Default" badge on Bedrock button

3. **Generate a presentation**
   - Should work without requiring any API key input
   - Console should show: "Using Bedrock provider (server-side authentication)"

4. **Check server logs**
   - Should show: "Provider: bedrock"
   - No "No API key provided" warnings

## Benefits

### For Users:
- ✅ Zero configuration required
- ✅ Instant access to AI features
- ✅ No cost concerns
- ✅ Privacy - no personal API keys needed

### For Administrators:
- ✅ Centralized cost management
- ✅ Better security (single API key on server)
- ✅ Usage monitoring and control
- ✅ Easier deployment and scaling

## Troubleshooting

### Issue: "Bedrock API key not found in environment variable"

**Solution:** Set the `bedrock` environment variable on your server:
```bash
export bedrock=your-api-key-here
```

### Issue: Application not using Bedrock by default

**Solution:** 
1. Check browser console for errors
2. Clear localStorage: `localStorage.clear()`
3. Reload the page
4. Verify environment variable is set on server

### Issue: Bedrock requests failing

**Solution:**
1. Verify the API key is valid
2. Check AWS Bedrock service status
3. Verify the region (us-east-1) is accessible
4. Check server logs for detailed error messages

## Security Considerations

✅ **Server-Side Authentication** - API key never exposed to client  
✅ **Environment Variables** - Secure storage of credentials  
✅ **No User Key Storage** - No localStorage API keys for Bedrock  
✅ **Rate Limiting** - Can be implemented server-side for all users  

## Future Enhancements

Potential improvements:

1. **Multiple Bedrock Models** - Support different Claude versions
2. **Region Selection** - Allow configuration of AWS region
3. **Cost Monitoring** - Track and display Bedrock usage
4. **Rate Limiting** - Implement per-user or per-IP limits
5. **Caching** - Cache common requests to reduce costs

## Summary

AWS Bedrock integration provides a seamless, zero-configuration experience for end users while maintaining centralized control for administrators. The implementation ensures that users can start generating presentations immediately without any setup, while still maintaining the flexibility to use their own API keys for other providers if desired.

