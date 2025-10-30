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
        
        // Read complete stream response
        const reader = bedrockResponse.body.getReader();
        const decoder = new TextDecoder();
        let streamedText = '';
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    console.log(`✅ Stream completed for slide ${slideIndex + 1}`);
                    break;
                }
                
                const chunk = decoder.decode(value, { stream: true });
                
                // Extract text from Bedrock EventStream format
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
                            if (data.delta?.text) {
                                streamedText += data.delta.text;
                            }
                        } catch (e) {
                            // Ignore parse errors for individual chunks
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
        
        // Parse complete slide JSON
        console.log(`📊 Parsing slide ${slideIndex + 1} JSON (${streamedText.length} chars)...`);
        
        // Clean up streamed text
        let cleanedText = streamedText;
        
        // Try to extract valid JSON
        const jsonStart = cleanedText.indexOf('{');
        if (jsonStart === -1) {
            throw new Error(`No JSON found in response for slide ${slideIndex + 1}`);
        }
        
        // Find the end of the JSON object
        let braceCount = 0;
        let jsonEnd = -1;
        for (let i = jsonStart; i < cleanedText.length; i++) {
            if (cleanedText[i] === '{') braceCount++;
            if (cleanedText[i] === '}') braceCount--;
            if (braceCount === 0) {
                jsonEnd = i;
                break;
            }
        }
        
        if (jsonEnd === -1) {
            throw new Error(`Incomplete JSON for slide ${slideIndex + 1}`);
        }
        
        const jsonStr = cleanedText.substring(jsonStart, jsonEnd + 1);
        const slideData = JSON.parse(jsonStr);
        
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

