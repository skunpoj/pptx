// Content generation routes
const express = require('express');
const router = express.Router();
const { callAI } = require('../utils/ai');

// Content generation endpoint with streaming support
router.post('/generate-content', async (req, res) => {
    const { prompt, apiKey, provider = 'anthropic', numSlides = 6, generateImages = false, stream = false } = req.body;
    
    if (!prompt || !apiKey) {
        return res.status(400).json({ error: 'Prompt and API key are required' });
    }
    
    try {
        const imageInstructions = generateImages 
            ? `\n7. For slides that would benefit from visuals, include image placeholders like: [IMAGE: description of what image should show]\n8. Suggest relevant images for data visualization, concepts, or key points`
            : '';
        
        const userPrompt = `You are a professional content writer for presentations. Based on the following idea/prompt, generate comprehensive content that can be used to create a presentation with EXACTLY ${numSlides} slides (including the title slide).

USER PROMPT:
${prompt}

INSTRUCTIONS:
1. Generate content for EXACTLY ${numSlides} slides (including title slide)
2. Create ${numSlides - 1} distinct topic sections/paragraphs for content slides
3. Each paragraph should cover a key aspect or topic that will become a slide
4. Write in a clear, professional, consultant-style presentation format
5. Include specific details, examples, data points, and actionable insights
6. Make the content strategic, analytical, and business-focused
${imageInstructions}
7. Structure content with clear frameworks, models, or methodologies where appropriate
8. Include comparative analysis, pros/cons, or before/after scenarios when relevant

OUTPUT FORMAT:
Write the content as ${numSlides - 1} well-structured paragraphs separated by blank lines. Each paragraph should be substantial enough to create a full slide. Do NOT include any JSON, markdown formatting, or structural elements. Just write the presentation content directly.

Generate the content now:`;

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

