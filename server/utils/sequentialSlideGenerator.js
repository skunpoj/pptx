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
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log(`✅ Stream completed for slide ${slideIndex + 1}`);
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                
                // Bedrock ConverseStream returns JSON Lines format (one JSON object per line)
                // Parse each line separately
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        
                        // Extract text from contentBlockDelta events
                        if (data.contentBlockDelta?.delta?.text) {
                            const text = data.contentBlockDelta.delta.text;
                            streamedText += text;
                            
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
                        }
                    } catch (e) {
                        // Ignore parse errors - might be partial JSON or non-JSON lines (headers, etc.)
                        // This is expected in streaming responses
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

