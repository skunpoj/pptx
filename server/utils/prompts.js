/**
 * AI Prompt Templates
 * Centralized location for all AI prompt templates to avoid duplication
 */

/**
 * Generates the base slide design instructions (used in all prompts)
 * @returns {string} - Base design instructions
 */
function getBaseDesignInstructions() {
    return `CRITICAL REQUIREMENTS:
1. Use the ACTUAL content provided by the user below
2. Create 4-12 slides total (including title slide)
3. Design in CONSULTANT STYLE with strategic frameworks:
   - Use clear headers and sub-headers
   - Include strategic insights and key takeaways
   - Add visual indicators like arrows (→, ⇒, ↔), boxes (□, ■), and icons (✓, ★, ◆)
   - Structure content with frameworks (e.g., "Key Drivers →", "Impact:", "Next Steps:")
   - Keep bullets concise but impactful (under 15 words each)
3b. POWERPOINT GRAPHICS - Include visual design elements:
   - Specify background shapes: "circle", "rectangle", "roundRect", "triangle"
   - Use colored boxes/callouts for emphasis
   - Add decorative elements (accent bars, corner graphics)
   - Specify icon placements (use emoji icons like 💡, 📊, 🎯, 🚀, 💰, 📈, etc.)
   - Include visual separators and section dividers
4. Advanced graphical representation:
   - Use layout types: "bullets", "two-column", "three-column", "framework", "process-flow", "chart"
   - For process flows: use arrows and numbered steps
   - For comparisons: use side-by-side columns with headers
   - For frameworks: use structured sections with visual separators
   - For data/metrics: use charts to visualize trends and comparisons
5. Choose a professional color palette that matches the content theme
5b. SUGGEST A THEME KEY from these options based on content:
   - "corporate-blue": business, corporate, finance
   - "vibrant-purple": tech, creative, marketing  
   - "forest-green": environment, health, sustainability
   - "ocean-teal": tech, healthcare, education
   - "sunset-orange": marketing, retail, creative
   - "royal-burgundy": luxury, finance, executive
   - "midnight-navy": business, consulting, corporate
   - "sage-olive": wellness, education, nonprofit
   Add "suggestedThemeKey" field with your recommendation
6. Extract the main title from the user's content for the title slide
7. Include image placeholders if content mentions [IMAGE: ...] with descriptions
8. CREATE CHARTS when content includes:
   - Numerical data, statistics, or metrics
   - Trends over time (quarterly, yearly, monthly data)
   - Comparisons between categories
   - Market share, percentages, or proportions
   - Growth rates, performance metrics, financial data`;
}

/**
 * Gets layout and chart type options
 * @returns {string} - Layout options description
 */
function getLayoutOptions() {
    return `Layout options:
- "bullets": Standard bullet list
- "two-column": Split content into two columns
- "three-column": Split content into three columns  
- "framework": Structured framework with sections and headers
- "process-flow": Step-by-step process with arrows and numbers
- "chart": Data visualization slide

Chart types (use when appropriate):
- "bar": Horizontal bars for comparing categories
- "column": Vertical bars for comparing values
- "line": Line chart for trends over time
- "pie": Pie chart for showing proportions/percentages
- "area": Area chart for cumulative trends`;
}

/**
 * Gets the JSON schema template for slide structure
 * @returns {string} - JSON schema
 */
function getSlideJSONSchema() {
    return `{
  "suggestedThemeKey": "corporate-blue",
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
      "imageDescription": "Optional: description of image to generate",
      "graphics": {
        "accentBar": true,
        "backgroundShapes": [{"type": "circle", "position": "top-right", "color": "accent", "opacity": 0.1}],
        "icons": [{"emoji": "🎯", "position": "top-left"}],
        "colorBoxes": [{"text": "Key Takeaway", "color": "primary"}]
      }
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
    },
    {
      "type": "content",
      "title": "Key Metrics & Performance",
      "layout": "chart",
      "chart": {
        "type": "column",
        "title": "Quarterly Revenue Growth",
        "data": {
          "labels": ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024"],
          "datasets": [
            {
              "name": "Revenue ($M)",
              "values": [45, 52, 68, 73]
            }
          ]
        }
      },
      "content": ["23% quarter-over-quarter growth", "Strong momentum in Q3 and Q4", "Exceeded annual targets by 15%"]
    }
  ]
}`;
}

/**
 * Generates prompt for presentation preview
 * @param {string} text - User's content
 * @returns {string} - Complete AI prompt
 */
function getPreviewPrompt(text) {
    return `You are a presentation design expert specializing in consultant-style presentations. Analyze the user's content below and create a structured presentation outline based EXACTLY on what they provided.

${getBaseDesignInstructions()}

${getLayoutOptions()}

Output as JSON:
${getSlideJSONSchema()}

DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.

USER'S ACTUAL CONTENT TO CONVERT:
${text}`;
}

/**
 * Generates prompt for content generation from user idea
 * @param {string} prompt - User's idea/prompt
 * @param {number} numSlides - Number of slides to generate
 * @param {boolean} generateImages - Whether to include image placeholders
 * @returns {string} - Complete AI prompt
 */
function getContentGenerationPrompt(prompt, numSlides = 6, generateImages = false) {
    const imageInstructions = generateImages 
        ? `\n7. For slides that would benefit from visuals, include image placeholders like: [IMAGE: description of what image should show]\n8. Suggest relevant images for data visualization, concepts, or key points`
        : '';
    
    return `You are a professional content writer for presentations. Based on the following idea/prompt, generate comprehensive content that can be used to create a presentation with EXACTLY ${numSlides} slides (including the title slide).

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
}

/**
 * Generates prompt for file processing
 * @param {Array} files - Array of file objects with {filename, content}
 * @returns {string} - Complete AI prompt
 */
function getFileProcessingPrompt(files) {
    let combinedContent = '';
    files.forEach(file => {
        combinedContent += `\n\n=== File: ${file.filename} ===\n\n${file.content}`;
    });
    
    return `You are a professional content writer for presentations. I will provide you with content from ${files.length} file(s). Your task is to analyze and synthesize this content into a well-structured presentation narrative.

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
}

module.exports = {
    getPreviewPrompt,
    getContentGenerationPrompt,
    getFileProcessingPrompt,
    getBaseDesignInstructions,
    getLayoutOptions,
    getSlideJSONSchema
};

