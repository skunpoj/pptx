/**
 * Batch Slide Generator (OLD LOGIC)
 * 
 * Generates all slides in a single Bedrock API call using streaming.
 * Concatenates streaming text chunks and parses the complete JSON response.
 * 
 * This is the original approach where:
 * - One prompt generates all slides at once
 * - JSON is accumulated from streaming chunks
 * - Final parsing extracts all slides from the complete JSON
 */

const { getSlideDesignPrompt } = require('./promptManager');
const { parseAIResponse } = require('./helpers');

/**
 * Generate slides using batch Bedrock streaming (old approach)
 * @param {Object} options - Configuration options
 * @param {string} options.text - User content
 * @param {number} options.numSlides - Number of slides
 * @param {string} options.bedrockApiKey - Bedrock API key
 * @param {Object} options.res - Express response object for SSE
 * @param {Object} options.req - Express request object (for auth tracking)
 * @param {Function} options.updateUserTracking - Function to track user slides
 * @returns {Promise<void>}
 */
async function generateBatchSlides({ text, numSlides, bedrockApiKey, res, req, updateUserTracking }) {
    console.log(`🔄 Starting BATCH STREAMING slide generation (old logic)...`);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    
    // Send initial provider info to frontend
    res.write(`data: ${JSON.stringify({ 
        type: 'provider_info',
        provider: 'bedrock',
        method: 'batch', // Method 1: Batch generation
        numSlides: numSlides || 'AI decides',
        timestamp: Date.now()
    })}\n\n`);
    
    // Get the prompt
    const themePrompt = await getSlideDesignPrompt(text, numSlides);
    
    if (!bedrockApiKey) {
        throw new Error('Bedrock API key not found');
    }
    
    // Use TRUE STREAMING with /converse-stream
    console.log('📡 Using BATCH STREAMING for slide preview with Bedrock');
    
    const modelConfigs = [
        { id: 'claude-sonnet-4-5-20250929-v1:0', region: 'us-east-1' },
        { id: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0', region: 'us-east-1' },
        { id: 'amazon.nova-lite-v1:0', region: 'us-east-1' },
        { id: 'amazon.nova-pro-v1:0', region: 'us-east-1' }
    ];
    
    let bedrockResponse = null;
    let lastError = null;
    
    for (const config of modelConfigs) {
        try {
            console.log(`📤 SERVER: Trying Bedrock model: ${config.id} in ${config.region}`);
            
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
                        content: [{ text: themePrompt }]
                    }],
                    inferenceConfig: {
                        maxTokens: 16000
                    }
                })
            });
            
            if (bedrockResponse.ok) {
                console.log(`✅ SERVER: Success with model: ${config.id} in ${config.region}`);
                break;
            } else {
                const errorData = await bedrockResponse.json().catch(() => ({}));
                console.log(`❌ SERVER: Model ${config.id} (${config.region}) failed: ${errorData.error?.message || bedrockResponse.status}`);
                lastError = new Error(errorData.error?.message || `HTTP ${bedrockResponse.status}`);
                bedrockResponse = null;
                continue;
            }
        } catch (error) {
            console.log(`❌ SERVER: Error with ${config.id} (${config.region}): ${error.message}`);
            lastError = error;
            continue;
        }
    }
    
    if (!bedrockResponse || !bedrockResponse.ok) {
        throw lastError || new Error('All Bedrock models failed');
    }
    
    console.log('📨 SERVER: Bedrock response status:', bedrockResponse.status, bedrockResponse.statusText);
    
    if (!bedrockResponse.body) {
        throw new Error('Bedrock response body is null');
    }
    
    console.log('📖 SERVER: Getting reader from Bedrock response...');
    const reader = bedrockResponse.body.getReader();
    const decoder = new TextDecoder();
    
    let streamedText = '';
    let themeSent = false;
    let slidesSent = 0;
    
    console.log('📡 SERVER: Starting to read Bedrock stream...');
    
    try {
        let chunkCount = 0;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('✅ SERVER: Bedrock stream completed');
                break;
            }
            
            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            
            if (chunkCount <= 5 || chunkCount % 50 === 0) {
                console.log(`📦 SERVER: Chunk ${chunkCount}: ${chunk.length} bytes from Bedrock`);
            }
            
            // Extract JSON from Bedrock EventStream format
            const jsonStart = chunk.indexOf('{"contentBlockIndex"');
            if (jsonStart !== -1) {
                let braceCount = 0;
                let jsonEnd = -1;
                for (let i = jsonStart; i < chunk.length; i++) {
                    if (chunk[i] === '{') braceCount++;
                    if (chunk[i] === '}') braceCount--;
                    if (braceCount === 0) {
                        jsonEnd = i;
                        break;
                    }
                }
                
                if (jsonEnd !== -1) {
                    const jsonStr = chunk.substring(jsonStart, jsonEnd + 1);
                    try {
                        const data = JSON.parse(jsonStr);
                        console.log(`  📊 SERVER: Parsed Bedrock event, keys:`, Object.keys(data));
                    
                        if (data.delta?.text) {
                            const text = data.delta.text;
                            streamedText += text;
                            if (chunkCount <= 5 || chunkCount % 50 === 0) {
                                console.log(`  ✅ SERVER: Sending text: "${text}"`);
                            }
                            res.write(`data: ${JSON.stringify({ 
                                type: 'raw_text',
                                text: text,
                                timestamp: Date.now()
                            })}\n\n`);
                            if (res.flush) res.flush();
                        }
                    } catch (e) {
                        console.log(`  ⏭️ SERVER: Failed to parse JSON: ${e.message}`);
                    }
                }
            }
            
            // Incremental JSON parsing to extract slides as they become available
            // Parse periodically when we have enough content
            if (streamedText.length > 500 && streamedText.includes('"slides"')) {
                try {
                    // Helper function to extract complete JSON object with proper string handling
                    function extractCompleteJSONObject(text, startIndex = 0) {
                        const firstBrace = text.indexOf('{', startIndex);
                        if (firstBrace === -1) return null;
                        
                        let braceCount = 0;
                        let inString = false;
                        let escapeNext = false;
                        let inStringDelimiter = null; // Track whether we're in single or double quote
                        
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
                    
                    // Try to extract main presentation object
                    const jsonResult = extractCompleteJSONObject(streamedText);
                    
                    if (jsonResult && jsonResult.json) {
                        try {
                            const fullData = parseAIResponse(jsonResult.json);
                            
                            // Send theme if not sent yet
                            if (!themeSent && fullData.designTheme) {
                                console.log(`  🎨 SERVER: Theme extracted incrementally: ${fullData.designTheme.name}`);
                                res.write(`data: ${JSON.stringify({ 
                                    type: 'theme',
                                    theme: fullData.designTheme,
                                    suggestedThemeKey: fullData.suggestedThemeKey,
                                    totalSlides: fullData.slides?.length || 0
                                })}\n\n`);
                                if (res.flush) res.flush();
                                themeSent = true;
                            }
                            
                            // Extract and send new slides incrementally
                            if (fullData.slides && Array.isArray(fullData.slides)) {
                                // Check for new complete slides in the array
                                for (let i = slidesSent; i < fullData.slides.length; i++) {
                                    const slide = fullData.slides[i];
                                    
                                    // Only send if slide is valid and complete
                                    if (slide && (slide.title || slide.type)) {
                                        console.log(`  ✓ SERVER: Slide ${i + 1} extracted incrementally: ${slide.title || slide.type}`);
                                        
                                        res.write(`data: ${JSON.stringify({ 
                                            type: 'slide', 
                                            slide: slide,
                                            index: i,
                                            current: i + 1,
                                            total: fullData.slides.length
                                        })}\n\n`);
                                        if (res.flush) res.flush();
                                        slidesSent = i + 1;
                                    }
                                }
                            }
                        } catch (parseError) {
                            // JSON structure not complete yet, continue streaming
                            // This is expected during incremental parsing
                        }
                    }
                } catch (e) {
                    // JSON not complete yet, continue streaming
                    // This is expected - we're trying to parse incrementally
                }
            }
        }
        
        // Final parsing to ensure all slides are sent
        console.log('📊 SERVER: Final parsing to ensure all slides are sent...');
        
        try {
            let cleanedText = streamedText;
            let reconstructedJson = '';
            
            const themeStart = cleanedText.indexOf('"designTheme"');
            const slidesStart = cleanedText.indexOf('"slides"');
            
            if (themeStart !== -1 && slidesStart !== -1) {
                const mainObjectStart = cleanedText.lastIndexOf('{', Math.min(themeStart, slidesStart));
                
                if (mainObjectStart !== -1) {
                    let potentialEnd = cleanedText.lastIndexOf('}');
                    
                    while (potentialEnd > mainObjectStart) {
                        const testJson = cleanedText.substring(mainObjectStart, potentialEnd + 1);
                        
                        try {
                            const testData = JSON.parse(testJson);
                            if (testData.designTheme && testData.slides) {
                                reconstructedJson = testJson;
                                console.log(`📊 SERVER: Successfully reconstructed JSON (${reconstructedJson.length} chars)`);
                                break;
                            }
                        } catch (e) {
                            // Not valid JSON, try shorter
                        }
                        
                        potentialEnd = cleanedText.lastIndexOf('}', potentialEnd - 1);
                    }
                }
            }
            
            if (!reconstructedJson) {
                // Fallback cleaning
                let cleanedFallback = cleanedText
                    .replace(/gestedThemeKey/g, 'suggestedThemeKey')
                    .replace(/"designTh\s+/g, '"designTheme": ')
                    .replace(/"colorPrimary":\s*"#1C2833",\s*"colorPrimary":\s*"#1C2833"/g, '"colorPrimary": "#1C2833"')
                    .replace(/,\s*,/g, ',')
                    .replace(/,\s*}/g, '}')
                    .replace(/,\s*]/g, ']')
                    .replace(/^[^{]*/, '')
                    .replace(/[^}]*$/, '');
                
                if (!cleanedFallback.startsWith('{') || !cleanedFallback.endsWith('}')) {
                    const firstBrace = cleanedFallback.indexOf('{');
                    const lastBrace = cleanedFallback.lastIndexOf('}');
                    
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        cleanedFallback = cleanedFallback.substring(firstBrace, lastBrace + 1);
                    }
                }
                
                reconstructedJson = cleanedFallback;
            }
            
            const fullData = parseAIResponse(reconstructedJson);
            console.log(`📊 SERVER: Final parse successful, slides: ${fullData.slides?.length || 0}`);
            
            // Send remaining slides
            if (fullData.slides && fullData.slides.length > slidesSent) {
                const remainingSlides = fullData.slides.length - slidesSent;
                console.log(`  📤 SERVER: Sending final ${remainingSlides} slides...`);
                
                for (let i = slidesSent; i < fullData.slides.length; i++) {
                    const slide = fullData.slides[i];
                    console.log(`  ✓ SERVER: Final slide ${i + 1}: ${slide.title}`);
                    
                    res.write(`data: ${JSON.stringify({ 
                        type: 'slide', 
                        slide: slide,
                        index: i,
                        current: i + 1,
                        total: fullData.slides.length
                    })}\n\n`);
                    if (res.flush) res.flush();
                }
            }
            
            // Send completion
            console.log(`✅ SERVER: All ${fullData.slides.length} slides sent via BATCH STREAMING`);
            res.write(`data: ${JSON.stringify({ type: 'complete', data: fullData })}\n\n`);
            
            // Track slide generation for authenticated users
            if (req.oidc && req.oidc.isAuthenticated() && req.oidc.user) {
                try {
                    const userId = req.oidc.user.sub || req.oidc.user.email;
                    await updateUserTracking(userId, fullData.slides.length);
                } catch (error) {
                    console.error('Failed to track slide generation:', error);
                }
            }
            
            res.write('data: [DONE]\n\n');
            res.end();
            
        } catch (e) {
            console.error(`❌ SERVER: Failed to parse final JSON: ${e.message}`);
            throw e;
        }
        
    } catch (streamError) {
        console.error('❌ Stream error:', streamError);
        throw streamError;
    }
}

module.exports = { generateBatchSlides };

