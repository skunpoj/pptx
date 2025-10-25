/**
 * Test parseAIResponse function with various edge cases
 * Run with: node test/test-json-parsing.js
 */

// Mock the parseAIResponse function (copy from helpers.js)
function parseAIResponse(responseText) {
    // Validate input
    if (!responseText || typeof responseText !== 'string') {
        console.error('Invalid response text:', typeof responseText);
        throw new Error('AI returned an empty or invalid response. Please try again.');
    }
    
    // Clean up common AI response formatting
    let cleanedText = responseText
        // Remove markdown code fences
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        // Remove HTML comments (including multi-line)
        .replace(/<!--[\s\S]*?-->/g, "")
        // Remove common prefixes that AIs sometimes add
        .replace(/^Here's the JSON.*?:\s*/i, "")
        .replace(/^Here is the.*?:\s*/i, "")
        .trim();
    
    // Additional validation after cleaning
    if (!cleanedText) {
        console.error('Response became empty after cleaning');
        throw new Error('AI response was empty after formatting cleanup. Please try again.');
    }
    
    // Check if response looks like HTML (after cleaning comments)
    if (cleanedText.startsWith('<') && !cleanedText.startsWith('{') && !cleanedText.startsWith('[')) {
        console.error('Response appears to be HTML instead of JSON');
        console.error('Response preview:', cleanedText.substring(0, 200));
        throw new Error('AI service returned an error page instead of JSON data. Please check your API key and try again.');
    }
    
    // Try to extract JSON if it's embedded in text
    let jsonText = cleanedText;
    
    // Look for JSON object or array
    const jsonMatch = cleanedText.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
        jsonText = jsonMatch[1];
    }
    
    try {
        const data = JSON.parse(jsonText);
        
        // Validate the parsed data has expected structure
        if (!data || typeof data !== 'object') {
            throw new Error('Parsed data is not a valid object');
        }
        
        return data;
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
        console.error('Cleaned text preview:', jsonText.substring(0, 500));
        console.error('Original text preview:', responseText.substring(0, 500));
        
        // Try to provide more helpful error message
        if (parseError.message.includes('Unexpected token')) {
            const match = parseError.message.match(/Unexpected token (.+?) in JSON/);
            const token = match ? match[1] : 'unknown';
            throw new Error(`AI response contains invalid JSON (unexpected ${token}). This usually means the AI didn't format the response correctly. Please try again.`);
        } else if (parseError.message.includes('Unexpected end')) {
            throw new Error('AI response is incomplete. The AI might have been interrupted. Please try again.');
        } else {
            throw new Error('Failed to parse AI response as JSON. Please try again or check server logs for details.');
        }
    }
}

// Test cases
const testCases = [
    {
        name: "HTML comment at start",
        input: `<!--# Id: test123 -->
{
  "slides": [
    {"title": "Test Slide", "content": ["Point 1"]}
  ]
}`,
        shouldPass: true
    },
    {
        name: "Markdown code fence",
        input: '```json\n{"slides": [{"title": "Test"}]}\n```',
        shouldPass: true
    },
    {
        name: "AI prefix text",
        input: 'Here\'s the JSON you requested:\n{"slides": [{"title": "Test"}]}',
        shouldPass: true
    },
    {
        name: "Embedded JSON in text",
        input: 'I created this for you: {"slides": [{"title": "Test"}]} Hope this helps!',
        shouldPass: true
    },
    {
        name: "Chart with special characters",
        input: `{
  "slides": [{
    "title": "Q1 Results - 'Amazing' Growth",
    "chart": {
      "title": "Revenue Chart",
      "type": "bar",
      "data": {
        "labels": ["Q1", "Q2", "Q3"],
        "datasets": [{
          "name": "Sales",
          "values": [100, 200, 300]
        }]
      }
    },
    "content": ["Point with \\"quotes\\"", "Line\\nbreak"]
  }]
}`,
        shouldPass: true
    },
    {
        name: "Multi-line HTML comment",
        input: `<!-- This is a 
multi-line
comment -->
{"slides": [{"title": "Test"}]}`,
        shouldPass: true
    }
];

// Run tests
console.log('🧪 Testing JSON parsing edge cases...\n');
let passed = 0;
let failed = 0;

testCases.forEach((test, idx) => {
    try {
        const result = parseAIResponse(test.input);
        if (test.shouldPass) {
            console.log(`✅ Test ${idx + 1} PASSED: ${test.name}`);
            console.log(`   Result:`, JSON.stringify(result).substring(0, 100) + '...');
            passed++;
        } else {
            console.log(`❌ Test ${idx + 1} FAILED: ${test.name} - Should have thrown error`);
            failed++;
        }
    } catch (error) {
        if (!test.shouldPass) {
            console.log(`✅ Test ${idx + 1} PASSED: ${test.name} - Correctly threw error`);
            passed++;
        } else {
            console.log(`❌ Test ${idx + 1} FAILED: ${test.name}`);
            console.log(`   Error: ${error.message}`);
            failed++;
        }
    }
    console.log('');
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);
process.exit(failed > 0 ? 1 : 0);

