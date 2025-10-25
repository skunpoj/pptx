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
        return `
    <!-- Decorative shapes for title slide -->
    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: ${theme.colorAccent}; opacity: 0.2; border-radius: 50%;"></div>
    <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: ${theme.colorBackground}; opacity: 0.1; border-radius: 50%;"></div>
    <div style="position: absolute; top: 50%; left: 0; width: 100%; height: 4px; background: ${theme.colorAccent}; opacity: 0.3; transform: translateY(-50%);"></div>
        `;
    }
    
    return `
    <!-- Decorative elements for content slide -->
    <div style="position: absolute; top: 0; left: 0; width: 6px; height: 100%; background: linear-gradient(180deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 100%);"></div>
    <div style="position: absolute; top: 20px; right: 30px; width: 80px; height: 80px; background: ${theme.colorAccent}; opacity: 0.08; border-radius: 50%;"></div>
    <div style="position: absolute; bottom: 30px; right: 50px; width: 120px; height: 120px; background: ${theme.colorPrimary}; opacity: 0.05; border-radius: 50%;"></div>
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
    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 50%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
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
    <div style="background: linear-gradient(90deg, ${theme.colorAccent}20 0%, transparent 100%); border-left: 4px solid ${theme.colorAccent}; padding: 0.75rem 1.25rem; margin-bottom: 1.5rem; border-radius: 0 8px 8px 0;">
        <p style="color: ${theme.colorSecondary}; font-size: 1.1rem; margin: 0; font-style: italic;">${escapeHtml(headerText)}</p>
    </div>`;
}

/**
 * Generates numbered bullet list HTML
 * @param {Array<string>} items - Bullet point items
 * @param {Object} theme - Theme configuration
 * @returns {string} - Bullet list HTML
 */
function getNumberedBullets(items, theme) {
    return `
    <ul style="margin: 0; padding-left: 0; list-style: none; font-size: 1.25rem; line-height: 1.8;">
        ${items.map((item, idx) => `
        <li style="margin-bottom: 1rem; display: flex; align-items: start; gap: 1rem;">
            <span style="flex-shrink: 0; width: 32px; height: 32px; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: bold;">${idx + 1}</span>
            <span style="flex: 1; padding-top: 4px;">${escapeHtml(item)}</span>
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
${getDecorativeElements(theme, 'title')}
    
    <!-- Content -->
    <div style="z-index: 10; position: relative;">
        <h1 style="color: ${theme.colorBackground}; font-size: 3.5rem; font-weight: bold; text-align: center; margin: 0; padding: 0 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
            ${escapeHtml(slide.title)}
        </h1>
        ${slide.subtitle ? `<h2 style="color: ${theme.colorBackground}; font-size: 1.5rem; opacity: 0.95; text-align: center; margin-top: 1.5rem;">
            ${escapeHtml(slide.subtitle)}
        </h2>` : ''}
        <div style="width: 120px; height: 4px; background: ${theme.colorAccent}; margin: 2rem auto;"></div>
    </div>`;
    
    const bodyStyles = `class="col center" style="width: 960px; height: 540px; background: linear-gradient(135deg, ${theme.colorPrimary} 0%, ${theme.colorSecondary} 100%); position: relative; overflow: hidden;"`;
    
    return wrapHTML(theme, bodyContent, bodyStyles);
}

/**
 * Generates standard bullet list slide HTML
 * @param {Object} slide - Slide data
 * @param {Object} theme - Theme configuration
 * @returns {string} - Complete HTML for bullet slide
 */
function generateBulletSlide(slide, theme) {
    const bodyContent = `
${getDecorativeElements(theme, 'content')}
    
    <!-- Content -->
    <div style="position: relative; z-index: 10;">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
            ${getIconBadge(slide, theme)}
            <h2 class="fit" style="color: ${theme.colorPrimary}; font-size: 2.25rem; font-weight: bold; margin: 0; flex: 1;">
                ${escapeHtml(slide.title)}
            </h2>
        </div>
        ${getHeaderCallout(slide.header, theme)}
        ${slide.imageDescription ? `<div style="background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%); border: 2px dashed ${theme.colorAccent}; padding: 1rem; margin-bottom: 1rem; border-radius: 12px; text-align: center; color: ${theme.colorSecondary}; font-style: italic; box-shadow: 0 4px 6px rgba(0,0,0,0.05);"><p style="margin: 0;">📸 Image: ${escapeHtml(slide.imageDescription)}</p></div>` : ''}
        <div class="fill-height" style="display: flex; flex-direction: column; justify-content: center; padding-bottom: 1rem;">
            ${getNumberedBullets(slide.content, theme)}
        </div>
    </div>`;
    
    const bodyStyles = `class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem; position: relative; overflow: hidden;"`;
    
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
    
    const bodyStyles = `class="col" style="width: 960px; height: 540px; padding: 2rem 2rem 3rem 2rem; position: relative; overflow: hidden;"`;
    
    return wrapHTML(theme, bodyContent, bodyStyles);
}

module.exports = {
    generateTitleSlide,
    generateBulletSlide,
    generateChartSlide,
    getDecorativeElements,
    getIconBadge,
    getHeaderCallout,
    getNumberedBullets
};

