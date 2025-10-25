/**
 * Chart Visualization Module
 * Generates SVG charts for preview (bar, column, line, area, pie)
 */

// ========================================
// CHART SVG GENERATION
// ========================================

/**
 * Main chart generation function
 * @param {Object} chart - Chart data object
 * @param {Object} theme - Theme configuration
 * @param {number} width - Chart width in pixels
 * @param {number} height - Chart height in pixels
 * @returns {string} - SVG markup
 */
function generateChartSVG(chart, theme, width = 400, height = 250) {
    const { data, type } = chart;
    const { labels, datasets } = data;
    
    // Route to appropriate chart generator
    switch (type) {
        case 'bar':
        case 'column':
            return generateBarChart(labels, datasets, width, height, type === 'column');
        case 'line':
        case 'area':
            return generateLineChart(labels, datasets, width, height, type === 'area');
        case 'pie':
            return generatePieChart(labels, datasets[0].values, width, height);
        default:
            return '<div>Chart type not supported</div>';
    }
}

/**
 * Generates bar/column chart SVG
 * @param {Array<string>} labels - X-axis labels
 * @param {Array<Object>} datasets - Data series
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {boolean} isColumn - True for vertical bars
 * @returns {string} - SVG markup
 */
function generateBarChart(labels, datasets, width, height, isColumn = true) {
    const maxValue = Math.max(...datasets.flatMap(d => d.values));
    const barWidth = (width - 100) / (labels.length * datasets.length + labels.length);
    const groupWidth = barWidth * datasets.length;
    const colors = ['#667eea', '#764ba2', '#f39c12', '#2ecc71', '#e74c3c'];
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Draw bars
    datasets.forEach((dataset, datasetIdx) => {
        const color = colors[datasetIdx % colors.length];
        
        dataset.values.forEach((value, i) => {
            const barHeight = (value / maxValue) * (height - 60);
            const x = 50 + i * (groupWidth + barWidth) + datasetIdx * barWidth;
            const y = height - 40 - barHeight;
            
            svg += `<rect x="${x}" y="${y}" width="${barWidth - 2}" height="${barHeight}" fill="${color}" opacity="0.8"/>`;
            svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#333">${value}</text>`;
        });
    });
    
    // Draw labels
    labels.forEach((label, i) => {
        const x = 50 + i * (groupWidth + barWidth) + groupWidth / 2;
        svg += `<text x="${x}" y="${height - 20}" text-anchor="middle" font-size="11" fill="#666">${label}</text>`;
    });
    
    svg += '</svg>';
    return svg;
}

/**
 * Generates line/area chart SVG
 * @param {Array<string>} labels - X-axis labels
 * @param {Array<Object>} datasets - Data series
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @param {boolean} isArea - True for area chart
 * @returns {string} - SVG markup
 */
function generateLineChart(labels, datasets, width, height, isArea = false) {
    const maxValue = Math.max(...datasets.flatMap(d => d.values));
    const stepX = (width - 100) / (labels.length - 1);
    const colors = ['#667eea', '#764ba2', '#f39c12'];
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    datasets.forEach((dataset, datasetIdx) => {
        const color = colors[datasetIdx % colors.length];
        let path = '';
        let areaPath = '';
        
        // Build path
        dataset.values.forEach((value, i) => {
            const x = 50 + i * stepX;
            const y = height - 40 - (value / maxValue) * (height - 60);
            
            if (i === 0) {
                path = `M ${x} ${y}`;
                areaPath = `M ${x} ${height - 40} L ${x} ${y}`;
            } else {
                path += ` L ${x} ${y}`;
                areaPath += ` L ${x} ${y}`;
            }
            
            // Data points
            svg += `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
            svg += `<text x="${x}" y="${y - 10}" text-anchor="middle" font-size="10" fill="#333">${value}</text>`;
        });
        
        // Draw area if needed
        if (isArea) {
            areaPath += ` L ${50 + (labels.length - 1) * stepX} ${height - 40} Z`;
            svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                    <path d="${areaPath}" fill="${color}" opacity="0.2"/>
                    <path d="${path}" stroke="${color}" stroke-width="2" fill="none"/>` + 
                    svg.substring(svg.indexOf('<circle'));
        } else {
            svg += `<path d="${path}" stroke="${color}" stroke-width="2" fill="none"/>`;
        }
    });
    
    // Draw labels
    labels.forEach((label, i) => {
        const x = 50 + i * stepX;
        svg += `<text x="${x}" y="${height - 20}" text-anchor="middle" font-size="11" fill="#666">${label}</text>`;
    });
    
    svg += '</svg>';
    return svg;
}

/**
 * Generates pie chart SVG
 * @param {Array<string>} labels - Segment labels
 * @param {Array<number>} values - Segment values
 * @param {number} width - Width in pixels
 * @param {number} height - Height in pixels
 * @returns {string} - SVG markup
 */
function generatePieChart(labels, values, width, height) {
    const total = values.reduce((a, b) => a + b, 0);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    const colors = ['#667eea', '#764ba2', '#f39c12', '#2ecc71', '#e74c3c', '#3498db'];
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    let currentAngle = -90;
    
    // Draw segments
    values.forEach((value, i) => {
        const angle = (value / total) * 360;
        const endAngle = currentAngle + angle;
        
        const x1 = centerX + radius * Math.cos(currentAngle * Math.PI / 180);
        const y1 = centerY + radius * Math.sin(currentAngle * Math.PI / 180);
        const x2 = centerX + radius * Math.cos(endAngle * Math.PI / 180);
        const y2 = centerY + radius * Math.sin(endAngle * Math.PI / 180);
        
        const largeArc = angle > 180 ? 1 : 0;
        
        svg += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[i % colors.length]}" opacity="0.8"/>`;
        
        // Percentage label
        const labelAngle = currentAngle + angle / 2;
        const labelX = centerX + (radius * 0.7) * Math.cos(labelAngle * Math.PI / 180);
        const labelY = centerY + (radius * 0.7) * Math.sin(labelAngle * Math.PI / 180);
        const percentage = ((value / total) * 100).toFixed(0);
        svg += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${percentage}%</text>`;
        
        currentAngle = endAngle;
    });
    
    // Draw legend
    let legendY = 20;
    labels.forEach((label, i) => {
        svg += `<rect x="10" y="${legendY}" width="15" height="15" fill="${colors[i % colors.length]}"/>`;
        svg += `<text x="30" y="${legendY + 12}" font-size="11" fill="#666">${label}</text>`;
        legendY += 20;
    });
    
    svg += '</svg>';
    return svg;
}

// ========================================
// EXPORTS
// ========================================

window.generateChartSVG = generateChartSVG;

