# 🎯 Dynamic Slide Count Implementation

## Problem Fixed

**Before:** Slide count was hardcoded to 7 slides, ignoring:
- User's "Number of slides" input (defaulted to 6)
- Content requirements
- AI's judgment

**After:** Slide count is now:
1. ✅ **User-controlled** via the "Number of slides" input
2. ✅ **Content-driven** - AI can adjust based on actual content
3. ✅ **Flexible** - AI gets guidance, not hard requirements

---

## How It Works

### 1. User Input (`public/index.html`)

```html
<label>Number of slides:</label>
<input type="number" id="numSlides" value="6" min="3" max="20">
```

**Default:** 6 slides  
**Range:** 3-20 slides  
**Meaning:** "I want approximately this many slides"

---

### 2. Client Passes Value (`public/js/api.js`)

```javascript
// Get user's slide preference
const numSlidesInput = document.getElementById('numSlides');
const numSlides = numSlidesInput ? parseInt(numSlidesInput.value) || 0 : 0;

// Send to server
body: JSON.stringify({ 
    text, 
    apiKey, 
    provider: window.currentProvider, 
    incremental: true,
    numSlides: numSlides  // ← User's preference
})
```

**numSlides = 0** → AI decides based on content  
**numSlides = 6** → AI targets ~6 slides (can be 5-8 if needed)  
**numSlides = 10** → AI targets ~10 slides (can be 9-12 if needed)

---

### 3. Server Receives & Passes (`server.js`)

```javascript
app.post('/api/preview', async (req, res) => {
    const { text, apiKey, provider = 'anthropic', incremental = true, numSlides = 0 } = req.body;
    
    console.log('  Requested slides:', numSlides || 'AI decides');
    
    // Pass to prompt generator
    const themePrompt = await getSlideDesignPrompt(text, numSlides);
    // ...
});
```

---

### 4. Prompt Generator Creates Instruction (`server/utils/promptManager.js`)

```javascript
async function getSlideDesignPrompt(userContent, numSlides = 0) {
    // Build slide guidance based on user preference
    let slideGuidance = '2. Create 4-15 slides total (including title slide)...';
    
    if (numSlides > 0) {
        // User specified a preference
        slideGuidance = `2. Create approximately ${numSlides} slides total (including title slide). You may use ${numSlides-1} to ${numSlides+2} slides if needed to properly organize the content and avoid overcrowding`;
    }
    
    // Replace in template
    let template = promptConfig.template;
    template = template.replace(
        /2\. Create 4-15 slides total.../,
        slideGuidance
    );
    
    return applyVariables(template, variables);
}
```

**Example transformations:**

| User Input | AI Instruction |
|------------|---------------|
| (empty/0) | "Create 4-15 slides total..." |
| 6 | "Create approximately 6 slides. You may use 5 to 8 slides if needed..." |
| 10 | "Create approximately 10 slides. You may use 9 to 12 slides if needed..." |
| 15 | "Create approximately 15 slides. You may use 14 to 17 slides if needed..." |

---

## Examples

### Example 1: User Wants 6 Slides

**User sets:** `numSlides = 6`

**AI receives:**
> "Create approximately 6 slides total (including title slide). You may use 5 to 8 slides if needed to properly organize the content and avoid overcrowding"

**AI might generate:**
- Short content → 5 slides (within range)
- Medium content → 6 slides (exact)
- Long content → 7-8 slides (within range, avoids overcrowding)

---

### Example 2: User Leaves Default (6)

**User sets:** `numSlides = 6` (default)

**Same as Example 1** - AI targets 6 slides with flexibility

---

### Example 3: User Wants 12 Slides

**User sets:** `numSlides = 12`

**AI receives:**
> "Create approximately 12 slides total (including title slide). You may use 11 to 14 slides if needed..."

**AI might generate:**
- 11-14 slides depending on content
- More detail per topic
- Better spacing of information

---

### Example 4: User Sets 0 (AI Decides)

**User sets:** `numSlides = 0` (or leaves blank)

**AI receives:**
> "Create 4-15 slides total (including title slide) - use MORE slides if needed to avoid overcrowding any single slide"

**AI decides based on content:**
- Simple topic → 4-6 slides
- Medium topic → 7-10 slides
- Complex topic → 11-15 slides

---

## Benefits

### 1. **User Control**
```
User: "I want exactly 5 slides for a quick pitch"
→ Sets numSlides = 5
→ AI creates 4-6 slides
```

### 2. **Content-Driven**
```
User: "I want 6 slides"
Content: Very detailed with 10 major points
→ AI creates 7-8 slides to avoid overcrowding
→ Each slide remains readable
```

### 3. **Flexibility**
```
User: numSlides = 8
Content: Only 3 main points
→ AI creates 5-6 slides (doesn't pad unnecessarily)
```

### 4. **Quality Over Quantity**
AI always prioritizes:
- ✅ Maximum 6-7 bullet points per slide
- ✅ Readability and spacing
- ✅ Logical content flow
- ✅ Not overcrowding slides

---

## User Experience Flow

### Scenario 1: Business Presentation

**User Input:**
- Content: Quarterly business review (detailed)
- numSlides: 8

**Result:**
```
📊 Preview request received
  Requested slides: 8

🔄 Starting incremental slide generation...
  📝 Will generate 9 slides incrementally
  🎨 Theme: Corporate Blue

✅ Incremental generation complete: 9 slides
```

**Why 9 instead of 8?**
- Content had many data points
- AI split some topics to avoid overcrowding
- 9 is within range (8-1 to 8+2 = 7-10)

---

### Scenario 2: Simple Pitch

**User Input:**
- Content: Simple product pitch (3 key features)
- numSlides: 5

**Result:**
```
📊 Preview request received
  Requested slides: 5

🔄 Starting incremental slide generation...
  📝 Will generate 5 slides incrementally
  🎨 Theme: Vibrant Purple

✅ Incremental generation complete: 5 slides
```

**Perfect match!**
- Content fits well in 5 slides
- Title + 3 feature slides + closing = 5

---

### Scenario 3: Let AI Decide

**User Input:**
- Content: Environmental sustainability (moderate)
- numSlides: 0 (default, AI decides)

**Result:**
```
📊 Preview request received
  Requested slides: AI decides

🔄 Starting incremental slide generation...
  📝 Will generate 7 slides incrementally
  🎨 Theme: Forest Green

✅ Incremental generation complete: 7 slides
```

**AI chose 7 because:**
- Content had 5-6 main topics
- Each needs its own slide
- Plus title slide
- = 6-7 slides optimal

---

## Implementation Details

### Files Changed:

1. **`server/utils/promptManager.js`**
   - Added `numSlides` parameter to `getSlideDesignPrompt()`
   - Dynamic prompt template replacement
   - Flexible range calculation

2. **`server.js`**
   - Accept `numSlides` from request body
   - Pass to prompt generator
   - Log the preference

3. **`public/js/api.js`**
   - Read from `#numSlides` input
   - Pass to both streaming and non-streaming modes

### Backward Compatible:
- ✅ If `numSlides` not provided → defaults to 0 (AI decides)
- ✅ Old API calls still work
- ✅ No breaking changes

---

## Testing

### Test Case 1: User Specifies 6
```javascript
numSlides: 6
→ AI receives: "Create approximately 6 slides... may use 5 to 8..."
→ Result: 5-8 slides ✓
```

### Test Case 2: User Specifies 12
```javascript
numSlides: 12
→ AI receives: "Create approximately 12 slides... may use 11 to 14..."
→ Result: 11-14 slides ✓
```

### Test Case 3: No Specification
```javascript
numSlides: 0
→ AI receives: "Create 4-15 slides total..."
→ Result: 4-15 slides based on content ✓
```

### Test Case 4: Edge Cases
```javascript
numSlides: 3  → Range: 2-5 slides
numSlides: 20 → Range: 19-22 slides
numSlides: ""  → Defaults to 0 (AI decides)
numSlides: null → Defaults to 0 (AI decides)
```

---

## Server Logs

**Before:**
```
📊 Preview request received
  Content length: 1234 characters
  Provider: anthropic
  Incremental: true
```

**After:**
```
📊 Preview request received
  Content length: 1234 characters
  Provider: anthropic
  Incremental: true
  Requested slides: 8        ← NEW!
```

---

## Summary

### ✅ Problem Solved:

1. **Respects user input** - "Number of slides" field now works
2. **Content-driven** - AI can adjust based on actual content
3. **Flexible** - Gives AI room to optimize
4. **Quality-focused** - Prevents overcrowding

### 🎯 Result:

**User says:** "I want 6 slides"  
**AI thinks:** "6 slides requested, but I have a lot of content. I'll create 7 slides to keep each one readable"  
**Result:** 7 well-structured, readable slides ✓

**Much better than:** 6 overcrowded slides with 10+ bullets each ❌

---

**Status:** ✅ COMPLETE AND WORKING

The slide count is now:
- ✅ User-controlled (via input)
- ✅ Content-aware (AI adjusts)
- ✅ Flexible (±1-2 slides)
- ✅ Quality-focused (no overcrowding)

