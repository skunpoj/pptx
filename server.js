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

// Content generation endpoint - generates presentation content from a prompt
app.post('/api/generate-content', async (req, res) => {
    const { prompt, apiKey, provider = 'anthropic', numSlides = 6, generateImages = false } = req.body;
    
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

        const content = await callAI(provider, apiKey, userPrompt);
        res.json({ content });
        
    } catch (error) {
        console.error('Content generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// File processing endpoint - converts uploaded files to presentation content
app.post('/api/process-files', async (req, res) => {
    const { files, apiKey, provider = 'anthropic' } = req.body;
    
    if (!files || !Array.isArray(files) || files.length === 0 || !apiKey) {
        return res.status(400).json({ error: 'Files and API key are required' });
    }
    
    try {
        // Combine all file contents
        let combinedContent = '';
        files.forEach(file => {
            combinedContent += `\n\n=== File: ${file.filename} ===\n\n${file.content}`;
        });
        
        const userPrompt = `You are a professional content writer for presentations. I will provide you with content from ${files.length} file(s). Your task is to analyze and synthesize this content into a well-structured presentation narrative.

FILES CONTENT:
${combinedContent}

INSTRUCTIONS:
1. Analyze all the provided files and extract the key information
2. Synthesize the content into a coherent presentation narrative
3. Structure the content into 5-8 logical sections suitable for slides
4. Each section should be a substantial paragraph covering a key aspect
5. Maintain the important details, data, and insights from the source files
6. Write in a clear, professional style appropriate for business presentations
7. Organize content logically with a clear flow and narrative arc

OUTPUT FORMAT:
Write the synthesized content as well-structured paragraphs separated by blank lines. Do NOT include any JSON, markdown formatting, or file references. Just write the presentation content directly.

Generate the synthesized presentation content now:`;

        const content = await callAI(provider, apiKey, userPrompt);
        res.json({ content });
        
    } catch (error) {
        console.error('File processing error:', error);
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
        const userPrompt = `You are a presentation design expert specializing in consultant-style presentations. Analyze the user's content below and create a structured presentation outline based EXACTLY on what they provided.

CRITICAL REQUIREMENTS:
1. Use the ACTUAL content provided by the user below
2. Create 4-12 slides total (including title slide)
3. Design in CONSULTANT STYLE with strategic frameworks:
   - Use clear headers and sub-headers
   - Include strategic insights and key takeaways
   - Add visual indicators like arrows (→, ⇒, ↔), boxes (□, ■), and icons (✓, ★, ◆)
   - Structure content with frameworks (e.g., "Key Drivers →", "Impact:", "Next Steps:")
   - Keep bullets concise but impactful (under 15 words each)
4. Advanced graphical representation:
   - Use layout types: "bullets", "two-column", "three-column", "framework", "process-flow"
   - For process flows: use arrows and numbered steps
   - For comparisons: use side-by-side columns with headers
   - For frameworks: use structured sections with visual separators
5. Choose a professional color palette that matches the content theme
6. Extract the main title from the user's content for the title slide
7. Include image placeholders if content mentions [IMAGE: ...] with descriptions

Layout options:
- "bullets": Standard bullet list
- "two-column": Split content into two columns
- "three-column": Split content into three columns  
- "framework": Structured framework with sections and headers
- "process-flow": Step-by-step process with arrows and numbers

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
      "title": "Slide Title with Strategic Header",
      "content": ["✓ Key insight with impact", "→ Strategic direction", "■ Core principle"],
      "layout": "bullets",
      "imageDescription": "Optional: description of image to generate"
    },
    {
      "type": "content", 
      "title": "Framework or Model Name",
      "content": ["Section A: Details", "Section B: More details"],
      "layout": "two-column",
      "header": "Optional strategic context or question"
    },
    {
      "type": "content",
      "title": "Process or Journey",
      "content": ["1. First step → Action", "2. Second step → Result", "3. Third step → Outcome"],
      "layout": "process-flow"
    }
  ]
}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.

USER'S ACTUAL CONTENT TO CONVERT:
${text}`;

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
            const userPrompt = `You are a presentation design expert specializing in consultant-style presentations. Analyze the user's content below and create a structured presentation outline based EXACTLY on what they provided.

CRITICAL REQUIREMENTS:
1. Use the ACTUAL content provided by the user below
2. Create 4-12 slides total (including title slide)
3. Design in CONSULTANT STYLE with strategic frameworks:
   - Use clear headers and sub-headers
   - Include strategic insights and key takeaways
   - Add visual indicators like arrows (→, ⇒, ↔), boxes (□, ■), and icons (✓, ★, ◆)
   - Structure content with frameworks (e.g., "Key Drivers →", "Impact:", "Next Steps:")
   - Keep bullets concise but impactful (under 15 words each)
4. Advanced graphical representation:
   - Use layout types: "bullets", "two-column", "three-column", "framework", "process-flow"
   - For process flows: use arrows and numbered steps
   - For comparisons: use side-by-side columns with headers
   - For frameworks: use structured sections with visual separators
5. Choose a professional color palette that matches the content theme
6. Extract the main title from the user's content for the title slide
7. Include image placeholders if content mentions [IMAGE: ...] with descriptions

Layout options:
- "bullets": Standard bullet list
- "two-column": Split content into two columns
- "three-column": Split content into three columns  
- "framework": Structured framework with sections and headers
- "process-flow": Step-by-step process with arrows and numbers

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
      "title": "Slide Title with Strategic Header",
      "content": ["✓ Key insight with impact", "→ Strategic direction", "■ Core principle"],
      "layout": "bullets",
      "imageDescription": "Optional: description of image to generate"
    },
    {
      "type": "content", 
      "title": "Framework or Model Name",
      "content": ["Section A: Details", "Section B: More details"],
      "layout": "two-column",
      "header": "Optional strategic context or question"
    },
    {
      "type": "content",
      "title": "Process or Journey",
      "content": ["1. First step → Action", "2. Second step → Result", "3. Third step → Outcome"],
      "layout": "process-flow"
    }
  ]
}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.

USER'S ACTUAL CONTENT TO CONVERT:
${text}`;

            const responseText = await callAI(provider, apiKey, userPrompt);
            
            // Clean up the response text to extract JSON
            let cleanedText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            
            // Try to parse JSON with better error handling
            try {
                finalSlideData = JSON.parse(cleanedText);
            } catch (parseError) {
                console.error('JSON Parse Error in generate:', parseError);
                console.error('Response text:', cleanedText);
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
        
        // Check if file exists before reading
        try {
            await fs.access(pptxPath);
        } catch (error) {
            console.error('PPTX file not found at:', pptxPath);
            throw new Error(`Failed to create presentation file. Path: ${pptxPath}`);
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
<body class="col" style="width: 960px; height: 540px; padding: 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2rem; font-weight: bold; margin: 0 0 1rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1rem; margin-bottom: 1rem;">${escapeHtml(slide.header)}</p>` : ''}
    <div class="fill-height row gap-lg items-fill-width" style="display: flex; gap: 1.5rem;">
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
<body class="col" style="width: 960px; height: 540px; padding: 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1.5rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin-bottom: 1rem; font-weight: 600;">${escapeHtml(slide.header)}</p>` : ''}
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
<body class="col" style="width: 960px; height: 540px; padding: 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1rem 0; border-bottom: 3px solid ${theme.colorAccent}; padding-bottom: 0.5rem;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin-bottom: 1.5rem; font-style: italic;">${escapeHtml(slide.header)}</p>` : ''}
    <div class="fill-height" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
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
<body class="col" style="width: 960px; height: 540px; padding: 2rem;">
    <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0 0 1.5rem 0;">
        ${escapeHtml(slide.title)}
    </h2>
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin-bottom: 1.5rem;">${escapeHtml(slide.header)}</p>` : ''}
    <div class="fill-height" style="display: flex; flex-direction: column; justify-content: center; gap: 1rem;">
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
    
    // Standard bullet list (default)
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
    ${slide.header ? `<p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin-bottom: 1rem;">${escapeHtml(slide.header)}</p>` : ''}
    ${slide.imageDescription ? `<div style="background: #f0f4ff; border: 2px dashed ${theme.colorAccent}; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; text-align: center; color: ${theme.colorSecondary}; font-style: italic;">📸 Image: ${escapeHtml(slide.imageDescription)}</div>` : ''}
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