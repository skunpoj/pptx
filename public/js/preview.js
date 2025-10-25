/**
 * Preview Rendering Module
 * Handles display of slide previews in list and gallery views
 */

// ========================================
// MAIN PREVIEW DISPLAY
// ========================================

/**
 * Displays slide preview in current view mode
 * @param {Object} slideData - Complete slide data with theme and slides
 */
function displayPreview(slideData) {
    const preview = document.getElementById('preview');
    const theme = slideData.designTheme;
    
    // Show view toggle buttons
    document.getElementById('viewToggle').style.display = 'flex';
    
    // Route to appropriate view renderer
    if (window.currentView === 'gallery') {
        displayGalleryView(slideData);
    } else {
        displayListView(slideData);
    }
}

// ========================================
// LIST VIEW
// ========================================

/**
 * Displays slides in detailed list view
 * @param {Object} slideData - Slide data
 */
function displayListView(slideData) {
    const preview = document.getElementById('preview');
    const theme = slideData.designTheme;
    
    let html = '';
    
    // Template mode indicator
    if (window.templateFile) {
        html += `
            <div style="background: #fff4e6; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid #ffa826; border: 2px solid #ffd699;">
                <strong style="color: #d97706;">📄 Template Mode Active</strong>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">Using ${window.templateFile.name} as base. New slides will be added with AI content.</p>
            </div>
        `;
    }
    
    // Theme info banner
    html += `
        <div style="background: #f0f4ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${theme.colorPrimary};">
            <strong style="color: ${theme.colorPrimary};">🎨 ${theme.name}</strong>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">${theme.description}</p>
        </div>
    `;
    
    // Render each slide
    slideData.slides.forEach((slide, index) => {
        html += renderSlidePreviewCard(slide, index, theme);
    });
    
    preview.innerHTML = html;
}

// ========================================
// GALLERY VIEW
// ========================================

/**
 * Displays slides in grid gallery view
 * @param {Object} slideData - Slide data
 */
function displayGalleryView(slideData) {
    const preview = document.getElementById('preview');
    const theme = slideData.designTheme;
    
    let html = `
        <div style="background: #f0f4ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${theme.colorPrimary};">
            <strong style="color: ${theme.colorPrimary};">🎨 ${theme.name}</strong>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">${theme.description}</p>
        </div>
        <div class="gallery-view">
    `;
    
    // Render gallery cards
    slideData.slides.forEach((slide, index) => {
        html += renderGalleryCard(slide, index, theme);
    });
    
    html += '</div>';
    preview.innerHTML = html;
}

// ========================================
// SLIDE RENDERING HELPERS
// ========================================

/**
 * Renders a single slide preview card for list view
 * @param {Object} slide - Slide data
 * @param {number} index - Slide index
 * @param {Object} theme - Theme configuration
 * @returns {string} - HTML for slide card
 */
function renderSlidePreviewCard(slide, index, theme) {
    const isTitle = slide.type === 'title';
    const bgColor = isTitle ? theme.colorPrimary : '#ffffff';
    const textColor = isTitle ? '#ffffff' : '#333';
    const borderColor = isTitle ? theme.colorPrimary : '#dee2e6';
    
    let html = `
        <div class="slide-preview ${isTitle ? 'title-slide' : ''}" style="background: ${bgColor}; border-color: ${borderColor}; padding-left: ${isTitle ? '1rem' : '1.5rem'};">
            <div class="slide-header">
                <span class="slide-number" style="background: ${theme.colorAccent};">Slide ${index + 1}</span>
                <span class="slide-type" style="color: ${isTitle ? 'rgba(255,255,255,0.8)' : '#666'};">${getSlideTypeLabel(slide)}</span>
            </div>
            ${!isTitle && slide.graphics?.icons?.[0]?.emoji ? `
            <div style="display: inline-block; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 50%); padding: 0.4rem 0.6rem; border-radius: 8px; margin-bottom: 0.5rem; font-size: 1.2rem;">
                ${slide.graphics.icons[0].emoji}
            </div>
            ` : ''}
            <div class="slide-title" style="color: ${textColor};">${slide.title}</div>
            ${renderSlideDetails(slide, theme, isTitle, textColor)}
        </div>
    `;
    
    return html;
}

/**
 * Renders slide details (subtitle, header, content)
 * @param {Object} slide - Slide data
 * @param {Object} theme - Theme configuration
 * @param {boolean} isTitle - Whether this is a title slide
 * @param {string} textColor - Text color
 * @returns {string} - HTML for slide details
 */
function renderSlideDetails(slide, theme, isTitle, textColor) {
    let html = '';
    
    // Subtitle
    if (slide.subtitle) {
        html += `<div style="color: ${textColor}; opacity: 0.95; font-size: 0.9rem; margin-top: 0.5rem;">${slide.subtitle}</div>`;
    }
    
    // Accent divider for title slides
    if (isTitle) {
        html += `<div style="width: 80px; height: 3px; background: ${theme.colorAccent}; margin: 1rem auto 0; border-radius: 2px;"></div>`;
    }
    
    // Header
    if (slide.header) {
        html += `<div style="background: ${isTitle ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, ' + theme.colorAccent + '20 0%, transparent 100%)'}; border-left: ${isTitle ? '3px solid rgba(255,255,255,0.5)' : '3px solid ' + theme.colorAccent}; color: ${isTitle ? 'rgba(255,255,255,0.95)' : theme.colorSecondary}; font-size: 0.85rem; margin-top: 0.5rem; padding: 0.5rem 0.75rem; border-radius: 0 6px 6px 0; font-style: italic;">${slide.header}</div>`;
    }
    
    // Image placeholder
    if (slide.imageDescription) {
        html += `<div style="background: #f0f4ff; border: 2px dashed ${theme.colorAccent}; padding: 0.5rem; margin-top: 0.5rem; border-radius: 4px; font-size: 0.75rem; color: #666; text-align: center;">📸 ${slide.imageDescription}</div>`;
    }
    
    // Content based on layout
    if (slide.layout === 'chart' && slide.chart) {
        html += renderChartContent(slide, theme);
    } else if (slide.content && slide.content.length > 0) {
        html += renderContentByLayout(slide, theme);
    }
    
    return html;
}

/**
 * Gets the slide type label
 * @param {Object} slide - Slide data
 * @returns {string} - Human-readable slide type
 */
function getSlideTypeLabel(slide) {
    if (slide.type === 'title') return 'Title Slide';
    if (slide.layout === 'chart') return 'Chart';
    return slide.layout || 'Content';
}

/**
 * Renders chart content for preview
 * @param {Object} slide - Slide with chart data
 * @param {Object} theme - Theme configuration
 * @returns {string} - Chart HTML
 */
function renderChartContent(slide, theme) {
    return `
        <div class="slide-content" style="display: flex; gap: 1rem; margin-top: 0.5rem;">
            <div style="flex: 1; background: #f8f9fa; border: 2px solid ${theme.colorAccent}; border-radius: 8px; padding: 1rem;">
                <div style="font-weight: 600; color: ${theme.colorPrimary}; margin-bottom: 0.5rem; text-align: center;">📊 ${slide.chart.title}</div>
                <div style="text-align: center;">
                    ${window.generateChartSVG(slide.chart, theme, 350, 180)}
                </div>
            </div>
            ${slide.content && slide.content.length > 0 ? `
            <div style="flex: 0 0 200px;">
                <div style="font-weight: 600; color: ${theme.colorSecondary}; font-size: 0.8rem; margin-bottom: 0.5rem;">Key Insights:</div>
                <ul style="margin: 0; padding-left: 1rem; font-size: 0.75rem; line-height: 1.4;">
                    ${slide.content.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
    `;
}

/**
 * Renders content based on layout type
 * @param {Object} slide - Slide data
 * @param {Object} theme - Theme configuration
 * @returns {string} - Content HTML
 */
function renderContentByLayout(slide, theme) {
    const layout = slide.layout;
    
    if (layout === 'three-column') {
        return renderThreeColumnLayout(slide.content, theme);
    } else if (layout === 'two-column') {
        return renderTwoColumnLayout(slide.content, theme);
    } else if (layout === 'framework') {
        return renderFrameworkLayout(slide.content, theme);
    } else if (layout === 'process-flow') {
        return renderProcessFlowLayout(slide.content, theme);
    } else {
        // Default bullets
        return renderBulletLayout(slide.content, theme);
    }
}

// Layout renderers (simplified for preview)
function renderThreeColumnLayout(content, theme) {
    const third = Math.ceil(content.length / 3);
    const cols = [
        content.slice(0, third),
        content.slice(third, third * 2),
        content.slice(third * 2)
    ];
    
    return `
        <div class="slide-content" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
            ${cols.map(col => `
                <ul style="margin: 0; padding-left: 1rem; font-size: 0.75rem; line-height: 1.3;">
                    ${col.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `).join('')}
        </div>
    `;
}

function renderTwoColumnLayout(content, theme) {
    const half = Math.ceil(content.length / 2);
    const col1 = content.slice(0, half);
    const col2 = content.slice(half);
    
    return `
        <div class="slide-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.5rem;">
            ${[col1, col2].map(col => `
                <ul style="margin: 0; padding-left: 1.25rem; font-size: 0.85rem; line-height: 1.4;">
                    ${col.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `).join('')}
        </div>
    `;
}

function renderFrameworkLayout(content, theme) {
    return `
        <div class="slide-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem;">
            ${content.map(item => `
                <div style="background: #f8f9fa; border-left: 3px solid ${theme.colorAccent}; padding: 0.5rem; border-radius: 4px; font-size: 0.8rem; line-height: 1.4;">
                    ${item}
                </div>
            `).join('')}
        </div>
    `;
}

function renderProcessFlowLayout(content, theme) {
    return `
        <div class="slide-content" style="margin-top: 0.5rem;">
            ${content.map((item, idx) => `
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="background: ${theme.colorAccent}; color: white; font-weight: bold; min-width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                        ${idx + 1}
                    </span>
                    <span style="flex: 1; background: linear-gradient(90deg, ${theme.colorPrimary}15 0%, ${theme.colorPrimary}05 100%); padding: 0.35rem 0.75rem; border-left: 2px solid ${theme.colorAccent}; font-size: 0.8rem; line-height: 1.3;">
                        ${item}
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

function renderBulletLayout(content, theme) {
    return `
        <div class="slide-content">
            <ul style="margin: 0.5rem 0 0 0; padding-left: 0; list-style: none; font-size: 0.85rem; line-height: 1.4;">
                ${content.map((item, idx) => `
                <li style="display: flex; align-items: start; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="flex-shrink: 0; width: 20px; height: 20px; background: linear-gradient(135deg, ${theme.colorAccent} 0%, ${theme.colorPrimary} 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${idx + 1}</span>
                    <span style="flex: 1; padding-top: 2px;">${item}</span>
                </li>
                `).join('')}
            </ul>
        </div>
    `;
}

// ========================================
// GALLERY VIEW
// ========================================

/**
 * Renders a gallery card for a single slide
 * @param {Object} slide - Slide data
 * @param {number} index - Slide index
 * @param {Object} theme - Theme configuration
 * @returns {string} - HTML for gallery card
 */
function renderGalleryCard(slide, index, theme) {
    const slidePreview = renderMiniSlidePreview(slide, theme);
    const slideType = getSlideTypeLabel(slide);
    const titleTruncated = slide.title.length > 30 
        ? slide.title.substring(0, 30) + '...' 
        : slide.title;
    
    return `
        <div class="gallery-item" onclick="scrollToSlide(${index})">
            ${slidePreview}
            <div class="gallery-item-info">
                <div class="gallery-item-title">Slide ${index + 1}: ${titleTruncated}</div>
                <div class="gallery-item-meta">
                    ${slideType}
                    ${slide.content ? ` • ${slide.content.length} points` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Renders mini preview for gallery cards
 * @param {Object} slide - Slide data
 * @param {Object} theme - Theme configuration
 * @returns {string} - Mini preview HTML
 */
function renderMiniSlidePreview(slide, theme) {
    const isTitle = slide.type === 'title';
    const bgColor = isTitle ? theme.colorPrimary : '#ffffff';
    const textColor = isTitle ? '#ffffff' : '#333';
    const borderColor = isTitle ? theme.colorPrimary : '#e0e7ff';
    
    if (isTitle) {
        return `
            <div style="background: ${bgColor}; padding: 2rem; min-height: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                <div style="color: ${textColor}; font-size: 1.25rem; font-weight: bold; margin-bottom: 0.5rem;">
                    ${slide.title}
                </div>
                ${slide.subtitle ? `<div style="color: ${textColor}; opacity: 0.9; font-size: 0.85rem;">${slide.subtitle}</div>` : ''}
            </div>
        `;
    } else if (slide.layout === 'chart' && slide.chart) {
        return `
            <div style="background: ${bgColor}; padding: 1rem; min-height: 150px; border: 1px solid ${borderColor}; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <div style="color: ${theme.colorPrimary}; font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem; text-align: center;">
                    ${slide.title}
                </div>
                <div style="background: #f0f4ff; border: 2px dashed ${theme.colorAccent}; padding: 0.5rem; border-radius: 4px; text-align: center; width: 100%;">
                    📊 ${slide.chart.type.toUpperCase()} Chart<br/>
                    <span style="font-size: 0.7rem; color: #666;">${slide.chart.title}</span>
                </div>
                ${slide.content && slide.content.length > 0 ? `<div style="font-size: 0.65rem; color: #999; margin-top: 0.5rem;">${slide.content.length} insights</div>` : ''}
            </div>
        `;
    } else {
        // Regular content slide
        const contentPreview = slide.content 
            ? slide.content.slice(0, 3).map(item => 
                `<li style="font-size: 0.7rem; margin-bottom: 0.25rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item}</li>`
            ).join('') 
            : '';
        
        return `
            <div style="background: ${bgColor}; padding: 1rem; min-height: 150px; border: 1px solid ${borderColor};">
                <div style="color: ${theme.colorPrimary}; font-size: 0.9rem; font-weight: bold; margin-bottom: 0.5rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    ${slide.title}
                </div>
                ${slide.header ? `<div style="color: ${theme.colorSecondary}; font-size: 0.65rem; margin-bottom: 0.5rem; font-style: italic; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${slide.header}</div>` : ''}
                ${contentPreview ? `<ul style="margin: 0; padding-left: 1rem; list-style: circle;">${contentPreview}</ul>` : ''}
                ${slide.content && slide.content.length > 3 ? `<div style="font-size: 0.65rem; color: #999; margin-top: 0.25rem;">+ ${slide.content.length - 3} more points...</div>` : ''}
            </div>
        `;
    }
}

// ========================================
// EXPORTS
// ========================================

window.displayPreview = displayPreview;
window.displayGalleryView = displayGalleryView;

