// Content generation routes
const express = require('express');
const router = express.Router();
const { callAI } = require('../utils/ai');
const { getContentGenerationPrompt } = require('../utils/promptManager');

// Content generation endpoint with streaming support
router.post('/generate-content', async (req, res) => {
    // Extract parameters from both JSON body and FormData (for file uploads)
    const { prompt, apiKey, provider = 'anthropic', numSlides = 6, generateImages = false, 
            extractColors = false, useAsTemplate = false, stream = false } = req.body;
    
    console.log('📝 Content generation request received');
    console.log('  Options:', { 
        numSlides, 
        generateImages, 
        extractColors, 
        useAsTemplate, 
        stream, 
        provider,
        hasFiles: !!req.files
    });
    
    if (!prompt || !apiKey) {
        return res.status(400).json({ error: 'Prompt and API key are required' });
    }
    
    try {
        // Get prompt from config/prompts.json - pass ALL options including checkboxes
        const userPrompt = await getContentGenerationPrompt(prompt, numSlides, generateImages, {
            extractColors,
            useAsTemplate
        });
        
        console.log('✅ Generated prompt with all user selections applied');

        // For streaming, use Anthropic's streaming API
        if (stream && provider === 'anthropic') {
            console.log('📡 Setting up streaming response for content generation');
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Critical! Disable nginx buffering
            
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey.trim(),
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 4000,
                    stream: true,
                    messages: [{
                        role: "user",
                        content: userPrompt
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            try {
                console.log('📡 Starting Anthropic streaming for content generation...');
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log('✅ Anthropic stream complete');
                        break;
                    }

                    const chunk = decoder.decode(value);
                    console.log(`📦 Received ${chunk.length} bytes from Anthropic`);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
                                    
                                    // CRITICAL: Flush after each write to prevent buffering!
                                    if (res.flush) res.flush();
                                }
                            } catch (e) {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
            } finally {
                res.write('data: [DONE]\n\n');
                res.end();
            }
        } else {
            // Non-streaming fallback
            const content = await callAI(provider, apiKey, userPrompt);
            res.json({ content });
        }
        
    } catch (error) {
        console.error('Content generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

module.exports = router;

