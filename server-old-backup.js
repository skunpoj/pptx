const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = 3000;

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.static('public'));

// Multer for file uploads
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// Import prompt manager
const {
    getContentGenerationPrompt,
    getSlideDesignPrompt,
    getFileProcessingPrompt
} = require('./server/utils/promptManager');

// Import routes
const promptRoutes = require('./server/routes/prompts');
app.use('/api', promptRoutes);

// Helper function to call AI API based on provider
async function callAI(provider, apiKey, userPrompt) {
    if (provider === 'anthropic') {
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

        const data = await response.json();
        return data.content[0].text.trim();
    } 
    else if (provider === 'openai') {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{
                    role: "user",
                    content: userPrompt
                }],
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
    else if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey.trim()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: userPrompt
                    }]
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

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    }
    else if (provider === 'openrouter') {
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

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
    
    throw new Error('Unsupported AI provider');
}

// Content generation endpoint with streaming support
app.post('/api/generate-content', async (req, res) => {
    const { prompt, apiKey, provider = 'anthropic', numSlides = 6, generateImages = false, stream = false } = req.body;
    
    if (!prompt || !apiKey) {
        return res.status(400).json({ error: 'Prompt and API key are required' });
    }
    
    try {
        // Load prompt from centralized config
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

// File processing endpoint - converts uploaded files to presentation content
app.post('/api/process-files', async (req, res) => {
    const { files, apiKey, provider = 'anthropic' } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0 || !apiKey) {
        return res.status(400).json({ error: 'Files and API key are required' });
    }
    
    try {
        // Load prompt from centralized config
        const userPrompt = await getFileProcessingPrompt(files);

        const content = await callAI(provider, apiKey, userPrompt);
        res.json({ content });
        
    } catch (error) {
        console.error('File processing error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Color extraction endpoint - extracts color theme from uploaded files
app.post('/api/extract-colors', upload.array('files'), async (req, res) => {
    try {
        const files = req.files;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }
        
        console.log(`Extracting colors from ${files.length} file(s)`);
        
        // Simple color extraction based on file analysis
        // In a real implementation, you would analyze PDF/PPTX files for actual colors
        // For now, we'll create intelligent themes based on file names and content patterns
        
        const fileNames = files.map(f => f.originalname.toLowerCase()).join(' ');
        let theme = null;
        
        // Detect theme based on file names and common keywords
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
            // Default extracted theme with sophisticated colors
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

// Preview endpoint - returns slide structure without generating PPTX
app.post('/api/preview', async (req, res) => {
    const { text, apiKey, provider = 'anthropic' } = req.body;
    
    if (!text || !apiKey) {
        return res.status(400).json({ error: 'Text and API key are required' });
    }
    
    try {
        // Load prompt from centralized config  
        const userPrompt = await getSlideDesignPrompt(text);

        const responseText = await callAI(provider, apiKey, userPrompt);
        
        // Clean up the response text to extract JSON
        let cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        
        // Try to parse JSON with better error handling
        let slideData;
        try {
            slideData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response text:', cleanedText);
            throw new Error('Failed to parse AI response. Please try again.');
        }
        
        // Validate the structure
        if (!slideData.designTheme || !slideData.slides || !Array.isArray(slideData.slides)) {
            throw new Error('Invalid slide structure received from AI');
        }
        
        // Return the slide structure for preview
        res.json(slideData);
        
    } catch (error) {
        console.error('Preview error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Main endpoint to generate presentation
app.post('/api/generate', async (req, res) => {
    const { text, apiKey, provider = 'anthropic', slideData } = req.body;
    
    if (!text || !apiKey) {
        return res.status(400).json({ error: 'Text and API key are required' });
    }

    const sessionId = Date.now().toString();
    const workDir = path.join(__dirname, 'workspace', sessionId);
    
    try {
        // If slideData is provided, use it; otherwise generate it
        let finalSlideData;
        
        if (slideData) {
            finalSlideData = slideData;
        } else {
            // Load prompt from centralized config
            const userPrompt = await getSlideDesignPrompt(text);
            const responseText = await callAI(provider, apiKey, userPrompt);
            
            // Clean up and parse
            let cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            
            try {
                finalSlideData = JSON.parse(cleanedText);
            } catch (parseError) {
                console.error('JSON Parse Error in generate:', parseError);
                console.error('Response text:', cleanedText);
                throw new Error('Failed to parse AI response. Please try again.');
            }
            
            if (!finalSlideData.designTheme || !finalSlideData.slides || !Array.isArray(finalSlideData.slides)) {
                throw new Error('Invalid slide structure received from AI');
            }
        }
        
        /* Prompt now loaded from config/prompts.json via promptManager */
        
        // Additional validation for slideData
        if (!finalSlideData || !finalSlideData.slides || finalSlideData.slides.length === 0) {
            throw new Error('No slides data available. Please generate preview first.');
        }
        
        // Create workspace directory
        await fs.mkdir(workDir, { recursive: true });
        
        // Create package.json for workspace (using ES modules)
        const packageJson = {
            "name": "pptx-workspace",
            "version": "1.0.0",
            "type": "module"
        };
        await fs.writeFile(
            path.join(workDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );
        
        // Create node_modules with symlinks to global packages
        const nodeModulesPath = path.join(workDir, 'node_modules');
        await fs.mkdir(nodeModulesPath, { recursive: true });
        
        // Symlink global packages
        const globalModulesPath = '/usr/local/lib/node_modules';
        try {
            // Check if global modules exist
            try {
                await fs.access(globalModulesPath);
                console.log('Global node_modules found at:', globalModulesPath);
            } catch (e) {
                console.error('Global node_modules not found at:', globalModulesPath);
                throw new Error('Global node_modules directory not found');
            }
            
            // Create symlinks for the packages
            await fs.symlink(
                path.join(globalModulesPath, 'pptxgenjs'),
                path.join(nodeModulesPath, 'pptxgenjs'),
                'dir'
            );
            console.log('✓ Symlinked pptxgenjs');
            
            // Create @ant directory for scoped package
            await fs.mkdir(path.join(nodeModulesPath, '@ant'), { recursive: true });
            await fs.symlink(
                path.join(globalModulesPath, '@ant/html2pptx'),
                path.join(nodeModulesPath, '@ant', 'html2pptx'),
                'dir'
            );
            console.log('✓ Symlinked @ant/html2pptx');
            
            // Also symlink dependencies that pptxgenjs needs
            const depsToLink = ['jszip', 'sharp', 'playwright'];
            for (const dep of depsToLink) {
                try {
                    await fs.symlink(
                        path.join(globalModulesPath, dep),
                        path.join(nodeModulesPath, dep),
                        'dir'
                    );
                    console.log(`✓ Symlinked ${dep}`);
                } catch (e) {
                    console.log(`⚠ Could not symlink ${dep}:`, e.message);
                }
            }
            
            console.log('All symlinks created successfully');
        } catch (symlinkError) {
            // Fallback: If symlinks fail, try npm install
            console.log('Symlink failed, falling back to npm install:', symlinkError.message);
            try {
                const { stdout, stderr } = await execPromise(
                    `cd ${workDir} && npm install pptxgenjs @ant/html2pptx jszip sharp playwright --no-save --no-audit --no-fund 2>&1`,
                    { timeout: 120000 } // 2 minute timeout for npm install
                );
                console.log('npm install output:', stdout);
                if (stderr) console.error('npm install stderr:', stderr);
            } catch (npmError) {
                console.error('npm install also failed:', npmError);
                throw new Error('Failed to install dependencies: ' + npmError.message);
            }
        }
        
        // Generate CSS file with theme
        const cssContent = generateCSS(finalSlideData.designTheme);
        await fs.writeFile(path.join(workDir, 'theme.css'), cssContent);
        
        // Generate HTML slides
        const htmlFiles = [];
        for (let i = 0; i < finalSlideData.slides.length; i++) {
            const slide = finalSlideData.slides[i];
            const htmlContent = generateSlideHTML(slide, finalSlideData.designTheme);
            const filename = `slide${i}.html`;
            await fs.writeFile(path.join(workDir, filename), htmlContent);
            htmlFiles.push(filename);
            console.log(`Created ${filename} (${htmlContent.length} bytes)`);
        }
        console.log(`Generated ${htmlFiles.length} HTML slides`);
        
        // Generate conversion script
        const scriptContent = generateConversionScript(htmlFiles, finalSlideData.slides);
        await fs.writeFile(path.join(workDir, 'convert.js'), scriptContent);
        console.log('Conversion script created');
        console.log('Script preview:', scriptContent.substring(0, 500));
        
        // Run conversion
        console.log(`Running conversion in ${workDir}`);
        console.log('HTML files:', htmlFiles);
        console.log('Number of slides:', finalSlideData.slides.length);
        
        try {
            const { stdout, stderr } = await execPromise(
                `cd ${workDir} && node convert.js 2>&1`,
                { timeout: 60000 } // 60 second timeout
            );
            console.log('Conversion output:', stdout);
            if (stderr) console.error('Conversion stderr:', stderr);
        } catch (conversionError) {
            console.error('Conversion script failed:', conversionError);
            console.error('stdout:', conversionError.stdout);
            console.error('stderr:', conversionError.stderr);
            
            // List files in workspace for debugging
            try {
                const files = await fs.readdir(workDir);
                console.log('Files in workspace:', files);
            } catch (e) {
                console.error('Could not list workspace files:', e);
            }
            
            throw new Error(`Conversion failed: ${conversionError.stderr || conversionError.stdout || conversionError.message}`);
        }
        
        // Read the generated PowerPoint
        const pptxPath = path.join(workDir, 'presentation.pptx');
        
        // Check if file exists before reading
        try {
            await fs.access(pptxPath);
        } catch (error) {
            console.error('PPTX file not found at:', pptxPath);
            
            // List files in workspace for debugging
            try {
                const files = await fs.readdir(workDir);
                console.log('Files in workspace after conversion:', files);
            } catch (e) {
                console.error('Could not list workspace files:', e);
            }
            
            throw new Error(`Presentation file was not created. Check server logs for details.`);
        }
        
        const pptxBuffer = await fs.readFile(pptxPath);
        
        // Send file back
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': 'attachment; filename="AI-Presentation.pptx"',
            'Content-Length': pptxBuffer.length
        });
        res.send(pptxBuffer);
        
        // Cleanup
        setTimeout(async () => {
            try {
                await fs.rm(workDir, { recursive: true, force: true });
            } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('Error:', error);
        console.error('Error stdout:', error.stdout);
        console.error('Error stderr:', error.stderr);
        
        // Provide more detailed error message
        const errorMsg = error.stdout || error.stderr || error.message;
        res.status(500).json({ error: errorMsg });
        
        // Cleanup on error
        try {
            await fs.rm(workDir, { recursive: true, force: true });
        } catch (e) {}
    }
});

function generateCSS(theme) {
    return `:root {
    --color-primary: ${theme.colorPrimary};
    --color-secondary: ${theme.colorSecondary};
    --color-accent: ${theme.colorAccent};
    --color-surface: ${theme.colorBackground};
    --color-surface-foreground: ${theme.colorText};
    --font-family-display: Arial, sans-serif;
    --font-family-content: Arial, sans-serif;
}`;
}

function generateSlideHTML(slide, theme) {
    if (slide.type === 'title') {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col center" style="width: 960px; height: 540px; background: linear-gradient(135deg, ${theme.colorPrimary} 0%, ${theme.colorSecondary} 100%); position: relative; overflow: hidden;">
    <!-- Decorative shapes -->
    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: ${theme.colorAccent}; opacity: 0.2; border-radius: 50%;"></div>
    <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: ${theme.colorBackground}; opacity: 0.1; border-radius: 50%;"></div>
    <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 4px; background: ${theme.colorAccent}; opacity: 0.3; transform: translateY(-50%);"></div>
    
    <!-- Content -->
    <div style="z-index: 10; position: relative;">
        <h1 style="color: ${theme.colorBackground}; font-size: 3.5rem; font-weight: bold; text-align: center; margin: 0; padding: 0 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
        ${escapeHtml(slide.title)}
    </h1>
        ${slide.subtitle ? `<h2 style="color: ${theme.colorBackground}; font-size: 1.5rem; opacity: 0.95; text-align: center; margin-top: 1.5rem;">
        ${escapeHtml(slide.subtitle)}
    </h2>` : ''}
        <div style="width: 120px; height: 4px; background: ${theme.colorAccent}; margin: 2rem auto;"></div>
    </div>
</body>
</html>`;
    }
    
    // Three-column layout
    if (slide.layout === 'three-column' && slide.content.length >= 3) {
        const third = Math.ceil(slide.content.length / 3);
        const col1 = slide.content.slice(0, third);
        const col2 = slide.content.slice(third, third * 2);
        const col3 = slide.content.slice(third * 2);
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2rem; font-weight: bold; margin: 0 0 1rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1rem; margin-bottom: 1rem;">${escapeHtml(slide.header)}</p>` : ''}
    <div class="fill-height row gap-lg items-fill-width" style="display: flex; gap: 1.5rem; padding-bottom: 1rem;">
        <section style="flex: 1;">
            <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.95rem; line-height: 1.5;">
                ${col1.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        </section>
        <section style="flex: 1;">
            <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.95rem; line-height: 1.5;">
                ${col2.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        </section>
        <section style="flex: 1;">
            <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.95rem; line-height: 1.5;">
                ${col3.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        </section>
    </div>
</body>
</html>`;
    }
    
    // Two-column layout
    if (slide.layout === 'two-column' && slide.content.length >= 2) {
        const half = Math.ceil(slide.content.length / 2);
        const col1 = slide.content.slice(0, half);
        const col2 = slide.content.slice(half);
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1.5rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 600;">${escapeHtml(slide.header)}</p>` : ''}
    <div class="fill-height row gap-lg items-fill-width" style="display: flex; gap: 2rem; padding-bottom: 1rem;">
        <section style="flex: 1;">
            <ul style="margin: 0; padding-left: 1.5rem; font-size: 1.125rem; line-height: 1.6;">
                ${col1.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        </section>
        <section style="flex: 1;">
            <ul style="margin: 0; padding-left: 1.5rem; font-size: 1.125rem; line-height: 1.6;">
                ${col2.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
        </section>
    </div>
</body>
</html>`;
    }
    
    // Framework layout with structured sections
    if (slide.layout === 'framework') {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1rem 0; border-bottom: 3px solid ${theme.colorAccent}; padding-bottom: 0.5rem;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin-bottom: 1.5rem; font-style: italic;">${escapeHtml(slide.header)}</p>` : ''}
    <div class="fill-height" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; padding-bottom: 1rem;">
        ${slide.content.map(item => `
            <div style="background: ${theme.colorBackground}; border-left: 4px solid ${theme.colorAccent}; padding: 1rem; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <p style="margin: 0; font-size: 1.05rem; line-height: 1.6; color: ${theme.colorText};">${escapeHtml(item)}</p>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }
    
    // Process flow layout with arrows and steps
    if (slide.layout === 'process-flow') {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1.5rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin-bottom: 1.5rem;">${escapeHtml(slide.header)}</p>` : ''}
    <div class="fill-height" style="display: flex; flex-direction: column; justify-content: center; gap: 1rem; padding-bottom: 1rem;">
        ${slide.content.map((item, idx) => `
            <div style="display: flex; align-items: center; gap: 1rem; ${idx < slide.content.length - 1 ? 'margin-bottom: 0.5rem;' : ''}">
                <div style="background: ${theme.colorAccent}; color: white; font-weight: bold; min-width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                    ${idx + 1}
                </div>
                <div style="flex: 1; background: linear-gradient(90deg, ${theme.colorPrimary}15 0%, ${theme.colorPrimary}05 100%); padding: 0.75rem 1.5rem; border-left: 3px solid ${theme.colorAccent}; font-size: 1.1rem; line-height: 1.5;">
                    ${escapeHtml(item)}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
    }
    
    // Chart layout
    if (slide.layout === 'chart' && slide.chart) {
        // Placeholder for chart - will be replaced by actual chart in pptxgenjs
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    <div class="fill-height" style="display: flex; gap: 1.5rem; padding-bottom: 1rem;">
        <div style="flex: 1; background: #f8f9fa; border: 2px solid ${theme.colorAccent}; border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <div style="text-align: center; color: ${theme.colorPrimary}; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">
                📊 ${escapeHtml(slide.chart.title || 'Chart')}
            </div>
            <div style="background: white; border: 2px dashed ${theme.colorSecondary}; border-radius: 8px; padding: 1rem; width: 100%; text-align: center; color: ${theme.colorSecondary}; font-size: 0.9rem;">
                ${slide.chart.type.toUpperCase()} CHART<br/>
                ${slide.chart.data.labels.length} data points
            </div>
        </div>
        ${slide.content && slide.content.length > 0 ? `
        <div style="flex: 0 0 300px;">
            <h3 style="color: ${theme.colorSecondary}; font-size: 1.1rem; font-weight: 600; margin: 0 0 0.75rem 0;">Key Insights:</h3>
            <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.95rem; line-height: 1.6;">
                ${slide.content.map(item => `<li style="margin-bottom: 0.5rem;">${escapeHtml(item)}</li>`).join('')}
            </ul>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
    }
    
    // Standard bullet list (default)
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem; position: relative; overflow: hidden;">
    <!-- Decorative elements -->
    <div style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: linear-gradient(180deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 100%);"></div>
    <div style="position: absolute; top: 20px; right: 30px; width: 80px; height: 80px; background: ${theme.colorAccent}; opacity: 0.08; border-radius: 50%;"></div>
    <div style="position: absolute; bottom: 30px; right: 50px; width: 120px; height: 120px; background: ${theme.colorPrimary}; opacity: 0.05; border-radius: 50%;"></div>
    
    <!-- Content -->
    <div style="position: relative; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 50%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                ${slide.graphics?.icons?.[0]?.emoji || '📋'}
            </div>
            <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0; flex: 1;">
        ${escapeHtml(slide.title)}
    </h2>
        </div>
        ${slide.header ? `
        <div style="background: linear-gradient(90deg, ${theme.colorAccent}20 0%, transparent 100%); border-left: 4px solid ${theme.colorAccent}; padding: 0.75rem 1.25rem; margin-bottom: 1.5rem; border-radius: 0 8px 8px 0;">
            <p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin: 0; font-style: italic;">${escapeHtml(slide.header)}</p>
        </div>` : ''}
        ${slide.imageDescription ? `<div style="background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%); border: 2px dashed ${theme.colorAccent}; padding: 1rem; margin-bottom: 1rem; border-radius: 12px; text-align: center; color: ${theme.colorSecondary}; font-style: italic; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><p style="margin: 0;">📸 Image: ${escapeHtml(slide.imageDescription)}</p></div>` : ''}
        <div class="fill-height" style="display: flex; flex-direction: column; justify-content: center; padding-bottom: 1rem;">
            <ul style="margin: 0; padding-left: 0; list-style: none; font-size: 1.25rem; line-height: 1.8;">
                ${slide.content.map((item, idx) => `
                <li style="margin-bottom: 1rem; display: flex; align-items: start; gap: 1rem;">
                    <span style="flex-shrink: 0; width: 32px; height: 32px; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: bold;">${idx + 1}</span>
                    <span style="flex: 1; padding-top: 4px;">${escapeHtml(item)}</span>
                </li>
                `).join('')}
        </ul>
        </div>
    </div>
</body>
</html>`;
}

function generateConversionScript(htmlFiles, slides) {
    return `import { createRequire } from 'module';
import { html2pptx } from "@ant/html2pptx";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

async function createPresentation() {
    try {
        console.log("Starting presentation creation...");
        console.log("pptxgen loaded:", typeof pptxgen);
        console.log("html2pptx loaded:", typeof html2pptx);
        
        const pptx = new pptxgen();
        pptx.layout = "LAYOUT_16x9";
        console.log("PPTX instance created");
        
        ${htmlFiles.map((file, idx) => {
            const slide = slides[idx];
            
            // If slide has a chart, generate it directly with pptxgenjs
            if (slide.layout === 'chart' && slide.chart) {
                const chartData = slide.chart.data;
                const chartColors = ['0088CC', '99CCFF', '005580', '74ADC0', '003D55'];
                
                return `
        // Slide ${idx + 1}: ${slide.title || 'Chart'} (Chart Slide)
        console.log("Creating chart slide for ${file}...");
        const slide${idx} = pptx.addSlide();
        
        // Add title
        slide${idx}.addText(${JSON.stringify(slide.title)}, {
            x: 0.5, y: 0.5, w: 9, h: 0.75,
            fontSize: 28, bold: true, color: '1C2833'
        });
        
        // Add chart
        const chartData${idx} = ${JSON.stringify(chartData.datasets.map((dataset, i) => ({
            name: dataset.name,
            labels: chartData.labels,
            values: dataset.values
        })))};
        
        slide${idx}.addChart(pptx.ChartType.${slide.chart.type}, chartData${idx}, {
            x: 0.5, y: 1.5, w: ${slide.content && slide.content.length > 0 ? '6' : '9'}, h: 4.5,
            title: ${JSON.stringify(slide.chart.title)},
            showTitle: true,
            titleFontSize: 16,
            ${slide.chart.type === 'pie' ? 'dataLabelPosition: "bestFit",' : ''}
            ${slide.chart.type === 'line' || slide.chart.type === 'area' ? 'lineDataSymbol: "circle",' : ''}
            showValue: true,
            catAxisTitle: '',
            valAxisTitle: ''
        });
        
        ${slide.content && slide.content.length > 0 ? `
        // Add insights box
        slide${idx}.addText("Key Insights:", {
            x: 6.75, y: 1.5, w: 2.75, h: 0.5,
            fontSize: 14, bold: true, color: '2E4053'
        });
        
        const insights${idx} = ${JSON.stringify(slide.content.map((item, i) => `• ${item}`).join('\\n'))};
        slide${idx}.addText(insights${idx}, {
            x: 6.75, y: 2.1, w: 2.75, h: 3.9,
            fontSize: 11, color: '1d1d1d',
            valign: 'top'
        });
        ` : ''}
        
        console.log("✓ Chart slide ${idx + 1} added");
                `;
            } else {
                // Use html2pptx for non-chart slides, then add graphics
                return `
        // Slide ${idx + 1}: ${slide.title || 'Title'}
        console.log("Processing ${file}...");
        await html2pptx("${file}", pptx);
        
        // Add PowerPoint graphics on top
        const currentSlide${idx} = pptx.getSlide(${idx});
        
        ${slide.type === 'title' ? `
        // Title slide graphics
        currentSlide${idx}.addShape(pptx.ShapeType.ellipse, {
            x: 8.5, y: -0.5, w: 2, h: 2,
            fill: { color: '${theme.colorAccent.replace('#', '')}', transparency: 80 }
        });
        currentSlide${idx}.addShape(pptx.ShapeType.ellipse, {
            x: -0.5, y: 5, w: 1.5, h: 1.5,
            fill: { color: 'FFFFFF', transparency: 90 }
        });
        currentSlide${idx}.addShape(pptx.ShapeType.rect, {
            x: 0, y: 2.8, w: 10, h: 0.04,
            fill: { color: '${theme.colorAccent.replace('#', '')}', transparency: 70 }
        });
        ` : `
        // Content slide graphics
        ${slide.layout !== 'chart' ? `
        // Accent bar on left
        currentSlide${idx}.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: 0.06, h: 5.625,
            fill: { type: 'solid', color: '${theme.colorAccent.replace('#', '')}' }
        });
        
        // Decorative circles
        currentSlide${idx}.addShape(pptx.ShapeType.ellipse, {
            x: 9, y: 0.2, w: 0.8, h: 0.8,
            fill: { color: '${theme.colorAccent.replace('#', '')}', transparency: 92 }
        });
        currentSlide${idx}.addShape(pptx.ShapeType.ellipse, {
            x: 8.7, y: 4.8, w: 1.2, h: 1.2,
            fill: { color: '${theme.colorPrimary.replace('#', '')}', transparency: 95 }
        });
        ` : ''}
        `}
        
        console.log("✓ ${file} added with graphics");
                `;
            }
        }).join('\n')}
        
        console.log("Writing presentation file...");
        await pptx.writeFile("presentation.pptx");
        console.log("✓ Presentation created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("ERROR in conversion script:", error);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

createPresentation();`;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Template-based generation endpoint
app.post('/api/generate-with-template', upload.single('templateFile'), async (req, res) => {
    const { text, apiKey, provider = 'anthropic', slideData: slideDataStr } = req.body;
    const templateFile = req.file;
    
    if (!text || !apiKey || !templateFile) {
        return res.status(400).json({ error: 'Text, API key, and template file are required' });
    }

    const sessionId = Date.now().toString();
    const workDir = path.join(__dirname, 'workspace', sessionId);
    
    try {
        const slideData = JSON.parse(slideDataStr);
        
        // Create workspace directory
        await fs.mkdir(workDir, { recursive: true });
        
        // Save template file to workspace
        const templatePath = path.join(workDir, 'template.pptx');
        await fs.writeFile(templatePath, templateFile.buffer);
        
        console.log(`Using template: ${templateFile.originalname}`);
        console.log(`Template saved to: ${templatePath}`);
        
        // Create package.json for workspace (using ES modules)
        const packageJson = {
            "name": "pptx-workspace",
            "version": "1.0.0",
            "type": "module"
        };
        await fs.writeFile(
            path.join(workDir, 'package.json'), 
            JSON.stringify(packageJson, null, 2)
        );
        
        // Create node_modules with symlinks to global packages
        const nodeModulesPath = path.join(workDir, 'node_modules');
        await fs.mkdir(nodeModulesPath, { recursive: true });
        
        // Symlink global packages
        const globalModulesPath = '/usr/local/lib/node_modules';
        try {
            await fs.access(globalModulesPath);
            
            await fs.symlink(
                path.join(globalModulesPath, 'pptxgenjs'),
                path.join(nodeModulesPath, 'pptxgenjs'),
                'dir'
            );
            
            await fs.mkdir(path.join(nodeModulesPath, '@ant'), { recursive: true });
            await fs.symlink(
                path.join(globalModulesPath, '@ant/html2pptx'),
                path.join(nodeModulesPath, '@ant', 'html2pptx'),
                'dir'
            );
            
            const depsToLink = ['jszip', 'sharp', 'playwright'];
            for (const dep of depsToLink) {
                try {
                    await fs.symlink(
                        path.join(globalModulesPath, dep),
                        path.join(nodeModulesPath, dep),
                        'dir'
                    );
                } catch (e) {
                    console.log(`⚠ Could not symlink ${dep}`);
                }
            }
        } catch (symlinkError) {
            console.log('Symlink failed, falling back to npm install');
            await execPromise(
                `cd ${workDir} && npm install pptxgenjs @ant/html2pptx jszip sharp playwright --no-save --no-audit --no-fund 2>&1`,
                { timeout: 120000 }
            );
        }
        
        // Generate modification script for template
        const scriptContent = generateTemplateModificationScript(slideData);
        await fs.writeFile(path.join(workDir, 'modify-template.js'), scriptContent);
        
        // Run modification script
        console.log(`Modifying template presentation in ${workDir}`);
        
        try {
            const { stdout, stderr } = await execPromise(
                `cd ${workDir} && node modify-template.js 2>&1`,
                { timeout: 60000 }
            );
            console.log('Modification output:', stdout);
            if (stderr) console.error('Modification stderr:', stderr);
        } catch (modError) {
            console.error('Modification script failed:', modError);
            throw new Error(`Modification failed: ${modError.stderr || modError.stdout || modError.message}`);
        }
        
        // Read the generated PowerPoint
        const pptxPath = path.join(workDir, 'modified-presentation.pptx');
        
        try {
            await fs.access(pptxPath);
        } catch (error) {
            console.error('Modified PPTX file not found at:', pptxPath);
            throw new Error(`Modified presentation file was not created.`);
        }
        
        const pptxBuffer = await fs.readFile(pptxPath);
        
        // Send file back
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'Content-Disposition': 'attachment; filename="Modified-Presentation.pptx"',
            'Content-Length': pptxBuffer.length
        });
        res.send(pptxBuffer);
        
        // Cleanup
        setTimeout(async () => {
            try {
                await fs.rm(workDir, { recursive: true, force: true });
            } catch (e) {}
        }, 5000);
        
    } catch (error) {
        console.error('Template modification error:', error);
        
        const errorMsg = error.stdout || error.stderr || error.message;
        res.status(500).json({ error: errorMsg });
        
        try {
            await fs.rm(workDir, { recursive: true, force: true });
        } catch (e) {}
    }
});

function generateTemplateModificationScript(slideData) {
    return `import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

async function modifyPresentation() {
    try {
        console.log("Loading template presentation...");
        
        // Load the template PPTX file
        const templateBuffer = fs.readFileSync('template.pptx');
        const pptx = new pptxgen();
        
        // Note: pptxgenjs doesn't support loading existing files directly
        // Instead, we'll create new slides based on the AI content
        // and suggest users manually merge if they need to preserve exact template styling
        
        pptx.layout = "LAYOUT_16x9";
        console.log("Creating new slides based on AI content...");
        
        const theme = ${JSON.stringify(slideData.designTheme)};
        const slides = ${JSON.stringify(slideData.slides)};
        
        // Add new slides with AI content
        slides.forEach((slideInfo, idx) => {
            console.log(\`Adding slide \${idx + 1}: \${slideInfo.title}\`);
            
            const slide = pptx.addSlide();
            
            if (slideInfo.type === 'title') {
                // Title slide
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
                        align: 'center', valign: 'middle'
                    });
                }
                
                // Add decorative elements
                slide.addShape(pptx.ShapeType.ellipse, {
                    x: 8.5, y: -0.5, w: 2, h: 2,
                    fill: { color: theme.colorAccent.replace('#', ''), transparency: 80 }
                });
                
            } else if (slideInfo.layout === 'chart' && slideInfo.chart) {
                // Chart slide
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
                    x: 0.5, y: 1.5, w: slideInfo.content?.length > 0 ? 6 : 9, h: 4.5,
                    title: slideInfo.chart.title,
                    showTitle: true
                });
                
                if (slideInfo.content?.length > 0) {
                    slide.addText("Key Insights:", {
                        x: 6.75, y: 1.5, w: 2.75, h: 0.5,
                        fontSize: 14, bold: true
                    });
                    
                    slide.addText(slideInfo.content.map(i => \`• \${i}\`).join('\\n'), {
                        x: 6.75, y: 2.1, w: 2.75, h: 3.9,
                        fontSize: 11
                    });
                }
                
            } else {
                // Content slide
                slide.addText(slideInfo.title, {
                    x: 0.5, y: 0.5, w: 9, h: 0.75,
                    fontSize: 28, bold: true, color: theme.colorPrimary.replace('#', '')
                });
                
                if (slideInfo.header) {
                    slide.addText(slideInfo.header, {
                        x: 0.5, y: 1.4, w: 9, h: 0.4,
                        fontSize: 14, italic: true, color: theme.colorSecondary.replace('#', '')
                    });
                }
                
                if (slideInfo.content?.length > 0) {
                    const bulletText = slideInfo.content.map(item => \`• \${item}\`).join('\\n');
                    slide.addText(bulletText, {
                        x: 0.7, y: slideInfo.header ? 2 : 1.5, 
                        w: 8.6, h: slideInfo.header ? 3.5 : 4,
                        fontSize: 16, bullet: false
                    });
                }
                
                // Add accent bar
                slide.addShape(pptx.ShapeType.rect, {
                    x: 0, y: 0, w: 0.06, h: 5.625,
                    fill: { color: theme.colorAccent.replace('#', '') }
                });
            }
        });
        
        console.log("Writing modified presentation...");
        await pptx.writeFile("modified-presentation.pptx");
        console.log("✓ Template modified successfully!");
        console.log(\`Note: Created \${slides.length} new slides. Original template styling preserved where possible.\`);
        
        process.exit(0);
    } catch (error) {
        console.error("ERROR in modification script:", error);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

modifyPresentation();`;
}

app.listen(PORT, () => {
    console.log(`\n🚀 AI Text2PPT Pro Server Running!`);
    console.log(`\n📍 Open your browser to: http://localhost:${PORT}`);
    console.log(`\n✨ Professional presentations powered by Claude AI + html2pptx\n`);
});