# AWS Bedrock ConverseStream Implementation

## Overview

Bedrock now supports **real-time streaming** using the ConverseStream API endpoint, providing token-by-token responses similar to Anthropic's streaming API.

## When Streaming is Used

### 1. Content Generation Endpoint (`/api/generate-content`)
**Use Case:** Real-time text streaming for content generation  
**Streaming:** ✅ Yes - Token-by-token  
**Providers:** Anthropic, Bedrock  

### 2. Preview Endpoint (`/api/preview`)
**Use Case:** Slide-by-slide incremental generation  
**Streaming:** ❌ No (simulated via delays)  
**Why:** Needs complete JSON responses for each slide  

## API Endpoints

### ConverseStream (Streaming)

**Endpoint:**
```
POST https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-sonnet-4-5-20250929-v1:0/converse-stream
```

**Request:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "text": "Your prompt here"
        }
      ]
    }
  ]
}
```

**Response Format (Streaming):**
```json
{"messageStart":{"role":"assistant"}}
{"contentBlockStart":{"start":{"type":"text"},"contentBlockIndex":0}}
{"contentBlockDelta":{"delta":{"text":"Hello"},"contentBlockIndex":0}}
{"contentBlockDelta":{"delta":{"text":" there"},"contentBlockIndex":0}}
{"contentBlockDelta":{"delta":{"text":"!"},"contentBlockIndex":0}}
{"contentBlockStop":{"contentBlockIndex":0}}
{"messageStop":{"stopReason":"end_turn"}}
{"metadata":{"usage":{"inputTokens":10,"outputTokens":5}}}
```

### Converse (Non-Streaming)

**Endpoint:**
```
POST https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-sonnet-4-5-20250929-v1:0/converse
```

**Request:** Same as above

**Response Format:**
```json
{
  "output": {
    "message": {
      "role": "assistant",
      "content": [
        {
          "text": "Complete response here"
        }
      ]
    }
  },
  "stopReason": "end_turn",
  "usage": {
    "inputTokens": 10,
    "outputTokens": 50
  }
}
```

## Implementation Details

### Server-Side Streaming (`server.js`)

```javascript
if (provider === 'bedrock') {
    const bedrockApiKey = process.env.bedrock || apiKey;
    
    const response = await fetch(
        "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-sonnet-4-5-20250929-v1:0/converse-stream",
        {
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
        }
    );

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
                const parsed = JSON.parse(line);
                
                // Extract text from Bedrock stream format
                if (parsed.contentBlockDelta?.delta?.text) {
                    res.write(`data: ${JSON.stringify({ 
                        text: parsed.contentBlockDelta.delta.text 
                    })}\n\n`);
                }
            } catch (e) {
                // Skip invalid JSON
            }
        }
    }
}
```

### Stream Event Types

Bedrock ConverseStream sends these event types:

| Event Type | Purpose | Has Text? |
|------------|---------|-----------|
| `messageStart` | Indicates stream beginning | ❌ No |
| `contentBlockStart` | Start of content block | ❌ No |
| `contentBlockDelta` | **Text chunk** | ✅ Yes |
| `contentBlockStop` | End of content block | ❌ No |
| `messageStop` | Stream complete | ❌ No |
| `metadata` | Usage statistics | ❌ No |

**We only care about `contentBlockDelta`** - that's where the actual text is!

## Comparison: Anthropic vs Bedrock Streaming

### Anthropic Format:
```json
// SSE format with "data:" prefix
data: {"type":"content_block_delta","delta":{"text":"Hello"}}
```

### Bedrock Format:
```json
// JSON lines (no "data:" prefix)
{"contentBlockDelta":{"delta":{"text":"Hello"},"contentBlockIndex":0}}
```

### Code Differences:

**Anthropic:**
```javascript
// Parse SSE format
if (line.startsWith('data: ')) {
    const data = line.slice(6);
    const parsed = JSON.parse(data);
    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
        // Use text
    }
}
```

**Bedrock:**
```javascript
// Parse JSON lines
const parsed = JSON.parse(line);
if (parsed.contentBlockDelta?.delta?.text) {
    // Use text
}
```

## Use Cases

### ✅ When to Use Streaming (ConverseStream)

1. **Real-time content generation**
   - User sees text appear as it's generated
   - Better UX for long responses
   - Used in `/api/generate-content`

2. **Interactive chat**
   - Conversational interfaces
   - Real-time feedback

3. **Long-form content**
   - Articles, essays
   - Detailed explanations

### ❌ When NOT to Use Streaming

1. **Structured JSON responses**
   - Slide data with specific schema
   - Need complete JSON to parse
   - Used in `/api/preview`

2. **Batch processing**
   - Multiple independent requests
   - No user watching in real-time

3. **Simple queries**
   - Short responses
   - Overhead not worth it

## Testing Streaming

### Test ConverseStream Directly:

```bash
curl -X POST "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-sonnet-4-5-20250929-v1:0/converse-stream" \
  -H "Authorization: Bearer ${bedrock}" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "text": "Write a short poem about coding"
          }
        ]
      }
    ]
  }' \
  --no-buffer
```

**Expected Output:**
```
{"messageStart":{"role":"assistant"}}
{"contentBlockStart":{"start":{"type":"text"},"contentBlockIndex":0}}
{"contentBlockDelta":{"delta":{"text":"In"},"contentBlockIndex":0}}
{"contentBlockDelta":{"delta":{"text":" lines"},"contentBlockIndex":0}}
{"contentBlockDelta":{"delta":{"text":" of"},"contentBlockIndex":0}}
...
```

### Test via Application:

1. Use `/api/generate-content` endpoint with `stream: true`
2. Watch browser console for real-time updates
3. Should see text appear token-by-token

## Performance Considerations

### Streaming:
- ✅ **Pros:** Better UX, faster perceived response time
- ❌ **Cons:** More complex error handling, network overhead

### Non-Streaming:
- ✅ **Pros:** Simpler code, easier error handling
- ❌ **Cons:** User waits for complete response

## Error Handling

### Streaming Errors:

```javascript
try {
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Process chunk
    }
} catch (error) {
    // Stream interrupted
    if (!res.headersSent) {
        res.status(500).json({ error: error.message });
    }
} finally {
    res.write('data: [DONE]\n\n');
    res.end();
}
```

## Summary

✅ **Implemented:** ConverseStream for `/api/generate-content` endpoint  
✅ **Supports:** Real-time token-by-token streaming  
✅ **Format:** JSON lines with `contentBlockDelta` events  
✅ **Fallback:** Non-streaming Converse API for structured responses  
✅ **Compatibility:** Works alongside Anthropic streaming  

**Result:** Bedrock now provides the same real-time streaming experience as Anthropic! 🚀

