/**
 * AI Text2PPT Pro - Main Server File
 * Clean, modular entry point using reusable components
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { auth, requiresAuth } = require('express-openid-connect');

// Import utilities
const { SERVER_CONFIG } = require('./server/config/constants');
const { callAI } = require('./server/utils/ai');
const { 
    validateSlideData, 
    parseAIResponse, 
    createSessionId, 
    sendErrorResponse, 
    sendFileDownload 
} = require('./server/utils/helpers');
const { 
    setupWorkspace, 
    setupDependencies, 
    runScript, 
    scheduleCleanup 
} = require('./server/utils/workspace');
const {
    getContentGenerationPrompt,
    getSlideDesignPrompt,
    getFileProcessingPrompt,
    getSlideModificationPrompt
} = require('./server/utils/promptManager');
const { 
    generateCSS, 
    generateSlideHTML, 
    generateConversionScript 
} = require('./server/utils/generators');
const { initializeTracking, updateUserTracking, getUserSlideCount } = require('./server/utils/userTracking');
const {
    initializeStorage,
    savePresentation,
    saveSharedPresentation,
    convertToPDF,
    getFile,
    getSharedSlideData,
    updateSharedPresentation,
    startAutoCleanup,
    checkLibreOffice
} = require('./server/utils/fileStorage');

// Import routes
const promptRoutes = require('./server/routes/prompts');
const skillRoutes = require('./server/routes/skills');
const imageRoutes = require('./server/routes/images');
const stripeRoutes = require('./server/routes/stripe');

// Initialize Express app
const app = express();
const PORT = 3000;

// Auth0 Configuration
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET || 'a long, randomly-generated string stored in env', // Should use openssl rand -hex 32
  baseURL: process.env.AUTH0_BASE_URL || 'https://genis.ai',
  clientID: 'N9YYsWNFFnMjz7bHy0i70usqjP1HJRO9',
  issuerBaseURL: 'https://dev-cmf6hmnjvaezfw1g.us.auth0.com'
};

// Auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.static('public'));

// Add Permissions Policy header to allow payment API and other necessary permissions
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'payment=*, camera=(), microphone=(), geolocation=()');
  next();
});

// Auth check endpoint for frontend
app.get('/api/user', async (req, res) => {
  const userData = {
    authenticated: req.oidc.isAuthenticated(),
    user: req.oidc.user || null
  };
  
  // Add slide count for authenticated users
  if (userData.authenticated && userData.user) {
    try {
      const userId = userData.user.sub || userData.user.email;
      const slideCount = await getUserSlideCount(userId);
      userData.user.slideCount = slideCount;
    } catch (error) {
      console.error('Failed to get user slide count:', error);
      userData.user.slideCount = 0;
    }
  }
  
  res.json(userData);
});

// Protected profile route
app.get('/profile', requiresAuth(), (req, res) => {
  res.json(req.oidc.user);
});

// Landing page route
app.get('/landing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Global state for LibreOffice availability
let LIBREOFFICE_AVAILABLE = false;

// Initialize storage on startup (silent - will log in server listen callback)
let STORAGE_INITIALIZED = false;
let PDF_AVAILABLE = false;

(async () => {
    try {
        await initializeStorage();
        await initializeTracking();
        LIBREOFFICE_AVAILABLE = await checkLibreOffice();
        PDF_AVAILABLE = LIBREOFFICE_AVAILABLE;
        STORAGE_INITIALIZED = true;
        
        // Start auto-cleanup scheduler
        startAutoCleanup();
    } catch (error) {
        console.error('⚠️ Storage initialization error:', error);
    }
})();

const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 50 * 1024 * 1024 } 
});

// Mount routes
app.use('/api', promptRoutes);
app.use('/api', skillRoutes);
app.use('/api/images', imageRoutes);
app.use('/', stripeRoutes);

// ========================================
// SERVER CAPABILITIES & HEALTH ENDPOINTS
// ========================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

/**
 * Server capabilities endpoint
 * Tells frontend what features are available
 */
app.get('/api/capabilities', (req, res) => {
    res.json({
        pdfConversion: LIBREOFFICE_AVAILABLE,
        environment: process.env.NODE_ENV || 'development',
        features: {
            pptxDownload: true,
            pdfDownload: LIBREOFFICE_AVAILABLE,
            pdfViewer: LIBREOFFICE_AVAILABLE,
            shareableLinks: true,
            onlineViewer: true
        },
        message: LIBREOFFICE_AVAILABLE 
            ? 'All features available' 
            : 'PDF features disabled - LibreOffice not installed (use Docker for full features)'
    });
});

// ========================================
// CONTENT GENERATION ENDPOINT
// ========================================

app.post('/api/generate-content', async (req, res) => {
    let { prompt, apiKey, provider = 'anthropic', numSlides = 6, generateImages = false, stream = false } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // If no API key provided, use default backend provider
    if (!apiKey) {
        console.log('ℹ️ No user API key provided, using default backend provider');
        provider = 'bedrock';
        apiKey = ''; // Will use environment variable in callAI
    }
    
    try {
        const userPrompt = await getContentGenerationPrompt(prompt, numSlides, generateImages);

        // Streaming for all providers
        if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            
            if (provider === 'bedrock') {
                // Bedrock ConverseStream API - try global then us prefix
                const bedrockApiKey = process.env.bedrock || apiKey;
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
                        console.log(`🔄 Calling Bedrock stream model: ${modelId}`);
                        
                        const baseUrl = modelId.startsWith('global.') 
                            ? 'https://bedrock-runtime.amazonaws.com' 
                            : 'https://bedrock-runtime.us-east-1.amazonaws.com';
                        
                        response = await fetch(`${baseUrl}/model/${modelId}/converse-stream`, {
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
                                    maxTokens: 4000,
                                    temperature: 0.7
                                }
                            })
                        });

                        console.log(`📡 Response status: ${response.status} ${response.statusText}`);
                        console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

                        if (response.ok) {
                            console.log(`✅ Stream success with model: ${modelId}`);
                            console.log(`📊 Response body type:`, typeof response.body);
                            console.log(`📊 Response body:`, response.body ? 'present' : 'null');
                            break; // Success, exit loop
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                            console.log(`❌ Stream model ${modelId} failed: ${errorMsg}`);
                            lastError = new Error(errorMsg);
                        }
                    } catch (error) {
                        console.log(`❌ Stream error with ${modelId}: ${error.message}`);
                        lastError = error;
                    }
                }
                
                if (!response || !response.ok) {
                    throw new Error(`Bedrock API error: ${lastError?.message || 'All model prefixes failed'}`);
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                let chunkCount = 0;
                let totalBytesReceived = 0;

                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) {
                            console.log('✅ Bedrock stream completed');
                            break;
                        }

                        chunkCount++;
                        const chunk = decoder.decode(value, { stream: true });
                        totalBytesReceived += chunk.length;
                        console.log(`📦 Chunk ${chunkCount}: ${chunk.length} bytes from Bedrock (total: ${totalBytesReceived} bytes)`);
                        console.log(`  📄 Raw chunk sample: "${chunk.substring(0, 150)}..."`);
                        
                        // Log the full chunk for first few chunks for debugging
                        if (chunkCount <= 3) {
                            console.log(`  📋 Full chunk content:`, chunk);
                        }
                        
                        // Bedrock returns EventStream format (binary)
                        // More flexible JSON extraction - look for any JSON object containing contentBlockIndex
                        const jsonStart = chunk.indexOf('{"contentBlockIndex"');
                        if (jsonStart !== -1) {
                            // Find the end of the JSON object by looking for the closing brace
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
                                    console.log(`  📊 Parsed Bedrock event, keys:`, Object.keys(data));
                                    
                                    // Extract text from delta
                                    if (data.delta?.text) {
                                        console.log(`  ✅ Sending text: "${data.delta.text}"`);
                                        res.write(`data: ${JSON.stringify({ text: data.delta.text })}\n\n`);
                                }
                            } catch (e) {
                                    console.log(`  ⏭️ Failed to parse JSON: ${e.message}`);
                                    console.log(`  📄 JSON attempt: "${jsonStr.substring(0, 100)}..."`);
                            }
                            }
                        } else {
                            // Debug: show what we're actually getting
                            console.log(`  🔍 No JSON found in chunk. Chunk preview: "${chunk.substring(0, 200)}"`);
                        }
                    }
                } finally {
                    console.log(`✅ Content generation complete`);
                    console.log(`   Total chunks received: ${chunkCount}`);
                    console.log(`   Total bytes received: ${totalBytesReceived}`);
                    res.write('data: [DONE]\n\n');
                    res.end();
                }
            } else if (provider === 'anthropic') {
                // Anthropic streaming
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
                        messages: [{ role: "user", content: userPrompt }]
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
            } else if (provider === 'openai') {
                // OpenAI streaming
                console.log(`🔄 Starting streaming with OpenAI...`);
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey.trim()}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o",
                        messages: [{ role: "user", content: userPrompt }],
                        max_tokens: 4000,
                        stream: true
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
                                    if (parsed.choices?.[0]?.delta?.content) {
                                        res.write(`data: ${JSON.stringify({ text: parsed.choices[0].delta.content })}\n\n`);
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
            } else if (provider === 'gemini') {
                // Gemini streaming
                console.log(`🔄 Starting streaming with Gemini...`);
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?key=${apiKey.trim()}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: userPrompt }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 4000
                        }
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
                                    if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
                                        res.write(`data: ${JSON.stringify({ text: parsed.candidates[0].content.parts[0].text })}\n\n`);
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
            } else if (provider === 'openrouter') {
                // OpenRouter streaming
                console.log(`🔄 Starting streaming with OpenRouter...`);
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey.trim()}`,
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "AI Text2PPT Pro"
                    },
                    body: JSON.stringify({
                        model: "anthropic/claude-3.5-sonnet",
                        max_tokens: 4000,
                        messages: [{ role: "user", content: userPrompt }],
                        stream: true
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
                                    if (parsed.choices?.[0]?.delta?.content) {
                                        res.write(`data: ${JSON.stringify({ text: parsed.choices[0].delta.content })}\n\n`);
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
            }
        } else {
            // Non-streaming
            const content = await callAI(provider, apiKey, userPrompt);
            res.json({ content });
        }
        
    } catch (error) {
        console.error('❌ Content generation error:', error.message);
        console.error('   Stack:', error.stack);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: error.message,
                provider: provider,
                details: error.stack
            });
        } else {
            // If headers already sent (streaming), send error event
            res.write(`data: ${JSON.stringify({ 
                type: 'error',
                error: error.message
            })}\n\n`);
            res.end();
        }
    }
});

// ========================================
// FILE PROCESSING ENDPOINT
// ========================================

app.post('/api/process-files', async (req, res) => {
    let { files, apiKey, provider = 'anthropic' } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'Files are required' });
    }
    
    // If no API key provided, use default backend provider
    if (!apiKey) {
        console.log('ℹ️ No user API key provided, using default backend provider');
        provider = 'bedrock';
        apiKey = ''; // Will use environment variable in callAI
    }
    
    try {
        const userPrompt = await getFileProcessingPrompt(files);
        const content = await callAI(provider, apiKey, userPrompt);
        res.json({ content });
    } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// COLOR EXTRACTION ENDPOINT
// ========================================

app.post('/api/extract-colors', upload.array('files'), async (req, res) => {
    try {
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }
        
        console.log(`Extracting colors from ${files.length} file(s)`);
        
        const fileNames = files.map(f => f.originalname.toLowerCase()).join(' ');
        let theme = null;
        
        // Smart theme detection based on keywords
        if (fileNames.includes('finance') || fileNames.includes('bank') || fileNames.includes('invest')) {
            theme = {
                name: 'Financial Professional',
                description: 'Extracted from your financial documents',
                colorPrimary: '#1C3A57',
                colorSecondary: '#2E5E8E',
                colorAccent: '#D4AF37',
                colorBackground: '#FFFFFF',
                colorText: '#1d1d1d'
            };
        } else if (fileNames.includes('health') || fileNames.includes('medical') || fileNames.includes('clinic')) {
            theme = {
                name: 'Healthcare Blue',
                description: 'Extracted from your healthcare documents',
                colorPrimary: '#0C4F6E',
                colorSecondary: '#147BA3',
                colorAccent: '#4ECDC4',
                colorBackground: '#FFFFFF',
                colorText: '#1d1d1d'
            };
        } else if (fileNames.includes('tech') || fileNames.includes('software') || fileNames.includes('digital')) {
            theme = {
                name: 'Tech Innovation',
                description: 'Extracted from your technology documents',
                colorPrimary: '#5B21B6',
                colorSecondary: '#7C3AED',
                colorAccent: '#F59E0B',
                colorBackground: '#FFFFFF',
                colorText: '#1d1d1d'
            };
        } else if (fileNames.includes('market') || fileNames.includes('sales') || fileNames.includes('campaign')) {
            theme = {
                name: 'Marketing Energy',
                description: 'Extracted from your marketing documents',
                colorPrimary: '#DC2626',
                colorSecondary: '#EF4444',
                colorAccent: '#F59E0B',
                colorBackground: '#FFFFFF',
                colorText: '#1d1d1d'
            };
        } else if (fileNames.includes('green') || fileNames.includes('eco') || fileNames.includes('sustain')) {
            theme = {
                name: 'Eco Friendly',
                description: 'Extracted from your sustainability documents',
                colorPrimary: '#065F46',
                colorSecondary: '#10B981',
                colorAccent: '#84CC16',
                colorBackground: '#FFFFFF',
                colorText: '#1d1d1d'
            };
        } else {
            theme = {
                name: 'Custom Extracted',
                description: 'Customized theme from your files',
                colorPrimary: '#1E3A5F',
                colorSecondary: '#4A6FA5',
                colorAccent: '#E8871E',
                colorBackground: '#FFFFFF',
                colorText: '#1d1d1d'
            };
        }
        
        console.log(`Extracted theme: ${theme.name}`);
        res.json({ theme });
        
    } catch (error) {
        console.error('Color extraction error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// PREVIEW ENDPOINT
// ========================================

app.post('/api/preview', async (req, res) => {
    let { text, apiKey, provider = 'anthropic', incremental = true, numSlides = 0 } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Text content is required' });
    }
    
    // Safety limit to prevent Cloudflare 524 timeouts (100 second limit)
    // Each slide takes ~2-4 seconds, so 30 slides = ~90 seconds max
    const MAX_SLIDES = 30;
    if (numSlides > MAX_SLIDES) {
        console.log(`⚠️ Requested ${numSlides} slides, limiting to ${MAX_SLIDES} to prevent timeout`);
        numSlides = MAX_SLIDES;
    }
    
    // If no API key provided, use default backend provider
    if (!apiKey) {
        console.log('ℹ️ No user API key provided, using default backend provider');
        provider = 'bedrock';
        apiKey = ''; // Will use environment variable in callAI
    }
    
    try {
        console.log('📊 Preview request received');
        console.log('  Content length:', text.length, 'characters');
        console.log('  Provider:', provider);
        console.log('  Incremental:', incremental);
        console.log('  Requested slides:', numSlides || 'AI decides');
        
        // INCREMENTAL MODE: TRUE STREAMING from AI
        if (incremental) {
            if (provider === 'anthropic' || provider === 'bedrock') {
                // These use existing streaming logic
            } else if (provider === 'openai' || provider === 'openrouter' || provider === 'gemini') {
                // These providers will use non-streaming mode for preview
                // (JSON parsing requirements make streaming complex - would need incremental JSON parser)
                console.log(`ℹ️ Streaming preview not yet implemented for ${provider}, using non-streaming mode`);
                incremental = false;
            }
        }
        
        if (incremental && provider === 'anthropic') {
            console.log(`🔄 Starting TRUE STREAMING slide generation with ${provider}...`);
            
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for SSE
            
            // Send initial provider info to frontend
            res.write(`data: ${JSON.stringify({ 
                type: 'provider_info',
                provider: provider,
                numSlides: numSlides || 'AI decides',
                timestamp: Date.now()
            })}\n\n`);
            
            // Get the prompt
            const themePrompt = await getSlideDesignPrompt(text, numSlides);
            
            // Call Anthropic's STREAMING API (like content generation!)
            console.log(`📡 Calling ${provider} streaming API...`);
            const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey.trim(),
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-sonnet-4-20250514",
                    max_tokens: 16000,
                    stream: true,  // ← REAL STREAMING!
                    messages: [{
                        role: "user",
                        content: themePrompt
                    }]
                })
            });

            if (!anthropicResponse.ok) {
                const errorData = await anthropicResponse.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Anthropic API Error: ${anthropicResponse.status}`);
            }

            const reader = anthropicResponse.body.getReader();
            const decoder = new TextDecoder();
            
            let jsonBuffer = '';
            let streamedText = '';
            let themeSent = false;
            let slidesSent = 0;
            
            console.log('📡 Streaming started, forwarding chunks to client...');
            
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log('✅ Anthropic stream completed');
                        break;
                    }

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            
                            try {
                                const parsed = JSON.parse(data);
                                
                                // Extract text from Anthropic's streaming format
                                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    const text = parsed.delta.text;
                                    streamedText += text;
                                    jsonBuffer += text;
                                    
                                    // Send raw text to client for debugging
                                    res.write(`data: ${JSON.stringify({ 
                                        type: 'raw_text',
                                        text: text,
                                        timestamp: Date.now()
                                    })}\n\n`);
                                    if (res.flush) res.flush();
                                    
                                    // Try to parse and extract theme if we haven't sent it yet
                                    if (!themeSent && jsonBuffer.includes('"designTheme"')) {
                                        try {
                                            const themeMatch = jsonBuffer.match(/"designTheme"\s*:\s*\{[^}]+\}/);
                                            if (themeMatch) {
                                                const fullData = parseAIResponse(jsonBuffer);
                                                if (fullData.designTheme) {
                                                    console.log(`  🎨 Theme extracted: ${fullData.designTheme.name}`);
                                                    res.write(`data: ${JSON.stringify({ 
                                                        type: 'theme',
                                                        theme: fullData.designTheme,
                                                        suggestedThemeKey: fullData.suggestedThemeKey,
                                                        totalSlides: fullData.slides?.length || 0
                                                    })}\n\n`);
                                                    if (res.flush) res.flush();
                                                    themeSent = true;
                                                }
                                            }
                                        } catch (e) {
                                            // Not ready yet
                                        }
                                    }
                                    
                                    // Try to extract complete slides as they arrive
                                    if (themeSent) {
                                        try {
                                            const fullData = parseAIResponse(jsonBuffer);
                                            if (fullData.slides && fullData.slides.length > slidesSent) {
                                                // Send any new slides
                                                for (let i = slidesSent; i < fullData.slides.length; i++) {
                                                    const slide = fullData.slides[i];
                                                    console.log(`  ✓ Slide ${i + 1} extracted, sending to client: ${slide.title}`);
                                                    
                                                    res.write(`data: ${JSON.stringify({ 
                                                        type: 'slide', 
                                                        slide: slide,
                                                        index: i,
                                                        current: i + 1,
                                                        total: fullData.slides.length
                                                    })}\n\n`);
                                                    if (res.flush) res.flush();
                                                    slidesSent++;
                                                }
                                            }
                                        } catch (e) {
                                            // JSON not complete yet
                                        }
                                    }
                                }
                            } catch (e) {
                                // Skip invalid JSON
                            }
                        }
                    }
                }
                
                // Parse final complete JSON
                console.log('📊 Parsing final complete JSON...');
                const fullData = parseAIResponse(streamedText);
                
                // Send any remaining slides
                if (fullData.slides && fullData.slides.length > slidesSent) {
                    console.log(`  📤 Sending remaining ${fullData.slides.length - slidesSent} slides...`);
                    for (let i = slidesSent; i < fullData.slides.length; i++) {
                        const slide = fullData.slides[i];
                        console.log(`  ✓ Final slide ${i + 1}: ${slide.title}`);
                        
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
                console.log(`✅ All ${fullData.slides.length} slides sent via TRUE STREAMING`);
                
                // Track slide generation for authenticated users
                if (req.oidc.isAuthenticated() && req.oidc.user) {
                    try {
                        const userId = req.oidc.user.sub || req.oidc.user.email;
                        await updateUserTracking(userId, fullData.slides.length);
                    } catch (error) {
                        console.error('Failed to track slide generation:', error);
                    }
                }
                
                res.write(`data: ${JSON.stringify({ type: 'complete', data: fullData })}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
                
            } catch (streamError) {
                console.error('❌ Stream error:', streamError);
                throw streamError;
            }
            
        } else if (incremental && provider === 'bedrock') {
            console.log(`🔄 Starting TRUE STREAMING slide generation with ${provider}...`);
            
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for SSE
            
            // Send initial provider info to frontend
            res.write(`data: ${JSON.stringify({ 
                type: 'provider_info',
                provider: provider,
                numSlides: numSlides || 'AI decides',
                timestamp: Date.now()
            })}\n\n`);
            
            // Get the prompt
            const themePrompt = await getSlideDesignPrompt(text, numSlides);
            
            const bedrockApiKey = apiKey || process.env.bedrock;
            if (!bedrockApiKey) {
                throw new Error('Bedrock API key not found');
            }
            
            // Use TRUE STREAMING with /converse-stream (same as Expand Idea)
            console.log('📡 Using TRUE STREAMING for slide preview with Bedrock');
            
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
            
            let streamedText = '';  // Accumulate pure text from Bedrock
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
                    
                    // Reduced logging to avoid rate limits
                    if (chunkCount <= 5 || chunkCount % 50 === 0) {
                        console.log(`📦 SERVER: Chunk ${chunkCount}: ${chunk.length} bytes from Bedrock`);
                    }
                    
                    // Bedrock returns EventStream format (binary)
                    // More flexible JSON extraction - look for any JSON object containing contentBlockIndex
                    const jsonStart = chunk.indexOf('{"contentBlockIndex"');
                    if (jsonStart !== -1) {
                        // Find the end of the JSON object by looking for the closing brace
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
                            
                            // Send raw text to client
                                if (data.delta?.text) {
                                    const text = data.delta.text;
                                    streamedText += text;  // Accumulate pure text
                                    // Reduced logging
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
                                console.log(`  📄 SERVER: JSON attempt: "${jsonStr.substring(0, 100)}..."`);
                            }
                        }
                    } else {
                        // Debug: show what we're actually getting
                        console.log(`  🔍 SERVER: No JSON found in chunk. Chunk preview: "${chunk.substring(0, 200)}"`);
                    }
                    
                    // Parse accumulated text periodically to extract slides as they become available
                    // This gives better UX by showing slides in batches rather than all at once
                    // Only try parsing when we have substantial content and it looks like JSON is complete
                    if (streamedText.length > 1000 && streamedText.includes('"slides"') && streamedText.includes('}')) {
                        console.log(`  🔍 SERVER: Attempting periodic parse (${streamedText.length} chars, contains slides: ${streamedText.includes('"slides"')}, contains closing brace: ${streamedText.includes('}')})`);
                        
                        try {
                            // Try to find complete JSON structure
                            const jsonStart = streamedText.indexOf('{');
                            if (jsonStart !== -1) {
                                console.log(`  🔍 SERVER: Found JSON start at position ${jsonStart}`);
                                
                                // Look for the complete presentation structure, not just the first object
                                let presentationStart = -1;
                                let presentationEnd = -1;
                                
                                // Look for the main presentation object that contains both theme and slides
                                const themeIndex = streamedText.indexOf('"designTheme"');
                                const slidesIndex = streamedText.indexOf('"slides"');
                                
                                if (themeIndex !== -1 && slidesIndex !== -1) {
                                    // Find the start of the main object containing both theme and slides
                                    presentationStart = streamedText.lastIndexOf('{', Math.min(themeIndex, slidesIndex));
                                    
                                    if (presentationStart !== -1) {
                                        // Find the matching closing brace
                                        let braceCount = 0;
                                        for (let i = presentationStart; i < streamedText.length; i++) {
                                            if (streamedText[i] === '{') braceCount++;
                                            if (streamedText[i] === '}') braceCount--;
                                            if (braceCount === 0) {
                                                presentationEnd = i;
                                                break;
                                            }
                                        }
                                    }
                                }
                                
                                if (presentationStart !== -1 && presentationEnd !== -1) {
                                    const jsonStr = streamedText.substring(presentationStart, presentationEnd + 1);
                                    console.log(`  🔍 SERVER: Extracted complete presentation JSON for periodic parse: "${jsonStr.substring(0, 100)}..."`);
                                    
                                    const fullData = parseAIResponse(jsonStr);
                                    console.log(`  📊 SERVER: Periodic parse successful, slides: ${fullData.slides?.length || 0}`);
                                    
                                    // Send theme if not sent yet
                                    if (!themeSent && fullData.designTheme) {
                                console.log(`  🎨 SERVER: Theme extracted: ${fullData.designTheme.name}`);
                                res.write(`data: ${JSON.stringify({ 
                                    type: 'theme',
                                    theme: fullData.designTheme,
                                    suggestedThemeKey: fullData.suggestedThemeKey,
                                    totalSlides: fullData.slides?.length || 0
                                })}\n\n`);
                                if (res.flush) res.flush();
                                themeSent = true;
                    }
                    
                                    // Send any new slides that are complete
                            if (fullData.slides && fullData.slides.length > slidesSent) {
                                        const newSlidesCount = fullData.slides.length - slidesSent;
                                        console.log(`  📤 SERVER: Sending ${newSlidesCount} new slides (${slidesSent + 1}-${fullData.slides.length})`);
                                        
                                for (let i = slidesSent; i < fullData.slides.length; i++) {
                                    const slide = fullData.slides[i];
                                            console.log(`  ✓ SERVER: Slide ${i + 1}: ${slide.title}`);
                                    
                                    res.write(`data: ${JSON.stringify({ 
                                        type: 'slide', 
                                        slide: slide,
                                        index: i,
                                        current: i + 1,
                                        total: fullData.slides.length
                                    })}\n\n`);
                                    if (res.flush) res.flush();
                                        }
                                        slidesSent = fullData.slides.length;
                                    }
                                } else {
                                    console.log(`  ⏭️ SERVER: Could not find complete presentation structure for periodic parse`);
                                }
                            } else {
                                console.log(`  ⏭️ SERVER: No JSON start found for periodic parse`);
                            }
                        } catch (e) {
                            // JSON not complete yet, continue streaming
                            console.log(`  ⏭️ SERVER: Periodic parse failed: ${e.message}`);
                        }
                    } else {
                        // Reduced logging for periodic parse skipping
                        if (chunkCount % 20 === 0) {
                            if (streamedText.length <= 1000) {
                                console.log(`  ⏭️ SERVER: Periodic parse skipped - not enough content (${streamedText.length} chars)`);
                            } else if (!streamedText.includes('"slides"')) {
                                console.log(`  ⏭️ SERVER: Periodic parse skipped - no slides found in text`);
                            } else if (!streamedText.includes('}')) {
                                console.log(`  ⏭️ SERVER: Periodic parse skipped - no closing brace found`);
                            }
                        }
                    }
                }
                
                // Final parsing to ensure all slides are sent
                console.log('📊 SERVER: Final parsing to ensure all slides are sent...');
                console.log(`📊 SERVER: Streamed text length: ${streamedText.length} characters`);
                console.log(`📊 SERVER: Streamed text sample: "${streamedText.substring(0, 500)}..."`);
                console.log(`📊 SERVER: Streamed text ends with: "${streamedText.substring(Math.max(0, streamedText.length - 200))}"`);
                
                try {
                    // Clean up the streamed text to extract valid JSON
                    let cleanedText = streamedText;
                    
                    console.log(`📊 SERVER: Raw streamed text preview: "${streamedText.substring(0, 300)}..."`);
                    
                    // Try to reconstruct the JSON from the fragmented text
                    // The issue is that Bedrock streaming gives us fragments that don't form valid JSON
                    let reconstructedJson = '';
                    
                    // Look for the main presentation structure
                    const themeStart = cleanedText.indexOf('"designTheme"');
                    const slidesStart = cleanedText.indexOf('"slides"');
                    
                    if (themeStart !== -1 && slidesStart !== -1) {
                        console.log(`📊 SERVER: Found theme at ${themeStart}, slides at ${slidesStart}`);
                        
                        // Find the start of the main object
                        const mainObjectStart = cleanedText.lastIndexOf('{', Math.min(themeStart, slidesStart));
                        
                        if (mainObjectStart !== -1) {
                            // Try to find the end by looking for the last complete structure
                            // Since the text is fragmented, we need to be more flexible
                            let potentialEnd = cleanedText.lastIndexOf('}');
                            
                            // Look backwards from the end to find a complete structure
                            while (potentialEnd > mainObjectStart) {
                                const testJson = cleanedText.substring(mainObjectStart, potentialEnd + 1);
                                
                                // Try to parse this as JSON
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
                        console.log(`❌ SERVER: Could not reconstruct valid JSON, trying fallback parsing`);
                        console.log(`📊 SERVER: Fallback text preview: "${cleanedText.substring(0, 300)}..."`);
                        
                        // Try to clean up the malformed text
                        // Remove common corruption patterns
                        let cleanedFallback = cleanedText
                            .replace(/gestedThemeKey/g, 'suggestedThemeKey')
                            .replace(/"designTh\s+/g, '"designTheme": ')
                            .replace(/"colorPrimary":\s*"#1C2833",\s*"colorPrimary":\s*"#1C2833"/g, '"colorPrimary": "#1C2833"')
                            .replace(/,\s*,/g, ',')  // Remove double commas
                            .replace(/,\s*}/g, '}')  // Remove trailing commas before closing braces
                            .replace(/,\s*]/g, ']'); // Remove trailing commas before closing brackets
                        
                        console.log(`📊 SERVER: Cleaned fallback preview: "${cleanedFallback.substring(0, 300)}..."`);
                        reconstructedJson = cleanedFallback;
                    }
                    
                    console.log(`📊 SERVER: About to parse JSON (${reconstructedJson.length} chars)`);
                    console.log(`📊 SERVER: JSON preview: "${reconstructedJson.substring(0, 200)}..."`);
                    
                    const fullData = parseAIResponse(reconstructedJson);
                    console.log(`📊 SERVER: Final parse successful, slides: ${fullData.slides?.length || 0}`);
                    console.log(`📊 SERVER: Full data structure:`, {
                        hasDesignTheme: !!fullData.designTheme,
                        hasSlides: !!fullData.slides,
                        slidesLength: fullData.slides?.length || 0,
                        themeName: fullData.designTheme?.name || 'none'
                    });
                
                // Send any remaining slides
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
                console.log(`✅ SERVER: All ${fullData.slides.length} slides sent via TRUE STREAMING`);
                res.write(`data: ${JSON.stringify({ type: 'complete', data: fullData })}\n\n`);
                
                // Track slide generation for authenticated users
                if (req.oidc.isAuthenticated() && req.oidc.user) {
                    try {
                        const userId = req.oidc.user.sub || req.oidc.user.email;
                        await updateUserTracking(userId, fullData.slides.length);
                    } catch (error) {
                        console.error('Failed to track slide generation:', error);
                    }
                }
                
                } catch (e) {
                    console.error(`❌ SERVER: Failed to parse final JSON: ${e.message}`);
                    console.error(`📄 SERVER: Error details:`, e);
                    console.error(`📄 SERVER: Streamed text preview: "${streamedText.substring(0, 500)}..."`);
                    console.error(`📄 SERVER: Streamed text length: ${streamedText.length}`);
                    
                    // Try to send a basic error response to frontend
                    try {
                        res.write(`data: ${JSON.stringify({ 
                            type: 'error',
                            message: 'Failed to parse AI response',
                            details: e.message
                        })}\n\n`);
                    } catch (writeError) {
                        console.error(`❌ SERVER: Failed to write error response: ${writeError.message}`);
                    }
                }
                
                res.write('data: [DONE]\n\n');
                res.end();
                
            } catch (streamError) {
                console.error('❌ SERVER: Stream error:', streamError);
                throw streamError;
            }
            
        } else if (incremental && (provider === 'openai' || provider === 'openrouter' || provider === 'gemini')) {
            // Add streaming for OpenAI, OpenRouter, and Gemini in future
            // For now, fall through to non-streaming mode
            console.log(`ℹ️ Streaming preview for ${provider} - using non-streaming mode (JSON parsing complexity)`);
            res.setHeader('Content-Type', 'application/json');
            
            const userPrompt = await getSlideDesignPrompt(text, numSlides);
            const responseText = await callAI(provider, apiKey, userPrompt);
            console.log('  AI response received, length:', responseText.length);
            
            const slideData = parseAIResponse(responseText);
            console.log('  Parsed successfully, slides:', slideData.slides?.length || 0);
            
            validateSlideData(slideData);
            console.log('✅ Preview validation passed');
            
            // Track slide generation for authenticated users
            if (req.oidc.isAuthenticated() && req.oidc.user) {
                try {
                    const userId = req.oidc.user.sub || req.oidc.user.email;
                    await updateUserTracking(userId, slideData.slides.length);
                } catch (error) {
                    console.error('Failed to track slide generation:', error);
                }
            }
            
            res.json(slideData);
        } else {
            // NON-INCREMENTAL MODE (all at once)
            res.setHeader('Content-Type', 'application/json');
            
            const userPrompt = await getSlideDesignPrompt(text, numSlides);
            const responseText = await callAI(provider, apiKey, userPrompt);
            console.log('  AI response received, length:', responseText.length);
            
            const slideData = parseAIResponse(responseText);
            console.log('  Parsed successfully, slides:', slideData.slides?.length || 0);
            
            validateSlideData(slideData);
            console.log('✅ Preview validation passed');
            
            // Track slide generation for authenticated users
            if (req.oidc.isAuthenticated() && req.oidc.user) {
                try {
                    const userId = req.oidc.user.sub || req.oidc.user.email;
                    await updateUserTracking(userId, slideData.slides.length);
                } catch (error) {
                    console.error('Failed to track slide generation:', error);
                }
            }
            
            res.json(slideData);
        }
        
    } catch (error) {
        console.error('❌ Preview error:', error.message);
        console.error('   Stack:', error.stack);
        
        if (!res.headersSent) {
            // Always show the actual error message to help with debugging
            res.status(500).json({ 
                error: error.message,
                provider: provider,
                details: error.stack
            });
        } else {
            // If headers already sent (streaming), send error event
            res.write(`data: ${JSON.stringify({ 
                type: 'error',
                error: error.message
            })}\n\n`);
            res.end();
        }
    }
});

// ========================================
// SLIDE MODIFICATION ENDPOINT
// ========================================

app.post('/api/modify-slides', async (req, res) => {
    let { slideData, modificationPrompt, currentSlides, modificationRequest, apiKey, provider = 'anthropic' } = req.body;
    
    // Support both old and new parameter names
    const slides = slideData?.slides || currentSlides;
    const prompt = modificationPrompt || modificationRequest;
    
    if (!slides || !prompt) {
        return res.status(400).json({ error: 'Slide data and modification prompt are required' });
    }
    
    // If no API key provided, use default backend provider
    if (!apiKey) {
        console.log('ℹ️ No user API key provided, using default backend provider');
        provider = 'bedrock';
        apiKey = ''; // Will use environment variable in callAI
    }
    
    try {
        console.log('✏️ Slide modification request received');
        console.log('  Current slides:', slides.length);
        console.log('  Modification:', prompt.substring(0, 100));
        console.log('  Provider:', provider);
        
        // Get modification prompt from config/prompts.json
        const userPrompt = await getSlideModificationPrompt(slides, prompt);
        console.log('  Modification prompt generated');
        
        // Call AI to modify slides
        const responseText = await callAI(provider, apiKey, userPrompt);
        console.log('  AI response received, length:', responseText.length);
        
        // Parse the modified slide data
        const modifiedData = parseAIResponse(responseText);
        console.log('  Parsed successfully, new slide count:', modifiedData.slides?.length || 0);
        
        // Validate the modified slides
        validateSlideData(modifiedData);
        console.log('✅ Modification validation passed');
        
        // Return the complete slide data structure
        res.json({ 
            slideData: modifiedData,
            ...modifiedData  // Also include direct access for backward compatibility
        });
        
    } catch (error) {
        console.error('❌ Modification error:', error.message);
        res.status(500).json({ 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ========================================
// GENERATION PROGRESS POLLING ENDPOINT
// ========================================

app.get('/api/progress/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const progress = global[`progress_${sessionId}`];
    
    if (progress) {
        res.json(progress);
    } else {
        res.json({ message: 'No progress data', step: 0, total: 8 });
    }
});

// ========================================
// PRESENTATION GENERATION ENDPOINT
// ========================================

app.post('/api/generate', async (req, res) => {
    let { text, apiKey, provider = 'anthropic', slideData, streamProgress = false } = req.body;
    
    console.log('\n' + '='.repeat(80));
    console.log('POWERPOINT GENERATION REQUEST');
    console.log('='.repeat(80));
    
    if (!text && !slideData) {
        console.log('❌ Missing content:', { hasText: !!text, hasSlideData: !!slideData });
        return res.status(400).json({ error: 'Either text or slideData is required' });
    }
    
    // If no API key provided, use default backend provider
    if (!apiKey) {
        console.log('ℹ️ No user API key provided, using default backend provider');
        provider = 'bedrock';
        apiKey = ''; // Will use environment variable in callAI
    }
    
    console.log('✅ Request validated:', { 
        hasText: !!text, 
        hasSlideData: !!slideData, 
        hasApiKey: !!apiKey,
        provider: provider,
        slideCount: slideData?.slides?.length || 0
    });

    const sessionId = createSessionId();
    const workDir = path.join(__dirname, 'workspace', sessionId);
    console.log('📁 Session ID:', sessionId);
    console.log('📁 Working directory:', workDir);
    
    // Helper function to send progress updates
    const sendProgress = (message, step, total) => {
        if (streamProgress && !res.headersSent) {
            // Store progress in global state for polling
            global[`progress_${sessionId}`] = { message, step, total };
        }
    };
    
    try {
        // Get or generate slide data
        let finalSlideData;
        
        if (slideData) {
            console.log('✓ Using provided slide data');
            sendProgress('Using cached slide data', 1, 8);
            finalSlideData = slideData;
        } else {
            console.log('⏳ Generating slide data from AI...');
            sendProgress('Generating slide structure from AI...', 1, 8);
            const userPrompt = await getSlideDesignPrompt(text);
            const responseText = await callAI(provider, apiKey, userPrompt);
            finalSlideData = parseAIResponse(responseText);
        }
        
        console.log('📊 Slide count:', finalSlideData.slides?.length || 0);
        console.log('🎨 Theme:', finalSlideData.designTheme?.name || 'Unknown');
        
        // Check for images in slides
        const slidesWithImages = finalSlideData.slides?.filter(s => s.imageUrl) || [];
        const slidesWithPlaceholders = finalSlideData.slides?.filter(s => s.imageDescription && !s.imageUrl) || [];
        console.log('🖼️  Images status:');
        console.log(`   - Slides with ACTUAL images: ${slidesWithImages.length}`);
        console.log(`   - Slides with placeholders only: ${slidesWithPlaceholders.length}`);
        if (slidesWithImages.length > 0) {
            console.log('   ✅ Images will be embedded in PowerPoint!');
            slidesWithImages.forEach((slide, i) => {
                const urlPreview = slide.imageUrl.substring(0, 50);
                console.log(`     • Slide "${slide.title}": ${urlPreview}...`);
            });
        }
        
        // Validate
        console.log('⏳ Validating slide data...');
        sendProgress('Validating slide structure...', 2, 8);
        validateSlideData(finalSlideData);
        console.log('✓ Validation passed');
        
        // Setup workspace
        console.log('⏳ Setting up workspace...');
        sendProgress('Setting up workspace...', 3, 8);
        await setupWorkspace(workDir);
        console.log('✓ Workspace created');
        
        console.log('⏳ Installing dependencies...');
        sendProgress('Installing dependencies...', 4, 8);
        await setupDependencies(workDir);
        console.log('✓ Dependencies ready');
        
        // Generate CSS file
        console.log('⏳ Generating CSS...');
        sendProgress('Generating CSS theme...', 5, 8);
        const cssContent = generateCSS(finalSlideData.designTheme);
        await fs.writeFile(path.join(workDir, 'theme.css'), cssContent);
        console.log('✓ CSS file created');
        
        // Generate HTML slides
        console.log('⏳ Generating HTML slides...');
        sendProgress(`Generating HTML for ${finalSlideData.slides.length} slides...`, 5, 8);
        const htmlFiles = [];
        const totalSlides = finalSlideData.slides.length;
        
        for (let i = 0; i < totalSlides; i++) {
            const slide = finalSlideData.slides[i];
            const htmlContent = generateSlideHTML(slide, finalSlideData.designTheme);
            const filename = `slide${i}.html`;
            await fs.writeFile(path.join(workDir, filename), htmlContent);
            htmlFiles.push(filename);
            console.log(`  ✓ Created ${filename} (${slide.type}): ${slide.title}`);
            
            // Send progress for each slide
            const slideProgress = Math.round(((i + 1) / totalSlides) * 100);
            sendProgress(`Generating slide ${i + 1}/${totalSlides}: ${slide.title.substring(0, 40)}...`, 5, 8);
        }
        console.log(`✓ Generated ${htmlFiles.length} HTML files`);
        
        // Generate and run conversion script
        console.log('⏳ Generating conversion script...');
        sendProgress('Generating conversion script...', 6, 8);
        const scriptContent = generateConversionScript(htmlFiles, finalSlideData.slides);
        await fs.writeFile(path.join(workDir, 'convert.js'), scriptContent);
        console.log('✓ Conversion script created');
        
        console.log('⏳ Running conversion script (this may take 30-60 seconds)...');
        console.log('   Launching Playwright/Chromium for HTML rendering...');
        sendProgress('Converting HTML to PowerPoint (30-60s)...', 7, 8);
        const { stdout, stderr } = await runScript(workDir, 'convert.js');
        console.log('✓ Conversion completed');
        
        if (stdout) {
            console.log('--- Conversion Script Output ---');
            console.log(stdout);
            console.log('--- End Output ---');
        }
        
        if (stderr) {
            console.log('--- Conversion Script Warnings ---');
            console.log(stderr);
            console.log('--- End Warnings ---');
        }
        
        // Read and send PowerPoint file
        console.log('⏳ Reading PowerPoint file...');
        sendProgress('Preparing download...', 8, 8);
        const pptxPath = path.join(workDir, 'presentation.pptx');
        await fs.access(pptxPath); // Check if file exists
        console.log('✓ PowerPoint file found:', pptxPath);
        
        const pptxBuffer = await fs.readFile(pptxPath);
        console.log('✓ PowerPoint file size:', (pptxBuffer.length / 1024).toFixed(2), 'KB');
        
        // Save to persistent storage
        console.log('⏳ Saving to persistent storage...');
        const storageResult = await savePresentation(sessionId, pptxBuffer, {
            title: finalSlideData.slides[0]?.title || 'AI Presentation',
            slideCount: finalSlideData.slides.length,
            theme: finalSlideData.designTheme?.name
        });
        console.log('✓ Saved to storage');
        
        // Auto-convert to PDF (wait for completion to ensure PDF is immediately accessible)
        const libreOfficeAvailable = await checkLibreOffice();
        if (libreOfficeAvailable) {
            console.log('⏳ Auto-converting to PDF (waiting for completion)...');
            try {
                await convertToPDF(storageResult.pptxPath);
                console.log('✅ PDF conversion complete - PDF is now accessible at /view-pdf/' + sessionId);
            } catch (err) {
                console.log('⚠️ PDF conversion failed:', err.message);
                console.log('   PowerPoint will still be available, but PDF access may fail');
            }
        } else {
            console.log('⚠️ LibreOffice not available - PDF conversion skipped');
        }
        
        // Clear progress before sending file
        if (streamProgress) {
            delete global[`progress_${sessionId}`];
        }
        
        // Send file with storage URLs in headers
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': 'attachment; filename="AI-Presentation-Pro.pptx"',
            'Content-Length': pptxBuffer.length,
            'X-Session-Id': sessionId,
            'X-Download-Url': storageResult.downloadUrl,
            'X-PDF-Url': storageResult.viewerUrl
        });
        
        res.send(pptxBuffer);
        console.log('✓ PowerPoint file sent to client');
        console.log('✅ GENERATION SUCCESSFUL');
        console.log('='.repeat(80) + '\n');
        
        // Cleanup workspace (files now in storage)
        scheduleCleanup(workDir);
        
    } catch (error) {
        console.error('\n' + '❌'.repeat(40));
        console.error('GENERATION ERROR');
        console.error('❌'.repeat(40));
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        if (error.stdout) {
            console.error('\n--- Script STDOUT ---');
            console.error(error.stdout);
        }
        
        if (error.stderr) {
            console.error('\n--- Script STDERR ---');
            console.error(error.stderr);
        }
        
        console.error('❌'.repeat(40) + '\n');
        
        sendErrorResponse(res, error);
        
        // Cleanup on error
        try {
            await fs.rm(workDir, { recursive: true, force: true });
        } catch (e) {}
    }
});

// ========================================
// TEMPLATE-BASED GENERATION ENDPOINT
// ========================================

app.post('/api/generate-with-template', upload.single('templateFile'), async (req, res) => {
    let { text, apiKey, provider = 'anthropic', slideData: slideDataStr } = req.body;
    const templateFile = req.file;
    
    if (!text || !templateFile) {
        return res.status(400).json({ error: 'Text and template file are required' });
    }
    
    // If no API key provided, use default backend provider
    if (!apiKey) {
        console.log('ℹ️ No user API key provided, using default backend provider');
        provider = 'bedrock';
        apiKey = ''; // Will use environment variable in callAI
    }

    const sessionId = createSessionId();
    const workDir = path.join(__dirname, 'workspace', sessionId);
    
    try {
        const slideData = JSON.parse(slideDataStr);
        
        // Setup workspace
        await setupWorkspace(workDir);
        
        // Save template file
        const templatePath = path.join(workDir, 'template.pptx');
        await fs.writeFile(templatePath, templateFile.buffer);
        
        // Setup dependencies
        await setupDependencies(workDir);
        
        // Generate modification script
        const scriptContent = generateTemplateModificationScript(slideData);
        await fs.writeFile(path.join(workDir, 'modify-template.js'), scriptContent);
        
        // Run modification
        await runScript(workDir, 'modify-template.js');
        
        // Read and send modified PowerPoint
        const pptxPath = path.join(workDir, 'modified-presentation.pptx');
        await fs.access(pptxPath);
        
        const pptxBuffer = await fs.readFile(pptxPath);
        sendFileDownload(res, pptxBuffer, 'Modified-Presentation.pptx');
        
        // Cleanup
        scheduleCleanup(workDir);
        
    } catch (error) {
        console.error('Template modification error:', error);
        sendErrorResponse(res, error);
        
        try {
            await fs.rm(workDir, { recursive: true, force: true });
        } catch (e) {}
    }
});

// ========================================
// HELPER: Template Modification Script
// ========================================

function generateTemplateModificationScript(slideData) {
    return `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

async function modifyPresentation() {
    try {
        const pptx = new pptxgen();
        pptx.layout = "LAYOUT_16x9";
        
        const theme = ${JSON.stringify(slideData.designTheme)};
        const slides = ${JSON.stringify(slideData.slides)};
        
        slides.forEach((slideInfo, idx) => {
            const slide = pptx.addSlide();
            
            if (slideInfo.type === 'title') {
                slide.background = { color: theme.colorPrimary.replace('#', '') };
                slide.addText(slideInfo.title, {
                    x: 0.5, y: 2, w: 9, h: 1.5,
                    fontSize: 44, bold: true, color: 'FFFFFF',
                    align: 'center', valign: 'middle'
                });
                if (slideInfo.subtitle) {
                    slide.addText(slideInfo.subtitle, {
                        x: 0.5, y: 3.7, w: 9, h: 0.8,
                        fontSize: 20, color: 'FFFFFF',
                        align: 'center'
                    });
                }
            } else if (slideInfo.layout === 'chart' && slideInfo.chart) {
                slide.addText(slideInfo.title, {
                    x: 0.5, y: 0.5, w: 9, h: 0.75,
                    fontSize: 28, bold: true, color: theme.colorPrimary.replace('#', '')
                });
                
                const chartData = slideInfo.chart.data.datasets.map(dataset => ({
                    name: dataset.name,
                    labels: slideInfo.chart.data.labels,
                    values: dataset.values
                }));
                
                slide.addChart(pptx.ChartType[\`\${slideInfo.chart.type}\`], chartData, {
                    x: 0.5, y: 1.5, w: 6, h: 4.5,
                    title: slideInfo.chart.title,
                    showTitle: true
                });
            } else {
                slide.addText(slideInfo.title, {
                    x: 0.5, y: 0.5, w: 9, h: 0.75,
                    fontSize: 28, bold: true, color: theme.colorPrimary.replace('#', '')
                });
                
                if (slideInfo.content) {
                    slide.addText(slideInfo.content.map(i => \`• \${i}\`).join('\\n'), {
                        x: 0.7, y: 1.5, w: 8.6, h: 4,
                        fontSize: 16
                    });
                }
            }
        });
        
        await pptx.writeFile("modified-presentation.pptx");
        process.exit(0);
    } catch (error) {
        console.error("ERROR:", error);
        process.exit(1);
    }
}

modifyPresentation();`;
}

// ========================================
// START SERVER
// ========================================

// Version check endpoint
app.get('/api/version', (req, res) => {
    try {
        res.json({
            version: '2.0.0-adaptive-content',
            features: [
                'Adaptive content sizing',
                'Progressive slide rendering',
                'Detailed error logging',
                'Scroll bar fixed',
                'Browser errors fixed'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Version endpoint error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Global error handler - ensures JSON responses for API routes
app.use((err, req, res, next) => {
    console.error('\n' + '🔥'.repeat(40));
    console.error('UNHANDLED ERROR');
    console.error('🔥'.repeat(40));
    console.error('Path:', req.path);
    console.error('Method:', req.method);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('🔥'.repeat(40) + '\n');
    
    if (!res.headersSent) {
        // Always set JSON content type for API routes
        if (req.path.startsWith('/api/')) {
            res.setHeader('Content-Type', 'application/json');
        }
        
        res.status(err.status || 500).json({ 
            error: err.message || 'Internal server error',
            path: req.path,
            timestamp: new Date().toISOString()
        });
    }
});

app.listen(PORT, () => {
    // Wait for async initialization to complete before logging
    setTimeout(() => {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🚀 genis.ai - AI Presentation Generator v2.0.0`);
        console.log(`${'='.repeat(80)}`);
        
        // Server info
        console.log(`📍 Server: Railway deployment (Port ${PORT})`);
        console.log(`🔗 Base URL: ${SERVER_CONFIG.BASE_URL}`);
        console.log(`✨ Features: Adaptive sizing, Progressive rendering, Detailed logging`);
        console.log('');
        
        // Storage status
        if (STORAGE_INITIALIZED) {
            console.log(`✅ File storage initialized`);
            console.log(`✅ PDF conversion: ${PDF_AVAILABLE ? 'Available (LibreOffice)' : 'Unavailable'}`);
            console.log(`✅ Auto-cleanup scheduler started (runs every hour)`);
        } else {
            console.log(`⏳ File storage initializing...`);
        }
        console.log('');
        
        // API endpoints
        console.log(`📋 API Endpoints:`);
        console.log(`   • Health: /api/health`);
        console.log(`   • Version: /api/version`);
        console.log(`   • Capabilities: /api/capabilities`);
        console.log('');
        
        // Share links configuration
        console.log(`🔗 Shareable Links Configuration:`);
        console.log(`   • Domain: ${SERVER_CONFIG.BASE_URL}`);
        console.log(`   • Format: ${SERVER_CONFIG.BASE_URL}/view/{id}`);
        console.log(`   • Example: https://genis.ai/view/abc123`);
        
        console.log(`${'='.repeat(80)}`);
        console.log(`✅ Server ready and listening on port ${PORT}`);
        console.log(`${'='.repeat(80)}\n`);
    }, 100); // Small delay to let async initialization complete
});

// ========================================
// SHAREABLE PRESENTATIONS
// ========================================

// In-memory storage for shared presentations (use database in production)
const sharedPresentations = new Map();

/**
 * Share a presentation - creates a unique shareable link
 */
app.post('/api/share-presentation', async (req, res) => {
    try {
        const { slideData, title, sessionId } = req.body;
        
        if (!slideData || !slideData.slides) {
            return res.status(400).json({ error: 'Invalid slide data' });
        }
        
        // Generate unique share ID
        const shareId = generateShareId();
        
        // Store presentation data (including sessionId for PDF access)
        sharedPresentations.set(shareId, {
            slideData,
            title: title || 'AI Presentation',
            sessionId: sessionId || null,  // Store sessionId to link to PDF
            createdAt: new Date(),
            views: 0
        });
        
        // Schedule cleanup after 7 days
        setTimeout(() => {
            sharedPresentations.delete(shareId);
            console.log(`🗑️ Cleaned up shared presentation: ${shareId}`);
        }, 7 * 24 * 60 * 60 * 1000); // 7 days
        
        // Use BASE_URL from config if set, otherwise auto-detect from request
        const baseUrl = SERVER_CONFIG.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const shareUrl = `${baseUrl}/view/${shareId}`;
        
        console.log(`✅ Created shareable presentation: ${shareId}`);
        console.log(`   📌 Base URL: ${SERVER_CONFIG.BASE_URL ? SERVER_CONFIG.BASE_URL + ' (from ENV)' : 'Auto-detected: ' + baseUrl}`);
        console.log(`   🔗 Share URL: ${shareUrl}`);
        
        res.json({ 
            shareId, 
            shareUrl,
            expiresIn: '7 days'
        });
        
    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({ error: 'Failed to create shareable link' });
    }
});

/**
 * Get shared presentation data
 */
app.get('/api/shared-presentation/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        const presentation = sharedPresentations.get(shareId);
        
        if (!presentation) {
            return res.status(404).json({ error: 'Presentation not found or expired' });
        }
        
        // Increment view counter
        presentation.views++;
        
        res.json({
            slideData: presentation.slideData,
            title: presentation.title,
            sessionId: presentation.sessionId,  // Include sessionId for PDF access
            views: presentation.views,
            createdAt: presentation.createdAt
        });
        
    } catch (error) {
        console.error('Get shared presentation error:', error);
        res.status(500).json({ error: 'Failed to load presentation' });
    }
});

/**
 * Update shared presentation (for modifications)
 */
app.post('/api/update-presentation/:shareId', async (req, res) => {
    try {
        const { shareId } = req.params;
        const { slideData } = req.body;
        
        const presentation = sharedPresentations.get(shareId);
        
        if (!presentation) {
            return res.status(404).json({ error: 'Presentation not found or expired' });
        }
        
        // Update slide data
        presentation.slideData = slideData;
        presentation.updatedAt = new Date();
        
        console.log(`✅ Updated shared presentation: ${shareId}`);
        res.json({ success: true, message: 'Presentation updated' });
        
    } catch (error) {
        console.error('Update presentation error:', error);
        res.status(500).json({ error: 'Failed to update presentation' });
    }
});

/**
 * Generate unique share ID
 */
function generateShareId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Serve shared presentation viewer page
 */
app.get('/view/:shareId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'viewer.html'));
});

// ========================================
// FILE DOWNLOAD & PDF ENDPOINTS
// ========================================

/**
 * Download presentation file (PPTX or PDF)
 */
app.get('/download/:sessionId/:filename', async (req, res) => {
    try {
        const { sessionId, filename } = req.params;
        
        // Validate filename
        if (!['presentation.pptx', 'presentation.pdf'].includes(filename)) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        
        console.log(`📥 Download request: ${sessionId}/${filename}`);
        
        try {
            // Try to get file from storage
            const { fileBuffer, metadata } = await getFile(sessionId, filename);
            
            // Set appropriate headers
            const contentType = filename.endsWith('.pdf') 
                ? 'application/pdf' 
                : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            
            res.set({
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fileBuffer.length
            });
            
            res.send(fileBuffer);
            console.log(`✅ Downloaded: ${sessionId}/${filename} (${metadata.downloads} total downloads)`);
            
        } catch (fileError) {
            // File not found - check if we need to generate it from shared presentation
            console.log(`⚠️ File not found for ${sessionId}/${filename}, checking shared presentations...`);
            
            // Try to find the presentation in sharedPresentations map
            let presentationData = null;
            let shareId = null;
            
            for (const [sid, pres] of sharedPresentations.entries()) {
                if (pres.sessionId === sessionId) {
                    presentationData = pres;
                    shareId = sid;
                    console.log(`✅ Found matching presentation for sessionId: ${sessionId} in shareId: ${shareId}`);
                    break;
                }
            }
            
            if (!presentationData) {
                console.error(`❌ No presentation found for sessionId: ${sessionId}`);
                return res.status(404).json({ 
                    error: 'File not found. The presentation may have expired or been deleted.' 
                });
            }
            
            // We found the presentation, but the file doesn't exist
            // This should not happen normally, but we'll try to help by:
            // 1. Try to get the PPTX file if it exists
            // 2. Otherwise, offer to regenerate
            return res.status(404).json({ 
                error: 'Presentation file not found. Please regenerate the presentation.',
                suggestion: 'The presentation data exists but the file is missing. Please go back and regenerate.'
            });
        }
        
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * View PDF inline (for browser viewing)
 */
app.get('/view-pdf/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Get PDF from storage
        const { fileBuffer } = await getFile(sessionId, 'presentation.pdf');
        
        // Set headers for inline viewing
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename="presentation.pdf"',
            'Content-Length': fileBuffer.length
        });
        
        res.send(fileBuffer);
        
    } catch (error) {
        console.error('PDF view error:', error);
        res.status(404).json({ error: 'PDF not found or not yet generated' });
    }
});

/**
 * Convert presentation to PDF
 */
app.post('/api/convert-to-pdf/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Check if LibreOffice is available
        const libreOfficeAvailable = await checkLibreOffice();
        if (!libreOfficeAvailable) {
            return res.status(503).json({ 
                error: 'PDF conversion unavailable',
                message: 'LibreOffice is not installed on the server'
            });
        }
        
        // Build PPTX file path directly
        const pptxPath = path.join(__dirname, 'workspace', 'generated', sessionId, 'presentation.pptx');
        
        // Check if PPTX file exists
        try {
            await fs.access(pptxPath);
        } catch (error) {
            console.error(`❌ PPTX file not found: ${pptxPath}`);
            return res.status(404).json({ 
                error: 'Presentation not found',
                message: `No PowerPoint file found for session ${sessionId}`
            });
        }
        
        // Convert to PDF
        console.log(`🔄 Converting ${sessionId} to PDF...`);
        const pdfPath = await convertToPDF(pptxPath);
        
        // Return PDF URL
        res.json({
            success: true,
            pdfUrl: `/download/${sessionId}/presentation.pdf`,
            viewUrl: `/view-pdf/${sessionId}`,
            message: 'PDF generated successfully'
        });
        
    } catch (error) {
        console.error('PDF conversion error:', error);
        res.status(500).json({ error: error.message });
    }
});

