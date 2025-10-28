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

        // For streaming, use provider's streaming API (Bedrock or Anthropic)
        if (stream && (provider === 'anthropic' || provider === 'bedrock')) {
            console.log('═══════════════════════════════════════════════════');
            console.log('📡 SERVER: Setting up streaming response');
            console.log('  Provider:', provider);
            console.log('  Stream mode: TRUE');
            console.log('  Prompt length:', userPrompt.length, 'characters');
            console.log('═══════════════════════════════════════════════════');
            
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Critical! Disable nginx buffering
            
            if (provider === 'anthropic') {
                console.log('📤 SERVER: Calling Anthropic API with streaming...');
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
            
                console.log('📨 SERVER: Anthropic response status:', response.status, response.statusText);

                if (!response.ok) {
                    console.error('❌ SERVER: Anthropic API error:', response.status);
                    const errorData = await response.json().catch(() => ({}));
                    console.error('❌ SERVER: Error details:', errorData);
                    throw new Error(errorData.error?.message || `API Error: ${response.status}`);
                }

                if (!response.body) {
                    console.error('❌ SERVER: Anthropic response body is null!');
                    throw new Error('Anthropic response body is null');
                }

                console.log('📖 SERVER: Getting reader from Anthropic response...');
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                try {
                    console.log('📡 SERVER: Starting to read Anthropic stream...');
                    
                    let chunkCount = 0;
                    let eventCount = 0;
                    let totalBytes = 0;
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            console.log('═══════════════════════════════════════════════════');
                            console.log('✅ SERVER: Anthropic stream complete');
                            console.log('  Total chunks:', chunkCount);
                            console.log('  Total events sent:', eventCount);
                            console.log('  Total bytes:', totalBytes);
                            console.log('═══════════════════════════════════════════════════');
                            break;
                        }

                        chunkCount++;
                        const chunk = decoder.decode(value, { stream: true });
                        totalBytes += chunk.length;
                        console.log(`📦 SERVER: Chunk ${chunkCount}: ${chunk.length} bytes from Anthropic`);
                        
                        const lines = chunk.split('\n');

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.slice(6);
                                if (data === '[DONE]') {
                                    console.log('✅ SERVER: Received [DONE] from Anthropic');
                                    continue;
                                }
                                
                                try {
                                    const parsed = JSON.parse(data);
                                    console.log(`  📊 SERVER: Parsed Anthropic event, type:`, parsed.type);
                                    
                                    if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                        eventCount++;
                                        const textToSend = parsed.delta.text;
                                        console.log(`  📤 SERVER: Sending text to client (event ${eventCount}): "${textToSend.substring(0, 30)}${textToSend.length > 30 ? '...' : ''}"`);
                                        
                                        res.write(`data: ${JSON.stringify({ text: textToSend })}\n\n`);
                                        
                                        // CRITICAL: Flush after each write to prevent buffering!
                                        if (res.flush) {
                                            res.flush();
                                            console.log('  ✅ SERVER: Flushed to client');
                                        }
                                    } else {
                                        console.log(`  ⏭️ SERVER: Skipping non-text event, type:`, parsed.type);
                                    }
                                } catch (e) {
                                    console.error('  ❌ SERVER: Failed to parse Anthropic event:', e.message);
                                }
                            }
                        }
                    }
                } catch (streamError) {
                    console.error('❌ SERVER: Stream error:', streamError);
                    throw streamError;
                } finally {
                    console.log('📤 SERVER: Sending [DONE] marker to client');
                    res.write('data: [DONE]\n\n');
                    res.end();
                    console.log('✅ SERVER: Stream closed');
                }
            } else if (provider === 'bedrock') {
                // BEDROCK STREAMING using Converse API
                console.log('📤 SERVER: Calling Bedrock API with streaming...');
                
                const bedrockApiKey = apiKey || process.env.bedrock;
                if (!bedrockApiKey) {
                    throw new Error('Bedrock API key not found');
                }
                
                // Try models in order of preference
                const modelIds = [
                    'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                    'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
                    'amazon.nova-lite-v1:0',
                    'amazon.nova-pro-v1:0'
                ];
                
                let response = null;
                let lastError = null;
                
                for (const modelId of modelIds) {
                    try {
                        console.log(`📤 SERVER: Trying Bedrock model: ${modelId}`);
                        
                        response = await fetch(`https://bedrock-runtime.us-east-1.amazonaws.com/model/${modelId}/converse-stream`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${bedrockApiKey.trim()}`
                            },
                            body: JSON.stringify({
                                messages: [{
                                    role: "user",
                                    content: [{ text: userPrompt }]
                                }],
                                inferenceConfig: {
                                    maxTokens: 4000
                                }
                            })
                        });
                        
                        if (response.ok) {
                            console.log(`✅ SERVER: Success with model: ${modelId}`);
                            break;
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            console.log(`❌ SERVER: Model ${modelId} failed: ${errorData.error?.message || response.status}`);
                            lastError = new Error(errorData.error?.message || `HTTP ${response.status}`);
                            response = null;
                            continue;
                        }
                    } catch (error) {
                        console.log(`❌ SERVER: Error with ${modelId}: ${error.message}`);
                        lastError = error;
                        continue;
                    }
                }
                
                if (!response || !response.ok) {
                    throw lastError || new Error('All Bedrock models failed');
                }
                
                console.log('📨 SERVER: Bedrock response status:', response.status, response.statusText);
                
                if (!response.body) {
                    throw new Error('Bedrock response body is null');
                }
                
                console.log('📖 SERVER: Getting reader from Bedrock response...');
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                try {
                    console.log('📡 SERVER: Starting to read Bedrock stream...');
                    
                    let chunkCount = 0;
                    let eventCount = 0;
                    let totalBytes = 0;
                    
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            console.log('═══════════════════════════════════════════════════');
                            console.log('✅ SERVER: Bedrock stream complete');
                            console.log('  Total chunks:', chunkCount);
                            console.log('  Total events sent:', eventCount);
                            console.log('  Total bytes:', totalBytes);
                            console.log('═══════════════════════════════════════════════════');
                            break;
                        }
                        
                        chunkCount++;
                        const chunk = decoder.decode(value, { stream: true });
                        totalBytes += chunk.length;
                        console.log(`📦 SERVER: Chunk ${chunkCount}: ${chunk.length} bytes from Bedrock`);
                        console.log(`  📄 Raw chunk sample: "${chunk.substring(0, 100)}..."`);
                        
                        // Bedrock returns JSON Lines format (one JSON object per line)
                        const lines = chunk.split('\n').filter(line => line.trim());
                        
                        for (const line of lines) {
                            try {
                                const data = JSON.parse(line);
                                console.log(`  📊 SERVER: Parsed Bedrock line, keys:`, Object.keys(data));
                                
                                if (data.contentBlockDelta?.delta?.text) {
                                    const textToSend = data.contentBlockDelta.delta.text;
                                    eventCount++;
                                    console.log(`  📤 SERVER: Sending text to client (event ${eventCount}): "${textToSend.substring(0, 30)}${textToSend.length > 30 ? '...' : ''}"`);
                                    
                                    res.write(`data: ${JSON.stringify({ text: textToSend })}\n\n`);
                                    
                                    if (res.flush) {
                                        res.flush();
                                        console.log('  ✅ SERVER: Flushed to client');
                                    }
                                } else {
                                    console.log(`  ⏭️ SERVER: Skipping non-text event`);
                                }
                            } catch (parseError) {
                                console.error('  ❌ SERVER: Failed to parse Bedrock line:', parseError.message);
                                console.error('  Line sample:', line.substring(0, 200));
                            }
                        }
                    }
                } catch (streamError) {
                    console.error('❌ SERVER: Stream error:', streamError);
                    throw streamError;
                } finally {
                    console.log('📤 SERVER: Sending [DONE] marker to client');
                    res.write('data: [DONE]\n\n');
                    res.end();
                    console.log('✅ SERVER: Stream closed');
                }
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

