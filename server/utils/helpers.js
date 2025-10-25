/**
 * Common Helper Utilities
 * Reusable functions used across the application
 */

/**
 * Generates CSS variables and classes from theme object
 * @param {Object} theme - Theme configuration
 * @returns {string} - CSS with theme variables and utility classes
 */
function generateCSS(theme) {
    return `:root {
    --color-primary: ${theme.colorPrimary};
    --color-secondary: ${theme.colorSecondary};
    --color-accent: ${theme.colorAccent};
    --color-surface: ${theme.colorBackground};
    --color-surface-foreground: ${theme.colorText};
    --font-family-display: Arial, sans-serif;
    --font-family-content: Arial, sans-serif;
}

/* Layout utility classes */
.col {
    display: flex;
    flex-direction: column;
}

.center {
    display: flex;
    align-items: center;
    justify-content: center;
}

.fill-height {
    flex: 1;
}

.fit {
    max-width: 100%;
}

/* Global body styling */
body {
    margin: 0;
    padding: 0;
    font-family: var(--font-family-content);
    color: var(--color-surface-foreground);
}`;
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
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

/**
 * Validates and sanitizes slide data to prevent overflow errors
 * Automatically splits slides with too many bullets into multiple slides
 * @param {Object} slideData - Slide data to validate and sanitize
 * @throws {Error} - If validation fails
 * @returns {Object} - Sanitized slide data with split slides
 */
function validateSlideData(slideData) {
    if (!slideData) {
        throw new Error('No slide data provided');
    }
    
    if (!slideData.designTheme) {
        throw new Error('Missing design theme in slide data');
    }
    
    if (!slideData.slides || !Array.isArray(slideData.slides)) {
        throw new Error('Invalid slides array in slide data');
    }
    
    if (slideData.slides.length === 0) {
        throw new Error('No slides in slide data');
    }
    
    // Split oversized slides into multiple slides
    slideData.slides = splitOversizedSlides(slideData.slides);
    
    return slideData;
}

/**
 * Splits slides with too many bullets into multiple slides
 * @param {Array} slides - Array of slide objects
 * @returns {Array} - New slides array with split slides
 */
function splitOversizedSlides(slides) {
    const MAX_BULLETS = 7;
    const newSlides = [];
    
    for (const slide of slides) {
        // Skip title and chart slides
        if (slide.type === 'title' || (slide.layout === 'chart' && slide.chart)) {
            newSlides.push(slide);
            continue;
        }
        
        // Check if slide has too many bullets
        if (slide.content && Array.isArray(slide.content) && slide.content.length > MAX_BULLETS) {
            console.log(`📄 Splitting slide "${slide.title}" (${slide.content.length} bullets) into multiple slides...`);
            
            // Calculate how many parts we need
            const numParts = Math.ceil(slide.content.length / MAX_BULLETS);
            
            for (let i = 0; i < numParts; i++) {
                const start = i * MAX_BULLETS;
                const end = Math.min(start + MAX_BULLETS, slide.content.length);
                const partContent = slide.content.slice(start, end);
                
                // Create new slide for this part
                const partSlide = {
                    ...slide,
                    title: numParts > 1 ? `${slide.title} - Part ${i + 1}` : slide.title,
                    content: partContent
                };
                
                newSlides.push(partSlide);
                console.log(`   ✓ Part ${i + 1}/${numParts}: ${partContent.length} bullets`);
            }
        } else {
            // Slide is fine, keep as is
            newSlides.push(slide);
        }
    }
    
    const addedSlides = newSlides.length - slides.length;
    if (addedSlides > 0) {
        console.log(`✅ Split complete: ${slides.length} → ${newSlides.length} slides (+${addedSlides} slides)`);
    }
    
    return newSlides;
}

/**
 * Legacy function - kept for backwards compatibility
 * @deprecated Use splitOversizedSlides instead
 */
function sanitizeSlide(slide) {
    return slide;
}

/**
 * Parses JSON from AI response, handling common formatting issues
 * @param {string} responseText - Raw AI response
 * @returns {Object} - Parsed JSON object
 * @throws {Error} - If parsing fails
 */
function parseAIResponse(responseText) {
    // Clean up common AI response formatting
    let cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    
    try {
        const data = JSON.parse(cleanedText);
        return data;
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response text preview:', cleanedText.substring(0, 500));
        throw new Error('Failed to parse AI response. Please try again.');
    }
}

/**
 * Creates a unique session ID for workspace isolation
 * @returns {string} - Timestamp-based session ID
 */
function createSessionId() {
    return Date.now().toString();
}

/**
 * Sends error response with proper logging
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {number} statusCode - HTTP status code (default: 500)
 */
function sendErrorResponse(res, error, statusCode = 500) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Log stdout/stderr for debugging but don't send to client
    if (error.stdout) {
        console.error('stdout:', error.stdout);
    }
    if (error.stderr) {
        console.error('stderr:', error.stderr);
    }
    
    // Send clean error message to client
    const errorMessage = error.message || 'An unexpected error occurred during generation';
    
    if (!res.headersSent) {
        res.status(statusCode).json({ error: errorMessage });
    }
}

/**
 * Sends file download response
 * @param {Object} res - Express response object
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Download filename
 */
function sendFileDownload(res, fileBuffer, filename) {
    res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length
    });
    res.send(fileBuffer);
}

module.exports = {
    generateCSS,
    escapeHtml,
    validateSlideData,
    splitOversizedSlides,
    sanitizeSlide,
    parseAIResponse,
    createSessionId,
    sendErrorResponse,
    sendFileDownload
};

