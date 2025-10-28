# Expand Idea Streaming - Debugging Guide

## 🔍 **What to Check in Browser Console (F12)**

When you click "Expand Idea", you should see this flow:

### **1. Provider Check**
```
═══════════════════════════════════════════════════
🔍 PROVIDER SELECTION CHECK
  window.currentProvider: anthropic
  Is Anthropic? true
  Files count: 0
  Will use streaming? true
═══════════════════════════════════════════════════
```

**Expected:** `Is Anthropic? true` AND `Will use streaming? true`

**If NOT:** Provider is not set to Anthropic. Fix: Select "Anthropic" in settings.

---

### **2. Client Initiation**
```
═══════════════════════════════════════════════════
🚀 CLIENT: Starting streaming content generation
  Provider: anthropic
  Stream enabled: true
  Options: { numSlides: 6, generateImages: true, ... }
  Prompt length: 1234 characters
  API Key present: true
  Textarea element: textInput
═══════════════════════════════════════════════════
```

**Expected:** All fields populated, textarea element found

**If error:** Check "Textarea element: NOT FOUND" - DOM issue

---

### **3. Request Sent**
```
📤 CLIENT: Sending request to /api/generate-content
  Method: POST
  Has files: false
  Request body type: JSON
```

**Expected:** Request is sent

---

### **4. Response Received**
```
📨 CLIENT: Response received
  Status: 200 OK
  Content-Type: text/event-stream  ← CRITICAL!
  Headers: { ... }
```

**Expected:** `Content-Type: text/event-stream`

**If NOT:** Response is `application/json` - server didn't stream!

---

### **5. Reading Stream**
```
📖 CLIENT: Starting to read stream chunks...
📦 CLIENT: Chunk 1: 156 bytes
  📥 CLIENT: Data event 1: "{"text":"Company Overview - Our innov..."
  📊 CLIENT: Parsed JSON, keys: ["text"]
  ✍️ CLIENT: Updated textarea! Total chars: 45, last text: "Company..."
📦 CLIENT: Chunk 2: 203 bytes
  📥 CLIENT: Data event 2: "{"text":"ation specializes in cutting..."
  📊 CLIENT: Parsed JSON, keys: ["text"]
  ✍️ CLIENT: Updated textarea! Total chars: 89, last text: "ation..."
```

**Expected:** Continuous chunks and updates

**If blank:** No chunks received or no `data:` events

---

### **6. Stream Complete**
```
═══════════════════════════════════════════════════
✅ CLIENT: Stream complete!
  Total chunks received: 23
  Total data events: 45
  Final content length: 1234 characters
  Lines processed: 156
═══════════════════════════════════════════════════
```

---

## 🔍 **What to Check in Server Console**

### **1. Request Received**
```
📝 Content generation request received
  Options: { 
    numSlides: 6, 
    generateImages: true, 
    extractColors: true, 
    useAsTemplate: true, 
    stream: true, 
    provider: 'anthropic' 
  }
```

**Expected:** All options match your checkbox selections

---

### **2. Streaming Mode Enabled**
```
═══════════════════════════════════════════════════
📡 SERVER: Setting up streaming response
  Provider: anthropic
  Stream mode: TRUE
  Prompt length: 1234 characters
  Max tokens: 4000
═══════════════════════════════════════════════════
```

**Expected:** Stream mode TRUE

**If FALSE:** Check condition `stream && provider === 'anthropic'`

---

### **3. Anthropic API Call**
```
📤 SERVER: Calling Anthropic API with streaming...
📨 SERVER: Anthropic response status: 200 OK
📖 SERVER: Getting reader from Anthropic response...
```

**Expected:** Status 200 OK

**If error:** API key issue or Anthropic unavailable

---

### **4. Reading Anthropic Stream**
```
📡 SERVER: Starting to read Anthropic stream...
📦 SERVER: Chunk 1: 156 bytes from Anthropic
  📊 SERVER: Parsed Anthropic event, type: content_block_delta
  📤 SERVER: Sending text to client (event 1): "Company Overview..."
  ✅ SERVER: Flushed to client
📦 SERVER: Chunk 2: 203 bytes from Anthropic
  📊 SERVER: Parsed Anthropic event, type: content_block_delta
  📤 SERVER: Sending text to client (event 2): "ation specializing..."
  ✅ SERVER: Flushed to client
```

**Expected:** Continuous chunks and flush confirmations

---

### **5. Complete**
```
═══════════════════════════════════════════════════
✅ SERVER: Anthropic stream complete
  Total chunks: 23
  Total events sent: 45
  Total bytes: 12345
═══════════════════════════════════════════════════
📤 SERVER: Sending [DONE] marker to client
✅ SERVER: Stream closed
```

---

## ❌ **Common Issues & Solutions**

### **Issue 1: Not Using Streaming**
**Symptom:** No client logs after "Response received"

**Possible Causes:**
1. `window.currentProvider` is not 'anthropic'
   - **Fix:** Set provider to Anthropic in settings
   
2. Files uploaded (even though this was removed as a blocker)
   - **Fix:** Remove files or handle both cases
   
3. Server not receiving `stream: true`
   - **Fix:** Check network tab to see request body

### **Issue 2: Server Not Streaming**
**Symptom:** Status 200 but Content-Type is `application/json`

**Possible Causes:**
1. Condition `stream && provider === 'anthropic'` failing
   - **Check:** Look for "SER VER: Setting up streaming response" logs
   
2. Server falling through to non-streaming path
   - **Fix:** Check server logs for why streaming path wasn't taken

### **Issue 3: No Chunks Received**
**Symptom:** Client logs show "Starting to read stream" but no chunks

**Possible Causes:**
1. Response.body is null
   - **Check:** Look for "❌ CLIENT: Response.body is null!"
   
2. Server not flushing
   - **Check:** Look for "✅ SERVER: Flushed to client" in logs

### **Issue 4: Text Not Updating**
**Symptom:** Chunks received but textarea not updating

**Possible Causes:**
1. `textInput` element not found
   - **Check:** Look for "Textarea element: NOT FOUND"
   
2. `parsed.text` is undefined
   - **Check:** Look for "⚠️ CLIENT: No 'text' field in parsed data"

---

## 🧪 **Testing Steps**

1. **Open Browser Console (F12)**
2. **Click "Expand Idea"**
3. **Watch Console Logs:**
   - Check provider selection
   - Check if streaming is enabled
   - Check response content-type
   - Check if chunks are received
   - Check if textarea updates

4. **Check Server Logs** (terminal running `node server.js`):
   - Check if request received
   - Check if streaming mode enabled
   - Check if Anthropic called
   - Check if chunks are forwarded
   - Check flush confirmations

5. **Expected Result:**
   - Text appears in textarea character-by-character
   - Console shows continuous updates
   - Server shows chunks being forwarded

---

## 📊 **Expected Timeline**

```
0s:   Click "Expand Idea"
0s:   Provider check → Anthropic selected ✓
0s:   Client sends request
1s:   Server receives request
1s:   Server calls Anthropic API
2s:   Anthropic starts streaming JSON
2s:   Server receives first chunk from Anthropic
2s:   Server forwards to client
2s:   Client displays in textarea
3s:   More chunks arrive...
...   (continuous streaming)
15s:  Stream complete, all text visible
```

---

## 🔧 **Quick Fixes**

### **Fix 1: Provider Not Anthropic**
```javascript
// In browser console:
window.currentProvider = 'anthropic';
localStorage.setItem('ai_provider', 'anthropic');
```

### **Fix 2: Missing Flush**
```javascript
// In server console, look for:
if (res.flush) res.flush();
// Should appear after every res.write()
```

### **Fix 3: Response Not Streaming**
```javascript
// Check server condition:
if (stream && provider === 'anthropic') {
    // This should be true
    console.log('🎯 Taking streaming path');
}
```

---

*Last Updated: 2025-01-28*

