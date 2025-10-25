/**
 * HTML and Script Generation Utilities
 * Centralized generators for PowerPoint conversion
 */

const { generateCSS, escapeHtml } = require('./helpers');
const { generateTitleSlide, generateBulletSlide, generateChartSlide } = require('./slideLayouts');

/**
 * Main slide HTML generator - routes to appropriate layout generator
 * @param {Object} slide - Slide data object
 * @param {Object} theme - Theme configuration
 * @returns {string} - Complete HTML document for slide
 */
function generateSlideHTML(slide, theme) {
    // Route to appropriate layout generator
    if (slide.type === 'title') {
        return generateTitleSlide(slide, theme);
    }
    
    if (slide.layout === 'chart' && slide.chart) {
        return generateChartSlide(slide, theme);
    }
    
    // Default to bullet layout for all other types
    // (two-column, three-column, framework, process-flow handled by html2pptx)
    return generateBulletSlide(slide, theme);
}

/**
 * Generates conversion script for pptxgen with chart support
 * @param {Array<string>} htmlFiles - Array of HTML filenames
 * @param {Array<Object>} slides - Array of slide data objects
 * @returns {string} - Complete JavaScript conversion script
 */
function generateConversionScript(htmlFiles, slides) {
    return `import { createRequire } from 'module';
import { html2pptx } from "@ant/html2pptx";

const require = createRequire(import.meta.url);
const pptxgen = require("pptxgenjs");

/**
 * Main presentation creation function
 * Creates PowerPoint with HTML slides and native charts
 */
async function createPresentation() {
    try {
        console.log("Starting presentation creation...");
        console.log("pptxgen loaded:", typeof pptxgen);
        console.log("html2pptx loaded:", typeof html2pptx);
        
        const pptx = new pptxgen();
        pptx.layout = "LAYOUT_16x9";
        console.log("PPTX instance created");
        
        ${generateSlideProcessingCode(htmlFiles, slides)}
        
        console.log("Writing presentation file...");
        await pptx.writeFile("presentation.pptx");
        console.log("✓ Presentation created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("ERROR in conversion script:", error);
        console.error("Stack:", error.stack);
        process.exit(1);
    }
}

createPresentation();`;
}

/**
 * Generates slide processing code for conversion script
 * Handles both HTML slides and native chart slides
 * @param {Array<string>} htmlFiles - HTML file names
 * @param {Array<Object>} slides - Slide data
 * @returns {string} - JavaScript code for processing slides
 */
function generateSlideProcessingCode(htmlFiles, slides) {
    return htmlFiles.map((file, idx) => {
        const slide = slides[idx];
        
        // Chart slides: generate directly with pptxgenjs
        if (slide.layout === 'chart' && slide.chart) {
            return generateChartSlideCode(slide, idx);
        }
        
        // Other slides: use html2pptx + add graphics
        return generateHTMLSlideCode(file, slide, idx);
    }).join('\n');
}

/**
 * Generates code for native chart slide creation
 * @param {Object} slide - Slide with chart data
 * @param {number} idx - Slide index
 * @returns {string} - JavaScript code
 */
function generateChartSlideCode(slide, idx) {
    const chartData = slide.chart.data;
    
    // Properly escape and serialize all data to avoid JSON parse errors
    const slideTitle = JSON.stringify(slide.title);
    const chartTitle = JSON.stringify(slide.chart.title || 'Chart');
    
    // Map chart types to pptxgenjs ChartType constants (official API)
    const chartTypeMap = {
        'bar': 'bar',           // Horizontal bar chart
        'column': 'bar',        // Vertical bar chart (use 'bar' with barDir: 'col')
        'pie': 'pie',           // Pie chart
        'line': 'line',         // Line chart
        'area': 'area'          // Area chart
    };
    const chartType = chartTypeMap[slide.chart.type] || 'bar';
    
    // Build chart data array according to pptxGenJS format
    // Format: [{ name: string, labels: string[], values: number[] }]
    const chartDataArray = chartData.datasets.map((dataset) => ({
        name: dataset.name || 'Data',
        labels: chartData.labels,
        values: dataset.values
    }));
    
    // Serialize chart data with proper indentation
    const chartDataStr = JSON.stringify(chartDataArray, null, 8).replace(/\n/g, '\n        ');
    
    // Handle insights/content with proper escaping
    let insightsCode = '';
    if (slide.content && slide.content.length > 0) {
        const insightsText = slide.content.map(item => `• ${item}`).join('\\n');
        const insightsStr = JSON.stringify(insightsText);
        insightsCode = `
        // Add insights
        slide${idx}.addText("Key Insights:", {
            x: 6.75, y: 1.5, w: 2.75, h: 0.5,
            fontSize: 14, bold: true, color: '2E4053'
        });
        
        slide${idx}.addText(${insightsStr}, {
            x: 6.75, y: 2.1, w: 2.75, h: 3.9,
            fontSize: 11, color: '1d1d1d', valign: 'top'
        });`;
    }
    
    // Build chart options according to pptxGenJS API
    const chartOptions = [];
    
    // For column charts, specify barDir: 'col'
    if (slide.chart.type === 'column') {
        chartOptions.push('barDir: "col"');
    }
    
    // Pie chart options
    if (slide.chart.type === 'pie') {
        chartOptions.push('dataLabelPosition: "bestFit"');
        chartOptions.push('showPercent: true');
    }
    
    // Line/Area chart options
    if (slide.chart.type === 'line' || slide.chart.type === 'area') {
        chartOptions.push('lineDataSymbol: "circle"');
        chartOptions.push('lineDataSymbolSize: 6');
        chartOptions.push('lineSize: 2');
    }
    
    // Common options for all charts
    chartOptions.push('showValue: true');
    chartOptions.push('showLegend: true');
    chartOptions.push('legendPos: "r"');  // Right side legend
    
    const chartOptionsStr = chartOptions.join(',\n            ');
    const chartWidth = slide.content && slide.content.length > 0 ? '6' : '9';
    
    return `
        // Slide ${idx + 1}: ${slide.title.replace(/\*/g, '').substring(0, 50)} (Chart Slide)
        console.log("Creating chart slide ${idx + 1}...");
        const slide${idx} = pptx.addSlide();
        
        // Add title
        slide${idx}.addText(${slideTitle}, {
            x: 0.5, y: 0.5, w: 9, h: 0.75,
            fontSize: 28, bold: true, color: '1C2833'
        });
        
        // Add chart
        const chartData${idx} = ${chartDataStr};
        
        // Add chart using pptxGenJS API (official format)
        slide${idx}.addChart(pptx.ChartType.${chartType}, chartData${idx}, {
            x: 0.5,
            y: 1.5,
            w: ${chartWidth},
            h: 4.5,
            chartColors: ['0088CC', 'FF6B6B', '4ECDC4', 'FFE66D', '95E1D3', 'F38181'],
            ${chartOptionsStr}
        });
        ${insightsCode}
        
        console.log("✓ Chart slide ${idx + 1} added");
    `;
}

/**
 * Generates code for HTML slide conversion with graphics, shapes, and images
 * @param {string} file - HTML filename
 * @param {Object} slide - Slide data
 * @param {number} idx - Slide index
 * @returns {string} - JavaScript code
 */
function generateHTMLSlideCode(file, slide, idx) {
    // Generate decorative shapes code
    const shapesCode = generateDecorativeShapes(slide, idx);
    
    // Generate image code if slide has imageDescription
    const imageCode = slide.imageDescription ? generateImagePlaceholder(slide, idx) : '';
    
    return `
        // Slide ${idx + 1}: ${slide.title || 'Slide'}
        console.log("Processing ${file}...");
        try {
            const result = await html2pptx("${file}", pptx);
            const currentSlide = result.slide || pptx.getSlide(${idx});
            console.log("✓ ${file} added successfully");
            console.log("  Result:", JSON.stringify({ hasSlide: !!result.slide, placeholderCount: result.placeholders?.length || 0 }));
            
            ${shapesCode}
            ${imageCode}
            
        } catch (slideError) {
            console.error("ERROR processing ${file}:");
            console.error("  Message:", slideError.message);
            console.error("  Stack:", slideError.stack);
            console.error("  Error type:", slideError.constructor.name);
            
            // Try to read the HTML file to debug
            const fs = require('fs').promises;
            try {
                const htmlContent = await fs.readFile("${file}", 'utf-8');
                console.error("  HTML file length:", htmlContent.length);
                console.error("  HTML preview:", htmlContent.substring(0, 500));
            } catch (readError) {
                console.error("  Could not read HTML file:", readError.message);
            }
            
            throw new Error("Failed to convert ${file}: " + slideError.message);
        }
    `;
}

/**
 * Generates decorative shapes for slides
 * @param {Object} slide - Slide data
 * @param {number} idx - Slide index
 * @returns {string} - JavaScript code for shapes
 */
function generateDecorativeShapes(slide, idx) {
    // Skip shapes for title slides
    if (slide.type === 'title') return '';
    
    return `
            // Add decorative shapes
            try {
                // Top-right accent circle
                currentSlide.addShape(pptx.ShapeType.ellipse, {
                    x: 8.5,
                    y: 0.2,
                    w: 0.8,
                    h: 0.8,
                    fill: { color: '667eea', transparency: 70 }
                });
                
                // Bottom-left accent rectangle
                currentSlide.addShape(pptx.ShapeType.rect, {
                    x: 0.2,
                    y: 5,
                    w: 0.5,
                    h: 0.4,
                    fill: { color: '764ba2', transparency: 60 }
                });
                
                // Right side decorative bar
                currentSlide.addShape(pptx.ShapeType.rect, {
                    x: 9.5,
                    y: 1,
                    w: 0.05,
                    h: 3.5,
                    fill: { color: '667eea', transparency: 40 }
                });
                
                console.log("✓ Added decorative shapes to slide ${idx + 1}");
            } catch (shapeError) {
                console.log("  Note: Could not add shapes:", shapeError.message);
            }`;
}

/**
 * Generates image placeholder code
 * @param {Object} slide - Slide data
 * @param {number} idx - Slide index
 * @returns {string} - JavaScript code for image
 */
function generateImagePlaceholder(slide, idx) {
    const imageDesc = JSON.stringify(slide.imageDescription);
    
    return `
            // Add image placeholder
            try {
                // Create a placeholder box for the image
                currentSlide.addShape(pptx.ShapeType.rect, {
                    x: 6.5,
                    y: 1.5,
                    w: 2.8,
                    h: 2,
                    fill: { color: 'E8EAF6' },
                    line: { color: '667eea', width: 2, dashType: 'dash' }
                });
                
                // Add image icon/text
                currentSlide.addText('📷', {
                    x: 7.2,
                    y: 2,
                    w: 1.5,
                    h: 0.5,
                    fontSize: 48,
                    align: 'center'
                });
                
                // Add image description
                currentSlide.addText(${imageDesc}, {
                    x: 6.6,
                    y: 2.8,
                    w: 2.6,
                    h: 0.6,
                    fontSize: 9,
                    align: 'center',
                    color: '666666',
                    italic: true
                });
                
                console.log("✓ Added image placeholder to slide ${idx + 1}");
            } catch (imgError) {
                console.log("  Note: Could not add image placeholder:", imgError.message);
            }`;
}

// Re-export helpers for backwards compatibility
module.exports = {
    generateCSS,
    escapeHtml,
    generateSlideHTML,
    generateConversionScript
};

