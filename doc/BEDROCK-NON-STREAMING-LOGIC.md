# Bedrock Non-Streaming Logic - Where It's Used

## ✅ **Yes, There IS Non-Streaming Bedrock!**

It's used in these scenarios:

---

## 🎯 **1. When `stream: false` is Explicitly Set**

### **Location:** `server/routes/content.js` (line 285-289)

```javascript
} else {
    // Non-streaming fallback
    const content = await callAI(provider, apiKey, userPrompt);
    res.json({ content });
}
```

### **When This Happens:**
- User explicitly sets `stream: false`
- Provider doesn't support streaming (not Anthropic or Bedrock)
- Default behavior for many endpoints

### **Endpoint Used:**
```javascript
POST https://bedrock-runtime.us-east-1.amazonaws.com/model/{modelId}/converse
// Note: NO "-stream" suffix!
```

### **Flow:**
```
Client → Server (stream: false)
    ↓
Server → callAI(provider, apiKey, prompt)
    ↓
callAI → Bedrock /converse (NOT /converse-stream)
    ↓
Bedrock → Returns full JSON response
    ↓
Server → Parses response
    ↓
Server → Returns to client as JSON
```

---

## 🔧 **2. Implementation: `server/utils/ai.js`**

### **The `callAI()` Function**

```javascript
async function callAI(provider, apiKey, userPrompt) {
    if (provider === 'bedrock') {
        const bedrockApiKey = process.env.bedrock || apiKey;
        const modelIds = [
            'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
            'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
            'amazon.nova-lite-v1:0',  // ✅ Added!
            'amazon.nova-pro-v1:0'    // ✅ Added!
        ];
        
        for (const modelId of modelIds) {
            const response = await fetch(
                `https://bedrock-runtime.us-east-1.amazonaws.com/model/${modelId}/converse`,  // ← NON-streaming!
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${bedrockApiKey}`
                    },
                    body: JSON.stringify({
                        messages: [{
                            role: "user",
                            content: [{ text: userPrompt }]
                        }]
                    })
                }
            );
            
            const data = await response.json();
            // Extract text from: data.output.message.content[0].text
            return content[0].text.trim();
        }
    }
}
```

---

## 📋 **3. Where Non-Streaming Is Used**

### **A. Content Generation (Expand Idea)**

**When:** User sets `stream: false` or uses non-Anthropic/non-Bedrock provider

```javascript
// Client sends
{ stream: false, provider: 'bedrock', prompt: '...' }

// Server uses
callAI('bedrock', apiKey, userPrompt)  // Non-streaming path
```

### **B. Final PowerPoint Generation (`/api/generate`)**

**Location:** `server.js` line 980+

```javascript
app.post('/api/generate', async (req, res) => {
    // This is ALWAYS non-streaming (returns file)
    const response = await callAI(provider, apiKey, prompt);
    // Process and return PPTX file
});
```

**Why Non-Streaming?**
- Needs complete JSON to parse slide structure
- Only returns PPTX file at the end
- No need for incremental updates

### **C. Slide Modifications (`/api/modify-slides`)**

**Location:** `server/routes/modification.js`

```javascript
// Also non-streaming - needs full response
const modifiedContent = await callAI(provider, apiKey, prompt);
```

**Why Non-Streaming?**
- Processes complete slide data
- Returns modified structure as JSON
- No real-time updates needed

---

## 🔄 **Streaming vs Non-Streaming Flow**

### **Streaming (Expand Idea / Slide Preview)**

```
Client → { stream: true, provider: 'bedrock' }
    ↓
Server → Bedrock /converse-stream
    ↓
Bedrock → Streams chunks → Server forwards SSE → Client
    ↓
Client → Updates textarea incrementally ✨
```

### **Non-Streaming (Generate PPTX / Modify)**

```
Client → { stream: false, provider: 'bedrock' }
    ↓
Server → callAI() → Bedrock /converse (NO -stream)
    ↓
Bedrock → Returns full JSON → Server waits
    ↓
Server → Parses complete response
    ↓
Server → Returns JSON to client
```

---

## 📊 **Endpoint Comparison**

| Endpoint | Stream | Bedrock Method | When Used |
|----------|--------|----------------|-----------|
| `/api/generate-content` | `true` | `/converse-stream` | Default (Expand Idea) |
| `/api/generate-content` | `false` | `/converse` | If stream disabled |
| `/api/preview` | `true` | `/converse-stream` | Slide Preview |
| `/api/generate` | always `false` | `/converse` | Final PPTX |
| `/api/modify-slides` | always `false` | `/converse` | Modifications |

---

## 🧪 **How to Test Non-Streaming**

### **Test 1: Force Non-Streaming for Expand Idea**

```javascript
// In browser console
window.generateContentNonStreaming = true;

// Or modify fileHandler.js
await nonStreamingContentGeneration(apiCallParams);  // Force this
```

### **Test 2: Check Server Logs**

**Non-Streaming Shows:**
```
🔄 Calling Bedrock model: global.anthropic.claude-sonnet...
✅ Success with model
📤 Returning full response
```

**Streaming Shows:**
```
📡 SERVER: Setting up streaming response
📦 SERVER: Chunk 1: 156 bytes
  📤 SERVER: Sending text to client...
✅ SERVER: Stream complete
```

---

## 🔑 **Key Differences**

### **API Endpoints:**

| Type | Endpoint | Suffix |
|------|----------|--------|
| **Non-Streaming** | `/model/{id}/converse` | None |
| **Streaming** | `/model/{id}/converse-stream` | `-stream` |

### **Response Format:**

**Non-Streaming:**
```json
{
    "output": {
        "message": {
            "content": [
                { "text": "Full response here..." }
            ]
        }
    }
}
```

**Streaming:**
```
// Multiple JSON chunks
{"contentBlockDelta": {"delta": {"text": "Part 1"}}}
{"contentBlockDelta": {"delta": {"text": "Part 2"}}}
{"contentBlockDelta": {"delta": {"text": "Part 3"}}}
```

---

## 📝 **Summary**

### **Non-Streaming Bedrock IS Implemented!**

✅ **Location:** `server/utils/ai.js` → `callAI()` function  
✅ **Endpoint:** `/model/{modelId}/converse` (NO `-stream`)  
✅ **Models:** Same 4-model fallback as streaming  
✅ **Used For:**
- When `stream: false` explicitly set
- `/api/generate` (final PPTX generation)
- `/api/modify-slides` (slide modifications)
- Fallback for providers without streaming support

### **Why Two Different Endpoints?**

1. **`/converse`** (Non-Streaming)
   - Returns complete response at once
   - Simpler to parse
   - Better for operations needing full data

2. **`/converse-stream`** (Streaming)
   - Returns chunks incrementally
   - Real-time user feedback
   - Better UX for long responses

Both use the same authentication, same models, same region - just different methods!

---

*Updated: 2025-01-28*
*Status: ✅ Both streaming and non-streaming Bedrock fully implemented*

