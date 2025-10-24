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

// Main endpoint to generate presentation
app.post('/api/generate', async (req, res) => {
    const { text, apiKey } = req.body;
    
    if (!text || !apiKey) {
        return res.status(400).json({ error: 'Text and API key are required' });
    }

    const sessionId = Date.now().toString();
    const workDir = path.join(__dirname, 'workspace', sessionId);
    
    try {
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
            await fs.symlink(
                path.join(globalModulesPath, 'pptxgenjs'),
                path.join(nodeModulesPath, 'pptxgenjs'),
                'dir'
            );
            await fs.symlink(
                path.join(globalModulesPath, '@ant'),
                path.join(nodeModulesPath, '@ant'),
                'dir'
            );
            console.log('Symlinks created for dependencies');
        } catch (symlinkError) {
            // Fallback: If symlinks fail, try copying
            console.log('Symlink failed, falling back to npm install');
            await execPromise(`cd ${workDir} && npm install pptxgenjs @ant/html2pptx --no-save --no-audit --no-fund 2>&1`);
        }
        
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
        responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const slideData = JSON.parse(responseText);
        
        // Generate CSS file with theme
        const cssContent = generateCSS(slideData.designTheme);
        await fs.writeFile(path.join(workDir, 'theme.css'), cssContent);
        
        // Generate HTML slides
        const htmlFiles = [];
        for (let i = 0; i < slideData.slides.length; i++) {
            const slide = slideData.slides[i];
            const htmlContent = generateSlideHTML(slide, slideData.designTheme);
            const filename = `slide${i}.html`;
            await fs.writeFile(path.join(workDir, filename), htmlContent);
            htmlFiles.push(filename);
        }
        
        // Generate conversion script
        const scriptContent = generateConversionScript(htmlFiles, slideData.slides);
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
    return `import pptxgen from "pptxgenjs";
import { html2pptx } from "@ant/html2pptx";

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