/**
 * Chart Validation Test
 * Tests the new chart validation functionality
 */

const { validateAndFixChartSlides } = require('../server/utils/helpers');

console.log('🧪 Testing Chart Validation...\n');

// Test Case 1: Valid chart
console.log('Test 1: Valid Chart');
const validSlides = [{
    type: 'content',
    layout: 'chart',
    title: 'Revenue Growth',
    chart: {
        type: 'column',
        title: 'Quarterly Revenue',
        data: {
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [{
                name: 'Revenue ($M)',
                values: [45, 52, 68, 73]
            }]
        }
    }
}];

const result1 = validateAndFixChartSlides(validSlides);
console.log('✓ Result:', result1[0].layout === 'chart' ? 'PASS - Chart validated' : 'FAIL');
console.log('');

// Test Case 2: Invalid values (string instead of number)
console.log('Test 2: Invalid Values (Non-numeric)');
const invalidValueSlides = [{
    type: 'content',
    layout: 'chart',
    title: 'Market Share',
    chart: {
        type: 'pie',
        title: 'Market Distribution',
        data: {
            labels: ['A', 'B', 'C'],
            datasets: [{
                name: 'Share',
                values: [30, 'N/A', 50]
            }]
        }
    }
}];

const result2 = validateAndFixChartSlides(invalidValueSlides);
console.log('✓ Result:', result2[0].chart.data.datasets[0].values[1] === 0 ? 'PASS - Invalid value converted to 0' : 'FAIL');
console.log('  Values:', result2[0].chart.data.datasets[0].values);
console.log('');

// Test Case 3: Mismatched array lengths
console.log('Test 3: Mismatched Array Lengths');
const mismatchedSlides = [{
    type: 'content',
    layout: 'chart',
    title: 'Sales Data',
    chart: {
        type: 'bar',
        title: 'Sales',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [{
                name: 'Sales',
                values: [10, 20]  // Only 2 values for 4 labels
            }]
        }
    }
}];

const result3 = validateAndFixChartSlides(mismatchedSlides);
console.log('✓ Result:', result3[0].chart.data.datasets[0].values.length === 4 ? 'PASS - Array padded with zeros' : 'FAIL');
console.log('  Values:', result3[0].chart.data.datasets[0].values);
console.log('');

// Test Case 4: Invalid chart type
console.log('Test 4: Invalid Chart Type');
const invalidTypeSlides = [{
    type: 'content',
    layout: 'chart',
    title: 'Data',
    chart: {
        type: 'INVALID_TYPE',
        title: 'Test',
        data: {
            labels: ['A', 'B'],
            datasets: [{
                name: 'Test',
                values: [10, 20]
            }]
        }
    }
}];

const result4 = validateAndFixChartSlides(invalidTypeSlides);
console.log('✓ Result:', result4[0].chart.type === 'column' ? 'PASS - Defaulted to column' : 'FAIL');
console.log('  Type:', result4[0].chart.type);
console.log('');

// Test Case 5: Missing chart data
console.log('Test 5: Missing Chart Data (Should Convert to Content Slide)');
const missingDataSlides = [{
    type: 'content',
    layout: 'chart',
    title: 'Broken Chart',
    chart: {
        type: 'pie',
        title: 'Test',
        data: {
            labels: [],  // Empty labels
            datasets: []  // Empty datasets
        }
    },
    content: ['Fallback content']
}];

const result5 = validateAndFixChartSlides(missingDataSlides);
console.log('✓ Result:', result5[0].layout === 'bullets' && !result5[0].chart ? 'PASS - Converted to content slide' : 'FAIL');
console.log('  Layout:', result5[0].layout);
console.log('  Has chart:', !!result5[0].chart);
console.log('');

// Test Case 6: Case insensitive chart type
console.log('Test 6: Case Insensitive Chart Type');
const mixedCaseSlides = [{
    type: 'content',
    layout: 'chart',
    title: 'Test',
    chart: {
        type: 'LINE',  // Uppercase
        title: 'Test',
        data: {
            labels: ['A', 'B'],
            datasets: [{
                name: 'Test',
                values: [10, 20]
            }]
        }
    }
}];

const result6 = validateAndFixChartSlides(mixedCaseSlides);
console.log('✓ Result:', result6[0].chart.type === 'line' ? 'PASS - Normalized to lowercase' : 'FAIL');
console.log('  Type:', result6[0].chart.type);
console.log('');

console.log('='.repeat(50));
console.log('✅ All chart validation tests completed!');
console.log('='.repeat(50));

