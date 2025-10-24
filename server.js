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
app.use(express.static('public'));

// Content generation endpoint - generates presentation content from a prompt
app.post('/api/generate-content', async (req, res) => {
    const { prompt, apiKey } = req.body;
    
    if (!prompt || !apiKey) {
        return res.status(400).json({ error: 'Prompt and API key are required' });
    }
    
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey.trim(),
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 3000,
                messages: [{
                    role: "user",
                    content: `You are a professional content writer for presentations. Based on the following idea/prompt, generate comprehensive content that can be used to create a presentation.

USER PROMPT:
${prompt}

INSTRUCTIONS:
1. Generate 4-6 paragraphs of well-structured content
2. Each paragraph should cover a key aspect or topic
3. Write in a clear, professional style
4. Include specific details, examples, or data points where appropriate
5. Make the content informative and engaging
6. Focus on the main points that would make good presentation slides

OUTPUT FORMAT:
Write the content as plain text paragraphs separated by blank lines. Do NOT include any JSON, markdown formatting, or structural elements. Just write the presentation content directly.

Generate the content now:`
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.content[0].text.trim();
        
        res.json({ content });
        
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Preview endpoint - returns slide structure without generating PPTX
app.post('/api/preview', async (req, res) => {
    const { text, apiKey } = req.body;
    
    if (!text || !apiKey) {
        return res.status(400).json({ error: 'Text and API key are required' });
    }
    
    try {
        // Call Claude API to structure content
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
                    content: `You are a presentation design expert. Analyze this content and create a structured presentation outline.

CRITICAL REQUIREMENTS:
1. Create 4-8 slides total (including title slide)
2. Keep content BRIEF - presentations should be concise:
   - Bullet points: 3-5 per slide MAX
   - Each bullet: under 12 words
   - Paragraphs: 1-2 sentences MAX
3. Choose a color palette that matches the content theme (refer to options like Classic Blue, Teal & Coral, Bold Red, etc.)
4. Design approach: Consider what visual style fits this topic

Output as JSON:
{
  "designTheme": {
    "name": "Theme name",
    "description": "Why this theme fits the content",
    "colorPrimary": "#1C2833",
    "colorSecondary": "#2E4053",
    "colorAccent": "#F39C12",
    "colorBackground": "#FFFFFF",
    "colorText": "#1d1d1d"
  },
  "slides": [
    {
      "type": "title",
      "title": "Main Title",
      "subtitle": "Optional subtitle"
    },
    {
      "type": "content",
      "title": "Slide Title",
      "content": ["Brief point 1", "Brief point 2", "Brief point 3"],
      "layout": "bullets"
    },
    {
      "type": "content", 
      "title": "Slide Title",
      "content": ["Point 1", "Point 2"],
      "layout": "two-column"
    }
  ]
}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.

Content to convert:
${text}`
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        let responseText = data.content[0].text;
        
        // Clean up the response text to extract JSON
        responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        
        // Try to parse JSON with better error handling
        let slideData;
        try {
            slideData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response text:', responseText);
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
    const { text, apiKey, slideData } = req.body;
    
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
            // Call Claude API to structure content
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
                        content: `You are a presentation design expert. Analyze this content and create a structured presentation outline.

CRITICAL REQUIREMENTS:
1. Create 4-8 slides total (including title slide)
2. Keep content BRIEF - presentations should be concise:
   - Bullet points: 3-5 per slide MAX
   - Each bullet: under 12 words
   - Paragraphs: 1-2 sentences MAX
3. Choose a color palette that matches the content theme (refer to options like Classic Blue, Teal & Coral, Bold Red, etc.)
4. Design approach: Consider what visual style fits this topic

Output as JSON:
{
  "designTheme": {
    "name": "Theme name",
    "description": "Why this theme fits the content",
    "colorPrimary": "#1C2833",
    "colorSecondary": "#2E4053",
    "colorAccent": "#F39C12",
    "colorBackground": "#FFFFFF",
    "colorText": "#1d1d1d"
  },
  "slides": [
    {
      "type": "title",
      "title": "Main Title",
      "subtitle": "Optional subtitle"
    },
    {
      "type": "content",
      "title": "Slide Title",
      "content": ["Brief point 1", "Brief point 2", "Brief point 3"],
      "layout": "bullets"
    },
    {
      "type": "content", 
      "title": "Slide Title",
      "content": ["Point 1", "Point 2"],
      "layout": "two-column"
    }
  ]
}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.

Content to convert:
${text}`
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            let responseText = data.content[0].text;
            
            // Clean up the response text to extract JSON
            responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            
            // Try to parse JSON with better error handling
            try {
                finalSlideData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON Parse Error in generate:', parseError);
                console.error('Response text:', responseText);
                throw new Error('Failed to parse AI response. Please try again.');
            }
            
            // Validate the structure
            if (!finalSlideData.designTheme || !finalSlideData.slides || !Array.isArray(finalSlideData.slides)) {
                throw new Error('Invalid slide structure received from AI');
            }
        }
        
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
            // Create symlinks for the packages
            await fs.symlink(
                path.join(globalModulesPath, 'pptxgenjs'),
                path.join(nodeModulesPath, 'pptxgenjs'),
                'dir'
            );
            
            // Create @ant directory for scoped package
            await fs.mkdir(path.join(nodeModulesPath, '@ant'), { recursive: true });
            await fs.symlink(
                path.join(globalModulesPath, '@ant/html2pptx'),
                path.join(nodeModulesPath, '@ant', 'html2pptx'),
                'dir'
            );
            
            // Also symlink dependencies that pptxgenjs needs
            const depsToLink = ['jszip', 'sharp', 'playwright'];
            for (const dep of depsToLink) {
                try {
                    await fs.symlink(
                        path.join(globalModulesPath, dep),
                        path.join(nodeModulesPath, dep),
                        'dir'
                    );
                } catch (e) {
                    // Dependency might not exist or already linked
                }
            }
            
            console.log('Symlinks created for dependencies');
        } catch (symlinkError) {
            // Fallback: If symlinks fail, try copying
            console.log('Symlink failed, falling back to npm install:', symlinkError.message);
            await execPromise(`cd ${workDir} && npm install pptxgenjs @ant/html2pptx --no-save --no-audit --no-fund 2>&1`);
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
        }
        
        // Generate conversion script
        const scriptContent = generateConversionScript(htmlFiles, finalSlideData.slides);
        await fs.writeFile(path.join(workDir, 'convert.js'), scriptContent);
        
        // Run conversion
        console.log(`Running conversion in ${workDir}`);
        const { stdout, stderr } = await execPromise(
            `cd ${workDir} && node convert.js 2>&1`
        );
        console.log('Conversion output:', stdout);
        if (stderr) console.error('Conversion stderr:', stderr);
        
        // Read the generated PowerPoint
        const pptxPath = path.join(workDir, 'presentation.pptx');
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
<body class="col center" style="width: 960px; height: 540px; background: ${theme.colorPrimary};">
    <h1 style="color: ${theme.colorBackground}; font-size: 3rem; font-weight: bold; text-align: center; margin: 0; padding: 0 2rem;">
        ${escapeHtml(slide.title)}
    </h1>
    ${slide.subtitle ? `<h2 style="color: ${theme.colorBackground}; font-size: 1.5rem; opacity: 0.9; text-align: center; margin-top: 1rem;">
        ${escapeHtml(slide.subtitle)}
    </h2>` : ''}
</body>
</html>`;
    }
    
    // Content slide
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
<body class="col" style="width: 960px; height: 540px; padding: 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1.5rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    <div class="fill-height row gap-lg items-fill-width" style="display: flex; gap: 2rem;">
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
    
    // Standard bullet list
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body class="col" style="width: 960px; height: 540px; padding: 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1.5rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    <div class="fill-height" style="display: flex; flex-direction: column; justify-content: center;">
        <ul style="margin: 0; padding-left: 1.5rem; font-size: 1.25rem; line-height: 1.8;">
            ${slide.content.map(item => `<li style="margin-bottom: 0.75rem;">${escapeHtml(item)}</li>`).join('')}
        </ul>
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
    const pptx = new pptxgen();
    pptx.layout = "LAYOUT_16x9";
    
    ${htmlFiles.map((file, idx) => `
    // Slide ${idx + 1}: ${slides[idx].title || 'Title'}
    await html2pptx("${file}", pptx);
    `).join('\n')}
    
    await pptx.writeFile("presentation.pptx");
    console.log("Presentation created successfully!");
}

createPresentation().catch(console.error);`;
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

app.listen(PORT, () => {
    console.log(`\n🚀 AI Text2PPT Pro Server Running!`);
    console.log(`\n📍 Open your browser to: http://localhost:${PORT}`);
    console.log(`\n✨ Professional presentations powered by Claude AI + html2pptx\n`);
});