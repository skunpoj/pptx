/**
 * Common Helper Utilities
 * Reusable functions used across the application
 */

/**
 * Generates CSS variables from theme object
 * @param {Object} theme - Theme configuration
 * @returns {string} - CSS with theme variables
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
 * Validates slide data structure
 * @param {Object} slideData - Slide data to validate
 * @throws {Error} - If validation fails
 * @returns {boolean} - True if valid
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
    
    return true;
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
    
    const errorMessage = error.stdout || error.stderr || error.message;
    
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
    parseAIResponse,
    createSessionId,
    sendErrorResponse,
    sendFileDownload
};

