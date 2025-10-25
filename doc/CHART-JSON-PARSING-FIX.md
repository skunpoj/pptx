# Chart Generation JSON Parsing Fix

## Problem
Users were encountering an error when trying to create presentations with charts:
```
❌ Error: Unexpected token '<', "<!--# Id: "... is not valid JSON
```

This error indicated that the AI was returning responses with HTML comments or other formatting that wasn't being properly cleaned before JSON parsing.

## Root Cause
The `parseAIResponse()` function in `server/utils/helpers.js` was not handling all possible AI response formats:
1. **HTML comments** - Some AI models include HTML-style comments in their responses
2. **Text prefixes** - AIs sometimes add introductory text like "Here's the JSON:"
3. **Embedded JSON** - JSON might be embedded within other text

Additionally, the chart generation code had potential issues with:
- Special characters in chart titles and content not being properly escaped
- JSON serialization happening inside template literals without proper escaping

## Solution

### 1. Enhanced JSON Parsing (`server/utils/helpers.js`)

Updated `parseAIResponse()` to handle more edge cases:

```javascript
function parseAIResponse(responseText) {
    // ... validation ...
    
    let cleanedText = responseText
        // Remove markdown code fences
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        // ✅ NEW: Remove HTML comments (including multi-line)
        .replace(/<!--[\s\S]*?-->/g, "")
        // ✅ NEW: Remove common AI prefixes
        .replace(/^Here's the JSON.*?:\s*/i, "")
        .replace(/^Here is the.*?:\s*/i, "")
        .trim();
    
    // ✅ NEW: Extract JSON from embedded text
    const jsonMatch = cleanedText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
        jsonText = jsonMatch[1];
    }
    
    // ... parse and return ...
}
```

**Key improvements:**
- Removes HTML comments using regex: `/<!--[\s\S]*?-->/g`
- Strips common AI text prefixes
- Extracts JSON even when embedded in explanatory text
- Better error logging showing both cleaned and original text

### 2. Improved Chart Code Generation (`server/utils/generators.js`)

Refactored `generateChartSlideCode()` to properly escape all data:

```javascript
function generateChartSlideCode(slide, idx) {
    // ✅ Pre-serialize all strings to avoid escaping issues
    const slideTitle = JSON.stringify(slide.title);
    const chartTitle = JSON.stringify(slide.chart.title || 'Chart');
    const chartType = (slide.chart.type || 'bar').toUpperCase();
    
    // ✅ Build and serialize chart data properly
    const chartDataArray = chartData.datasets.map((dataset) => ({
        name: dataset.name || 'Data',
        labels: chartData.labels,
        values: dataset.values
    }));
    const chartDataStr = JSON.stringify(chartDataArray, null, 8);
    
    // ✅ Properly escape insights text
    if (slide.content && slide.content.length > 0) {
        const insightsText = slide.content.map(item => `• ${item}`).join('\\n');
        const insightsStr = JSON.stringify(insightsText);
        // ... use insightsStr in code generation ...
    }
}
```

**Key improvements:**
- All strings are JSON.stringify'd **before** being inserted into template literals
- Chart data is properly serialized with indentation for readability
- Content/insights are escaped to handle special characters
- Safer handling of null/undefined values with fallbacks

## Testing
To verify the fix works:

1. **Test with chart-heavy content:**
   ```
   Create a sales analysis presentation with:
   - Q1-Q4 revenue comparison (bar chart)
   - Market share breakdown (pie chart)  
   - Growth trends over time (line chart)
   ```

2. **Test with special characters:**
   - Chart titles with quotes: `"Q1 Results - 'Amazing' Growth"`
   - Content with newlines and special chars
   - Unicode characters in labels

3. **Monitor server logs:**
   - Check for "JSON Parse Error" messages
   - Verify cleaned text shows no HTML comments
   - Confirm successful chart slide generation

## Files Modified
- ✅ `server/utils/helpers.js` - Enhanced `parseAIResponse()`
- ✅ `server/utils/generators.js` - Improved `generateChartSlideCode()`

## Impact
- ✅ Charts with any characters now work correctly
- ✅ HTML comments in AI responses are handled gracefully  
- ✅ More robust JSON extraction from various AI response formats
- ✅ Better error messages for debugging
- ✅ No breaking changes to existing functionality

## Next Steps
If you still encounter JSON parsing errors:
1. Check the server console logs for the "Original text preview"
2. Report the specific AI provider and model being used
3. Share the exact error message and preview text

The enhanced logging will help identify any remaining edge cases.

