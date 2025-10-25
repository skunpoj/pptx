// Content generation routes
const express = require('express');
const router = express.Router();
const { callAI } = require('../utils/ai');
const { getContentGenerationPrompt } = require('../utils/promptManager');

// Content generation endpoint with streaming support
router.post('/generate-content', async (req, res) => {
    const { prompt, apiKey, provider = 'anthropic', numSlides = 6, generateImages = false, stream = false } = req.body;
    
    if (!prompt || !apiKey) {
        return res.status(400).json({ error: 'Prompt and API key are required' });
    }
    
    try {
        // Get prompt from config/prompts.json (no hardcoding!)
        const userPrompt = await getContentGenerationPrompt(prompt, numSlides, generateImages);

        // For streaming, use Anthropic's streaming API
        if (stream && provider === 'anthropic') {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
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
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
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

