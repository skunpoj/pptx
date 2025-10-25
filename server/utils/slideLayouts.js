/**
 * Slide Layout HTML Generators
 * Centralized templates for all slide layouts to avoid duplication
 */

const { generateCSS, escapeHtml } = require('./helpers');

/**
 * Common HTML wrapper for slides
 * @param {Object} theme - Theme configuration
 * @param {string} bodyContent - HTML content for body
 * @param {string} bodyStyles - Inline styles for body
 * @returns {string} - Complete HTML document
 */
function wrapHTML(theme, bodyContent, bodyStyles = '') {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
    ${generateCSS(theme)}
    </style>
</head>
<body ${bodyStyles}>
    ${bodyContent}
</body>
</html>`;
}

/**
 * Generates decorative background elements
 * @param {Object} theme - Theme configuration
 * @param {string} type - 'title' or 'content'
 * @returns {string} - Decorative HTML elements
 */
function getDecorativeElements(theme, type = 'content') {
    if (type === 'title') {
        // Minimal decorative elements to avoid overflow
        return `
    <!-- Simple decorative accent -->
    <div style="position: absolute; top: 20px; right: 20px; width: 80px; height: 80px; background: ${theme.colorAccent}; opacity: 0.15; border-radius: 50%;"></div>
        `;
    }
    
    return `
    <!-- Decorative accent bar for content slide -->
    <div style="position: absolute; top: 0; left: 0; width: 5px; height: 100%; background: linear-gradient(180deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 100%);"></div>
    `;
}

/**
 * Generates icon badge HTML
 * @param {Object} slide - Slide data
 * @param {Object} theme - Theme configuration
 * @returns {string} - Icon badge HTML
 */
function getIconBadge(slide, theme) {
    const emoji = slide.graphics?.icons?.[0]?.emoji || '📋';
    return `
    <div style="width: 38px; height: 38px; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 50%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
        ${emoji}
    </div>`;
}

/**
 * Generates header callout box
 * @param {string} headerText - Header text content
 * @param {Object} theme - Theme configuration
 * @returns {string} - Header callout HTML
 */
function getHeaderCallout(headerText, theme) {
    if (!headerText) return '';
    
    return `
    <div style="background: linear-gradient(90deg, ${theme.colorAccent}20 0%, transparent 100%); border-left: 3px solid ${theme.colorAccent}; padding: 0.5rem 0.75rem; margin-bottom: 0.75rem; border-radius: 0 6px 6px 0;">
        <p style="color: ${theme.colorSecondary}; font-size: 0.95rem; margin: 0; font-style: italic; line-height: 1.3;">${escapeHtml(headerText)}</p>
    </div>`;
}

/**
 * Generates numbered bullet list HTML
 * @param {Array<string>} items - Bullet point items
 * @param {Object} theme - Theme configuration
 * @returns {string} - Bullet list HTML
 */
function getNumberedBullets(items, theme) {
    return getNumberedBulletsAdaptive(items, theme, '1.1rem');
}

/**
 * Generates numbered bullet list HTML with adaptive sizing
 * @param {Array<string>} items - Bullet point items
 * @param {Object} theme - Theme configuration
 * @param {string} fontSize - Font size for bullets
 * @returns {string} - Bullet list HTML
 */
function getNumberedBulletsAdaptive(items, theme, fontSize = '1.1rem') {
    const itemCount = items.length;
    const marginBottom = itemCount > 6 ? '0.4rem' : '0.6rem';
    const badgeSize = itemCount > 6 ? '22px' : '26px';
    const badgeFontSize = itemCount > 6 ? '0.7rem' : '0.8rem';
    
    return `
    <ul style="margin: 0; padding-left: 0; list-style: none; font-size: ${fontSize}; line-height: 1.4;">
        ${items.map((item, idx) => `
        <li style="margin-bottom: ${marginBottom}; display: flex; align-items: start; gap: 0.5rem;">
            <span style="flex-shrink: 0; width: ${badgeSize}; height: ${badgeSize}; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${badgeFontSize}; font-weight: bold;">${idx + 1}</span>
            <span style="flex: 1; padding-top: 1px;">${escapeHtml(item)}</span>
        </li>
        `).join('')}
    </ul>`;
}

/**
 * Generates title slide HTML
 * @param {Object} slide - Slide data
 * @param {Object} theme - Theme configuration
 * @returns {string} - Complete HTML for title slide
 */
function generateTitleSlide(slide, theme) {
    const bodyContent = `
    <!-- Content -->
    <div style="z-index: 10; position: relative; text-align: center; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #FFFFFF; font-size: 2.75rem; font-weight: bold; margin: 0; line-height: 1.2;">
            ${escapeHtml(slide.title)}
        </h1>
        ${slide.subtitle ? `<h2 style="color: #FFFFFF; font-size: 1.2rem; opacity: 0.95; margin-top: 1rem; line-height: 1.3; font-weight: normal;">
            ${escapeHtml(slide.subtitle)}
        </h2>` : ''}
        <div style="width: 80px; height: 3px; background: ${theme.colorAccent}; margin: 1.25rem auto;"></div>
    </div>`;
    
    const bodyStyles = `class="col center" style="width: 960px; height: 540px; background: linear-gradient(135deg, ${theme.colorPrimary} 0%, ${theme.colorSecondary} 100%); padding: 2rem;"`;
    
    return wrapHTML(theme, bodyContent, bodyStyles);
}

/**
 * Generates standard bullet list slide HTML
 * @param {Object} slide - Slide data
 * @param {Object} theme - Theme configuration
 * @returns {string} - Complete HTML for bullet slide
 */
function generateBulletSlide(slide, theme) {
    // Adapt padding and font size based on content length
    const contentLength = slide.content.length;
    const hasHeader = !!slide.header;
    const hasImage = !!slide.imageDescription;
    
    // More content = less padding and smaller fonts
    // Conservative padding to avoid overflow (html2pptx needs margins)
    let fontSize = contentLength > 6 ? '0.95rem' : contentLength > 4 ? '1rem' : '1.05rem';
    let padding = contentLength > 6 ? '0.75rem 1rem 1.75rem 1rem' : '1rem 1.25rem 2rem 1.25rem';
    let titleSize = contentLength > 6 ? '1.7rem' : '1.85rem';
    
    const bodyContent = `
${getDecorativeElements(theme, 'content')}
    
    <!-- Content -->
    <div style="position: relative; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.85rem;">
            ${getIconBadge(slide, theme)}
            <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: ${titleSize}; font-weight: bold; margin: 0; flex: 1; line-height: 1.15;">
                ${escapeHtml(slide.title)}
            </h2>
        </div>
        ${getHeaderCallout(slide.header, theme)}
        ${slide.imageDescription ? `<div style="background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%); border: 2px dashed ${theme.colorAccent}; padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 6px; text-align: center; color: ${theme.colorSecondary}; font-style: italic; font-size: 0.8rem;"><p style="margin: 0;">📸 ${escapeHtml(slide.imageDescription)}</p></div>` : ''}
        <div class="fill-height" style="display: flex; flex-direction: column; justify-content: center;">
            ${getNumberedBulletsAdaptive(slide.content, theme, fontSize)}
        </div>
    </div>`;
    
    const bodyStyles = `class="col" style="width: 960px; height: 540px; padding: ${padding}; position: relative;"`;
    
    return wrapHTML(theme, bodyContent, bodyStyles);
}

/**
 * Generates chart slide HTML (placeholder for pptxgen)
 * @param {Object} slide - Slide data with chart
 * @param {Object} theme - Theme configuration  
 * @returns {string} - Complete HTML for chart slide
 */
function generateChartSlide(slide, theme) {
    const bodyContent = `
${getDecorativeElements(theme, 'content')}
    
    <!-- Content -->
    <div style="position: relative; z-index: 10;">
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
    </div>`;
    
    const bodyStyles = `class="col" style="width: 960px; height: 540px; padding: 1.25rem 1.5rem 2.5rem 1.5rem; position: relative;"`;
    
    return wrapHTML(theme, bodyContent, bodyStyles);
}

module.exports = {
    generateTitleSlide,
    generateBulletSlide,
    generateChartSlide,
    getDecorativeElements,
    getIconBadge,
    getHeaderCallout,
    getNumberedBullets,
    getNumberedBulletsAdaptive
};

