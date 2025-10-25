/**
 * AI Text2PPT Pro - Main Server File
 * Clean, modular entry point using reusable components
 */

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');

// Import utilities
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
    getFileProcessingPrompt
} = require('./server/utils/promptManager');
const { 
    generateCSS, 
    generateSlideHTML, 
    generateConversionScript 
} = require('./server/utils/generators');

// Import routes
const promptRoutes = require('./server/routes/prompts');

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.static('public'));

const upload = multer({ 
    storage: multer.memoryStorage(), 
    limits: { fileSize: 50 * 1024 * 1024 } 
});

// Mount routes
app.use('/api', promptRoutes);

// ========================================
// CONTENT GENERATION ENDPOINT
// ========================================

app.post('/api/generate-content', async (req, res) => {
    const { prompt, apiKey, provider = 'anthropic', numSlides = 6, generateImages = false, stream = false } = req.body;
    
    if (!prompt || !apiKey) {
        return res.status(400).json({ error: 'Prompt and API key are required' });
    }
    
    try {
        const userPrompt = await getContentGenerationPrompt(prompt, numSlides, generateImages);

        // Streaming for Anthropic
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
        } else {
            // Non-streaming
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

// ========================================
// FILE PROCESSING ENDPOINT
// ========================================

app.post('/api/process-files', async (req, res) => {
    const { files, apiKey, provider = 'anthropic' } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0 || !apiKey) {
        return res.status(400).json({ error: 'Files and API key are required' });
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
    const { text, apiKey, provider = 'anthropic' } = req.body;
    
    if (!text || !apiKey) {
        return res.status(400).json({ error: 'Text and API key are required' });
    }
    
    try {
        const userPrompt = await getSlideDesignPrompt(text);
        const responseText = await callAI(provider, apiKey, userPrompt);
        const slideData = parseAIResponse(responseText);
        
        // Validate structure
        validateSlideData(slideData);
        
        // Return slide structure for preview
        res.json(slideData);
        
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========================================
// PRESENTATION GENERATION ENDPOINT
// ========================================

app.post('/api/generate', async (req, res) => {
    const { text, apiKey, provider = 'anthropic', slideData } = req.body;
    
    console.log('\n' + '='.repeat(80));
    console.log('POWERPOINT GENERATION REQUEST');
    console.log('='.repeat(80));
    
    if (!text || !apiKey) {
        console.log('❌ Missing required fields:', { hasText: !!text, hasApiKey: !!apiKey });
        return res.status(400).json({ error: 'Text and API key are required' });
    }

    const sessionId = createSessionId();
    const workDir = path.join(__dirname, 'workspace', sessionId);
    console.log('📁 Session ID:', sessionId);
    console.log('📁 Working directory:', workDir);
    
    try {
        // Get or generate slide data
        let finalSlideData;
        
        if (slideData) {
            console.log('✓ Using provided slide data');
            finalSlideData = slideData;
        } else {
            console.log('⏳ Generating slide data from AI...');
            const userPrompt = await getSlideDesignPrompt(text);
            const responseText = await callAI(provider, apiKey, userPrompt);
            finalSlideData = parseAIResponse(responseText);
        }
        
        console.log('📊 Slide count:', finalSlideData.slides?.length || 0);
        console.log('🎨 Theme:', finalSlideData.designTheme?.name || 'Unknown');
        
        // Validate
        console.log('⏳ Validating slide data...');
        validateSlideData(finalSlideData);
        console.log('✓ Validation passed');
        
        // Setup workspace
        console.log('⏳ Setting up workspace...');
        await setupWorkspace(workDir);
        console.log('✓ Workspace created');
        
        console.log('⏳ Installing dependencies...');
        await setupDependencies(workDir);
        console.log('✓ Dependencies ready');
        
        // Generate CSS file
        console.log('⏳ Generating CSS...');
        const cssContent = generateCSS(finalSlideData.designTheme);
        await fs.writeFile(path.join(workDir, 'theme.css'), cssContent);
        console.log('✓ CSS file created');
        
        // Generate HTML slides
        console.log('⏳ Generating HTML slides...');
        const htmlFiles = [];
        for (let i = 0; i < finalSlideData.slides.length; i++) {
            const slide = finalSlideData.slides[i];
            const htmlContent = generateSlideHTML(slide, finalSlideData.designTheme);
            const filename = `slide${i}.html`;
            await fs.writeFile(path.join(workDir, filename), htmlContent);
            htmlFiles.push(filename);
            console.log(`  ✓ Created ${filename} (${slide.type}): ${slide.title}`);
        }
        console.log(`✓ Generated ${htmlFiles.length} HTML files`);
        
        // Generate and run conversion script
        console.log('⏳ Generating conversion script...');
        const scriptContent = generateConversionScript(htmlFiles, finalSlideData.slides);
        await fs.writeFile(path.join(workDir, 'convert.js'), scriptContent);
        console.log('✓ Conversion script created');
        
        console.log('⏳ Running conversion script (this may take 30-60 seconds)...');
        console.log('   Launching Playwright/Chromium for HTML rendering...');
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
        const pptxPath = path.join(workDir, 'presentation.pptx');
        await fs.access(pptxPath); // Check if file exists
        console.log('✓ PowerPoint file found:', pptxPath);
        
        const pptxBuffer = await fs.readFile(pptxPath);
        console.log('✓ PowerPoint file size:', (pptxBuffer.length / 1024).toFixed(2), 'KB');
        
        sendFileDownload(res, pptxBuffer, 'AI-Presentation.pptx');
        console.log('✓ PowerPoint file sent to client');
        console.log('✅ GENERATION SUCCESSFUL');
        console.log('='.repeat(80) + '\n');
        
        // Cleanup
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
    const { text, apiKey, provider = 'anthropic', slideData: slideDataStr } = req.body;
    const templateFile = req.file;
    
    if (!text || !apiKey || !templateFile) {
        return res.status(400).json({ error: 'Text, API key, and template file are required' });
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
});

app.listen(PORT, () => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚀 AI Text2PPT Pro Server v2.0.0-adaptive-content`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`✨ Features: Adaptive sizing, Progressive rendering, Detailed logging`);
    console.log(`🔍 Version check: http://localhost:${PORT}/api/version`);
    console.log(`${'='.repeat(80)}\n`);
});

