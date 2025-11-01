/**
 * Sequential Slide Generator
 * 
 * Generates slides one at a time using sequential Bedrock API calls.
 * Each slide is generated independently with context from previous slides.
 * 
 * This is an alternative to the batch generation approach where all slides
 * are generated in a single prompt and JSON is concatenated from streaming.
 */

const { getSingleSlidePrompt } = require('./promptManager');
const { parseAIResponse } = require('./ai');

/**
 * Generate slides sequentially using Bedrock ConverseStream API
 * @param {Object} options - Configuration options
 * @param {string} options.userContent - Original user content
 * @param {number} options.numSlides - Total number of slides to generate
 * @param {string} options.bedrockApiKey - Bedrock API key
 * @param {Function} options.onProgress - Progress callback (slideIndex, totalSlides, slideData)
 * @param {Function} options.onTheme - Theme callback (theme)
 * @returns {Promise<Object>} - Final result with slides and theme
 */
async function generateSequentialSlides({ 
    userContent, 
    numSlides, 
    bedrockApiKey,
    onProgress = null,
    onTheme = null
}) {
    const previousSlides = [];
    let designTheme = null;
    
    // Model configurations (same as in server.js)
    const modelConfigs = [
        { id: 'claude-sonnet-4-5-20250929-v1:0', region: 'us-east-1' },
        { id: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0', region: 'us-east-1' },
        { id: 'amazon.nova-lite-v1:0', region: 'us-east-1' },
        { id: 'amazon.nova-pro-v1:0', region: 'us-east-1' }
    ];
    
    // Generate each slide sequentially
    for (let slideIndex = 0; slideIndex < numSlides; slideIndex++) {
        console.log(`🔄 Generating slide ${slideIndex + 1} of ${numSlides}...`);
        
        // Get prompt for this slide
        const slidePrompt = await getSingleSlidePrompt(
            userContent,
            slideIndex,
            numSlides,
            previousSlides,
            designTheme
        );
        
        // Call Bedrock API
        let bedrockResponse = null;
        let lastError = null;
        
        for (const config of modelConfigs) {
            try {
                console.log(`📤 Calling Bedrock model: ${config.id} for slide ${slideIndex + 1}`);
                
                const baseUrl = config.region === 'global' 
                    ? 'https://bedrock-runtime.amazonaws.com' 
                    : `https://bedrock-runtime.${config.region}.amazonaws.com`;
                
                bedrockResponse = await fetch(`${baseUrl}/model/${config.id}/converse-stream`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${bedrockApiKey.trim()}`
                    },
                    body: JSON.stringify({
                        messages: [{
                            role: "user",
                            content: [{ text: slidePrompt }]
                        }],
                        inferenceConfig: {
                            maxTokens: 4000 // Lower for single slide
                        }
                    })
                });
                
                if (bedrockResponse.ok) {
                    console.log(`✅ Success with model: ${config.id}`);
                    break;
                } else {
                    const errorData = await bedrockResponse.json().catch(() => ({}));
                    console.log(`❌ Model ${config.id} failed: ${errorData.error?.message || bedrockResponse.status}`);
                    lastError = new Error(errorData.error?.message || `HTTP ${bedrockResponse.status}`);
                    bedrockResponse = null;
                    continue;
                }
            } catch (error) {
                console.log(`❌ Error with ${config.id}: ${error.message}`);
                lastError = error;
                continue;
            }
        }
        
        if (!bedrockResponse || !bedrockResponse.ok) {
            throw lastError || new Error(`All Bedrock models failed for slide ${slideIndex + 1}`);
        }
        
        // Read stream response with incremental parsing
        const reader = bedrockResponse.body.getReader();
        const decoder = new TextDecoder();
        let streamedText = '';
        let slideData = null;
        
        // Helper function to extract complete JSON object with proper string handling
        function extractCompleteJSONObject(text, startIndex = 0) {
            const firstBrace = text.indexOf('{', startIndex);
            if (firstBrace === -1) return null;
            
            let braceCount = 0;
            let inString = false;
            let escapeNext = false;
            let inStringDelimiter = null;
            
            for (let i = firstBrace; i < text.length; i++) {
                const char = text[i];
                
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                
                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }
                
                if ((char === '"' || char === "'") && !escapeNext) {
                    if (!inString) {
                        inString = true;
                        inStringDelimiter = char;
                    } else if (char === inStringDelimiter) {
                        inString = false;
                        inStringDelimiter = null;
                    }
                    continue;
                }
                
                if (inString) continue;
                
                if (char === '{') braceCount++;
                if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        return {
                            json: text.substring(firstBrace, i + 1),
                            endIndex: i + 1
                        };
                    }
                }
            }
            
            return null; // Incomplete JSON
        }
        
        let chunkCount = 0;
        let eventCount = 0;
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log(`✅ Stream completed for slide ${slideIndex + 1}`);
                    console.log(`   Total chunks received: ${chunkCount}`);
                    console.log(`   Total events processed: ${eventCount}`);
                    console.log(`   Streamed text length: ${streamedText.length} chars`);
                    break;
                }
                
                chunkCount++;
                const chunk = decoder.decode(value, { stream: true });
                
                if (chunkCount <= 5 || chunkCount % 10 === 0) {
                    console.log(`📦 Slide ${slideIndex + 1} - Chunk ${chunkCount}: ${chunk.length} bytes`);
                    console.log(`   Raw chunk sample (first 200 chars): "${chunk.substring(0, 200)}"`);
                }
                
                // Bedrock ConverseStream returns HTTP/2 Event Stream format
                // Strategy: Look for JSON objects by finding {"contentBlockIndex" or {"contentBlockDelta"
                // This is more reliable than looking for any { because of binary framing
                
                // Look for JSON in the chunk (could span across newlines)
                const chunkText = chunk;
                
                // Try to find JSON objects - look for contentBlockIndex pattern
                let searchStart = 0;
                
                while (searchStart < chunkText.length) {
                    // Look for JSON objects that contain delta/text
                    let jsonStart = chunkText.indexOf('{"contentBlockIndex"', searchStart);
                    if (jsonStart === -1) {
                        // Also try contentBlockDelta format
                        jsonStart = chunkText.indexOf('{"contentBlockDelta"', searchStart);
                    }
                    
                    // If no JSON found, break
                    if (jsonStart === -1) break;
                    
                    // Extract JSON from this position
                    const jsonCandidate = chunkText.substring(jsonStart);
                    
                    // Try to parse the JSON (might be complete or partial)
                    try {
                        // Try to extract complete JSON object
                        let jsonStr = jsonCandidate;
                        
                        // If it doesn't start with {, something's wrong
                        if (!jsonStr.startsWith('{')) {
                            searchStart = searchStart + 1;
                            continue;
                        }
                        
                        // Find the end of the JSON object using brace counting
                    let braceCount = 0;
                    let jsonEnd = -1;
                        let inString = false;
                        let escapeNext = false;
                        
                        for (let i = 0; i < jsonStr.length; i++) {
                            const char = jsonStr[i];
                            
                            if (escapeNext) {
                                escapeNext = false;
                                continue;
                            }
                            
                            if (char === '\\') {
                                escapeNext = true;
                                continue;
                            }
                            
                            if ((char === '"' || char === "'") && !escapeNext) {
                                inString = !inString;
                                continue;
                            }
                            
                            if (inString) continue;
                            
                            if (char === '{') braceCount++;
                            if (char === '}') {
                                braceCount--;
                        if (braceCount === 0) {
                            jsonEnd = i;
                            break;
                        }
                    }
                        }
                        
                        // If we found a complete JSON object, parse it
                        if (jsonEnd !== -1 && jsonEnd > 0) {
                            jsonStr = jsonStr.substring(0, jsonEnd + 1);
                            
                            if (chunkCount <= 3 || eventCount < 3) {
                                console.log(`   🔍 Slide ${slideIndex + 1} - Extracted JSON (${jsonStr.length} chars): "${jsonStr.substring(0, 150)}${jsonStr.length > 150 ? '...' : ''}"`);
                            }
                            
                        try {
                            const data = JSON.parse(jsonStr);
                                eventCount++;
                                
                                if (eventCount <= 5) {
                                    console.log(`   📊 Slide ${slideIndex + 1} - Event ${eventCount}, keys:`, Object.keys(data));
                                    console.log(`   📊 Event ${eventCount} structure:`, {
                                        hasDelta: !!data.delta,
                                        hasContentBlockDelta: !!data.contentBlockDelta,
                                        deltaType: typeof data.delta,
                                        deltaKeys: data.delta ? Object.keys(data.delta) : null,
                                        deltaText: data.delta?.text ? `"${data.delta.text.substring(0, 30)}..."` : data.delta?.text,
                                        deltaTextType: typeof data.delta?.text,
                                        fullDelta: JSON.stringify(data.delta || {}).substring(0, 100),
                                        contentBlockDeltaKeys: data.contentBlockDelta ? Object.keys(data.contentBlockDelta) : null,
                                        fullDataSample: JSON.stringify(data).substring(0, 200)
                                    });
                                }
                                
                                // Extract text from delta events
                                // Bedrock Event Stream JSON format: {"contentBlockIndex":0,"delta":{"text":"..."}}
                                // OR: {"contentBlockDelta":{"delta":{"text":"..."},"contentBlockIndex":0}}
                                let text = null;
                                
                                // Try both possible structures
                                // Bedrock format: {"contentBlockIndex":0,"delta":{"text":"..."}}
                                if (data.delta && data.delta !== null && typeof data.delta === 'object' && 'text' in data.delta && data.delta.text) {
                                    // Direct delta structure: {"contentBlockIndex":0,"delta":{"text":"..."}}
                                    text = String(data.delta.text);
                                    if (eventCount <= 3) {
                                        console.log(`   ✅ Found text via data.delta.text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                                    }
                                } else if (data.contentBlockDelta?.delta?.text) {
                                    // Nested contentBlockDelta structure: {"contentBlockDelta":{"delta":{"text":"..."}}}
                                    text = String(data.contentBlockDelta.delta.text);
                                    if (eventCount <= 3) {
                                        console.log(`   ✅ Found text via data.contentBlockDelta.delta.text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                                    }
                                } else {
                                    // Debug why text wasn't found - log more details
                                    if (eventCount <= 5) {
                                        console.log(`   ⚠️ No text found for event ${eventCount}. Debug:`, {
                                            hasDelta: !!data.delta,
                                            deltaIsNull: data.delta === null,
                                            deltaIsObject: data.delta && typeof data.delta === 'object',
                                            deltaIsNotNullObject: data.delta !== null && typeof data.delta === 'object',
                                            hasTextProperty: data.delta && 'text' in data.delta,
                                            deltaValue: data.delta,
                                            deltaTextValue: data.delta?.text,
                                            deltaTextType: typeof data.delta?.text,
                                            deltaTextLength: data.delta?.text?.length,
                                            hasContentBlockDelta: !!data.contentBlockDelta,
                                            allKeys: Object.keys(data),
                                            fullDataSample: JSON.stringify(data)
                                        });
                                    }
                                }
                                
                                if (text) {
                                    streamedText += text;
                                    
                                    if (eventCount <= 3 || eventCount % 20 === 0) {
                                        console.log(`   ✅ Slide ${slideIndex + 1} - Extracted text (${text.length} chars): "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
                                        console.log(`   📊 Total streamed text so far: ${streamedText.length} chars`);
                                    }
                                    
                                    // Send raw_text to client for real-time feedback
                                    if (onProgress) {
                                        onProgress({
                                            type: 'raw_text',
                                            text: text,
                                            timestamp: Date.now(),
                                            slideIndex: slideIndex,
                                            currentSlide: slideIndex + 1,
                                            totalSlides: numSlides
                                        });
                                    }
                                    
                                    // Try to parse complete slide JSON incrementally
                                    if (streamedText.length > 50 && !slideData) {
                                        const jsonResult = extractCompleteJSONObject(streamedText);
                                        if (jsonResult && jsonResult.json) {
                                            try {
                                                slideData = JSON.parse(jsonResult.json);
                                                console.log(`✅ Slide ${slideIndex + 1} JSON parsed incrementally (${jsonResult.json.length} chars)`);
                                            } catch (e) {
                                                // JSON not complete yet, continue
                                            }
                                        }
                                    }
                                } else {
                                    if (eventCount <= 3) {
                                        console.log(`   ⏭️ Slide ${slideIndex + 1} - No text extracted from event ${eventCount}`);
                                    }
                                }
                                
                                // Move search start past this JSON object to look for next one
                                if (jsonEnd !== -1) {
                                    searchStart = jsonStart + jsonEnd + 1;
                                } else {
                                    searchStart = jsonStart + 1;
                                }
                                
                            } catch (parseError) {
                                if (eventCount <= 5 || chunkCount <= 3) {
                                    console.log(`   ⚠️ Slide ${slideIndex + 1} - Failed to parse extracted JSON: ${parseError.message}`);
                                    console.log(`   JSON string: "${jsonStr.substring(0, 200)}"`);
                                }
                                // Continue to next potential JSON
                                searchStart = jsonStart + 1;
                            }
                        } else {
                            // Incomplete JSON - might span chunks
                            if (chunkCount <= 3 && eventCount === 0) {
                                console.log(`   ⏭️ Slide ${slideIndex + 1} - Incomplete JSON detected, waiting for more chunks`);
                            }
                            break; // Wait for next chunk to complete this JSON
                        }
                    } else {
                        // No JSON found in this chunk
                        if (chunkCount <= 3) {
                            console.log(`   ⏭️ Slide ${slideIndex + 1} - No JSON objects found in chunk ${chunkCount}`);
                        }
                        break;
                    }
                }
                
                // After processing chunk, check if we have any text extracted
                if (streamedText.length > 0 && (chunkCount <= 5 || chunkCount % 10 === 0)) {
                    console.log(`   ✅ Slide ${slideIndex + 1} - After chunk ${chunkCount}: ${streamedText.length} chars accumulated`);
                }
                
                // Try incremental parsing after accumulating text
                if (streamedText.length > 50 && !slideData) {
                    const jsonResult = extractCompleteJSONObject(streamedText);
                    if (jsonResult && jsonResult.json) {
                        try {
                            slideData = JSON.parse(jsonResult.json);
                            console.log(`✅ Slide ${slideIndex + 1} JSON parsed incrementally (${jsonResult.json.length} chars)`);
                        } catch (e) {
                            // JSON not complete yet, continue
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
        
        // If incremental parsing didn't work, try full parsing
        if (!slideData) {
            console.log(`📊 Parsing slide ${slideIndex + 1} JSON from complete stream (${streamedText.length} chars)...`);
            console.log(`📊 Streamed text preview (first 500 chars): ${streamedText.substring(0, 500)}`);
                        }
                        
                        // Move search start past this JSON object to look for next one
                        if (jsonEnd !== -1) {
                            searchStart = jsonStart + jsonEnd + 1;
                        } else {
                            // Incomplete JSON, break and wait for more chunks
                break;
            }
                        // If jsonEnd === -1, the JSON is incomplete (spans chunks) - that's OK, we'll get the rest later
                    } catch (parseError) {
                        // Partial JSON or parsing failed - that's OK for streaming
                        // Only log for debugging on first few chunks
                        if (chunkCount <= 3 && eventCount === 0) {
                            console.log(`   ⚠️ Slide ${slideIndex + 1} - Failed to parse JSON (might be partial): ${parseError.message}`);
                            console.log(`   JSON candidate sample: "${jsonCandidate.substring(0, 200)}"`);
                        }
                        // Move search start to try next potential JSON
                        searchStart = jsonStart + 1;
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
        
        // If incremental parsing didn't work, try full parsing
        if (!slideData) {
            console.log(`📊 Parsing slide ${slideIndex + 1} JSON from complete stream (${streamedText.length} chars)...`);
            console.log(`📊 Streamed text preview (first 500 chars): ${streamedText.substring(0, 500)}`);
            
            // Try to extract complete JSON object
            const jsonResult = extractCompleteJSONObject(streamedText);
            if (!jsonResult || !jsonResult.json) {
                // Log more details for debugging
                console.error(`❌ Failed to extract JSON for slide ${slideIndex + 1}`);
                console.error(`   Streamed text length: ${streamedText.length}`);
                console.error(`   Contains '{': ${streamedText.includes('{')}`);
                console.error(`   Contains 'type': ${streamedText.includes('"type"') || streamedText.includes("'type'")}`);
                console.error(`   Contains 'title': ${streamedText.includes('"title"') || streamedText.includes("'title'")}`);
                console.error(`   First 200 chars: ${streamedText.substring(0, 200)}`);
                console.error(`   Last 200 chars: ${streamedText.substring(Math.max(0, streamedText.length - 200))}`);
                
                throw new Error(`No valid JSON found in response for slide ${slideIndex + 1}. Streamed ${streamedText.length} characters but couldn't extract valid JSON object.`);
            }
            
            try {
                slideData = JSON.parse(jsonResult.json);
                console.log(`✅ Slide ${slideIndex + 1} JSON parsed from complete stream (${jsonResult.json.length} chars)`);
            } catch (parseError) {
                console.error(`❌ Failed to parse extracted JSON for slide ${slideIndex + 1}:`, parseError.message);
                console.error(`   Extracted JSON preview (first 500 chars): ${jsonResult.json.substring(0, 500)}`);
                throw new Error(`Invalid JSON in response for slide ${slideIndex + 1}: ${parseError.message}`);
            }
        }
        
        // Extract theme from first slide if present
        if (slideIndex === 0 && slideData.designTheme) {
            designTheme = slideData.designTheme;
            console.log(`🎨 Theme extracted: ${designTheme.name}`);
            if (onTheme) {
                onTheme({ theme: designTheme, totalSlides: numSlides });
            }
        }
        
        // Add slide to previous slides array
        previousSlides.push(slideData);
        
        // Call progress callback
        if (onProgress) {
            onProgress({
                type: 'slide',
                slide: slideData,
                index: slideIndex,
                current: slideIndex + 1,
                total: numSlides
            });
        }
        
        console.log(`✅ Slide ${slideIndex + 1} generated: ${slideData.title || slideData.type}`);
    }
    
    return {
        slides: previousSlides,
        designTheme: designTheme || {
            name: 'Default Theme',
            description: 'Professional presentation theme',
            colorPrimary: '#667eea',
            colorSecondary: '#764ba2',
            colorAccent: '#F39C12',
            colorBackground: '#FFFFFF',
            colorText: '#1d1d1d'
        },
        totalSlides: previousSlides.length
    };
}

module.exports = {
    generateSequentialSlides
};

