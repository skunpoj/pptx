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
    
    // Validate chart slides
    slideData.slides = validateAndFixChartSlides(slideData.slides);
    
    // Split oversized slides into multiple slides
    slideData.slides = splitOversizedSlides(slideData.slides);
    
    return slideData;
}

/**
 * Validates and fixes chart slides to ensure proper structure
 * @param {Array} slides - Array of slide objects
 * @returns {Array} - Validated slides array
 */
function validateAndFixChartSlides(slides) {
    const validChartTypes = ['bar', 'column', 'line', 'pie', 'area'];
    
    slides.forEach((slide, index) => {
        // Only validate chart slides
        if (slide.layout === 'chart' && slide.chart) {
            try {
                // Validate chart type
                if (!slide.chart.type || !validChartTypes.includes(slide.chart.type.toLowerCase())) {
                    console.warn(`⚠️ Slide ${index + 1}: Invalid chart type "${slide.chart.type}", defaulting to "column"`);
                    slide.chart.type = 'column';
                }
                
                // Normalize chart type to lowercase
                slide.chart.type = slide.chart.type.toLowerCase();
                
                // Validate chart title
                if (!slide.chart.title || typeof slide.chart.title !== 'string') {
                    console.warn(`⚠️ Slide ${index + 1}: Missing or invalid chart title, using slide title`);
                    slide.chart.title = slide.title || 'Chart';
                }
                
                // Validate chart data structure
                if (!slide.chart.data) {
                    throw new Error(`Slide ${index + 1}: Chart is missing data object`);
                }
                
                if (!Array.isArray(slide.chart.data.labels) || slide.chart.data.labels.length === 0) {
                    throw new Error(`Slide ${index + 1}: Chart data.labels must be a non-empty array`);
                }
                
                if (!Array.isArray(slide.chart.data.datasets) || slide.chart.data.datasets.length === 0) {
                    throw new Error(`Slide ${index + 1}: Chart data.datasets must be a non-empty array`);
                }
                
                // Validate each dataset
                slide.chart.data.datasets.forEach((dataset, dsIndex) => {
                    if (!dataset.name || typeof dataset.name !== 'string') {
                        console.warn(`⚠️ Slide ${index + 1}, Dataset ${dsIndex + 1}: Missing or invalid name, using default`);
                        dataset.name = `Series ${dsIndex + 1}`;
                    }
                    
                    if (!Array.isArray(dataset.values) || dataset.values.length === 0) {
                        throw new Error(`Slide ${index + 1}, Dataset ${dsIndex + 1}: values must be a non-empty array`);
                    }
                    
                    // Ensure all values are numbers
                    dataset.values = dataset.values.map((val, valIndex) => {
                        const num = Number(val);
                        if (isNaN(num)) {
                            console.warn(`⚠️ Slide ${index + 1}, Dataset ${dsIndex + 1}, Value ${valIndex + 1}: "${val}" is not a number, using 0`);
                            return 0;
                        }
                        return num;
                    });
                    
                    // Validate values length matches labels length
                    if (dataset.values.length !== slide.chart.data.labels.length) {
                        console.warn(`⚠️ Slide ${index + 1}, Dataset ${dsIndex + 1}: values length (${dataset.values.length}) doesn't match labels length (${slide.chart.data.labels.length}), trimming or padding`);
                        
                        if (dataset.values.length > slide.chart.data.labels.length) {
                            dataset.values = dataset.values.slice(0, slide.chart.data.labels.length);
                        } else {
                            while (dataset.values.length < slide.chart.data.labels.length) {
                                dataset.values.push(0);
                            }
                        }
                    }
                });
                
                console.log(`✓ Chart validated: Slide ${index + 1} - ${slide.chart.type} chart with ${slide.chart.data.labels.length} data points`);
                
            } catch (chartError) {
                console.error(`❌ Chart validation failed for slide ${index + 1}:`, chartError.message);
                // Convert chart slide to regular content slide if validation fails
                console.log(`  Converting to regular content slide...`);
                slide.layout = 'bullets';
                delete slide.chart;
                if (!slide.content || slide.content.length === 0) {
                    slide.content = ['Chart data was invalid and could not be displayed'];
                }
            }
        }
    });
    
    return slides;
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
    // Validate input
    if (!responseText || typeof responseText !== 'string') {
        console.error('Invalid response text:', typeof responseText);
        throw new Error('AI returned an empty or invalid response. Please try again.');
    }
    
    // Check if response looks like HTML (common error scenario)
    if (responseText.trim().startsWith('<')) {
        console.error('Response appears to be HTML instead of JSON');
        console.error('Response preview:', responseText.substring(0, 200));
        throw new Error('AI service returned an error page instead of JSON data. Please check your API key and try again.');
    }
    
    // Clean up common AI response formatting
    let cleanedText = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
    
    // Additional validation after cleaning
    if (!cleanedText) {
        console.error('Response became empty after cleaning');
        throw new Error('AI response was empty after formatting cleanup. Please try again.');
    }
    
    try {
        const data = JSON.parse(cleanedText);
        
        // Validate the parsed data has expected structure
        if (!data || typeof data !== 'object') {
            throw new Error('Parsed data is not a valid object');
        }
        
        return data;
    } catch (parseError) {
        console.error('JSON Parse Error:', parseError.message);
        console.error('Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');
        console.error('Response text preview:', cleanedText.substring(0, 500));
        
        // Try to provide more helpful error message
        if (parseError.message.includes('Unexpected token')) {
            const match = parseError.message.match(/Unexpected token (.+?) in JSON/);
            const token = match ? match[1] : 'unknown';
            throw new Error(`AI response contains invalid JSON (unexpected ${token}). This usually means the AI didn't format the response correctly. Please try again.`);
        } else if (parseError.message.includes('Unexpected end')) {
            throw new Error('AI response is incomplete. The AI might have been interrupted. Please try again.');
        } else {
            throw new Error('Failed to parse AI response as JSON. Please try again or check server logs for details.');
        }
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
    validateAndFixChartSlides,
    splitOversizedSlides,
    sanitizeSlide,
    parseAIResponse,
    createSessionId,
    sendErrorResponse,
    sendFileDownload
};

