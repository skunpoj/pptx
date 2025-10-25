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
            return generateChartSlideCode(slide, idx, theme);
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
    
    return `
        // Slide ${idx + 1}: ${slide.title} (Chart Slide)
        console.log("Creating chart slide for slide${idx}.html...");
        const slide${idx} = pptx.addSlide();
        
        // Add title
        slide${idx}.addText(${JSON.stringify(slide.title)}, {
            x: 0.5, y: 0.5, w: 9, h: 0.75,
            fontSize: 28, bold: true, color: '1C2833'
        });
        
        // Add chart
        const chartData${idx} = ${JSON.stringify(chartData.datasets.map((dataset, i) => ({
            name: dataset.name,
            labels: chartData.labels,
            values: dataset.values
        })))};
        
        slide${idx}.addChart(pptx.ChartType.${slide.chart.type}, chartData${idx}, {
            x: 0.5, y: 1.5, w: ${slide.content && slide.content.length > 0 ? '6' : '9'}, h: 4.5,
            title: ${JSON.stringify(slide.chart.title)},
            showTitle: true,
            titleFontSize: 16,
            ${slide.chart.type === 'pie' ? 'dataLabelPosition: "bestFit",' : ''}
            ${slide.chart.type === 'line' || slide.chart.type === 'area' ? 'lineDataSymbol: "circle",' : ''}
            showValue: true
        });
        
        ${slide.content && slide.content.length > 0 ? `
        // Add insights
        slide${idx}.addText("Key Insights:", {
            x: 6.75, y: 1.5, w: 2.75, h: 0.5,
            fontSize: 14, bold: true, color: '2E4053'
        });
        
        slide${idx}.addText(${JSON.stringify(slide.content.map((item, i) => `• ${item}`).join('\\n'))}, {
            x: 6.75, y: 2.1, w: 2.75, h: 3.9,
            fontSize: 11, color: '1d1d1d', valign: 'top'
        });
        ` : ''}
        
        console.log("✓ Chart slide ${idx + 1} added");
    `;
}

/**
 * Generates code for HTML slide conversion with graphics
 * @param {string} file - HTML filename
 * @param {Object} slide - Slide data
 * @param {number} idx - Slide index
 * @returns {string} - JavaScript code
 */
function generateHTMLSlideCode(file, slide, idx) {
    return `
        // Slide ${idx + 1}: ${slide.title || 'Slide'}
        console.log("Processing ${file}...");
        try {
            await html2pptx("${file}", pptx);
            console.log("✓ ${file} added successfully");
        } catch (slideError) {
            console.error("ERROR processing ${file}:", slideError.message);
            console.error("Stack:", slideError.stack);
            throw new Error("Failed to convert ${file}: " + slideError.message);
        }
    `;
}

// Re-export helpers for backwards compatibility
module.exports = {
    generateCSS,
    escapeHtml,
    generateSlideHTML,
    generateConversionScript
};

