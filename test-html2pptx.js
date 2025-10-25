/**
 * Test script to verify html2pptx is working
 * Run with: node test-html2pptx.js
 */

const fs = require('fs').promises;
const path = require('path');

async function testHtml2Pptx() {
    console.log('\n='.repeat(60));
    console.log('Testing html2pptx Installation');
    console.log('='.repeat(60));
    
    // Step 1: Check if packages exist
    console.log('\n1. Checking Required Packages...');
    let pptxgen, html2pptx;
    
    try {
        pptxgen = require('pptxgenjs');
        console.log('   ✓ pptxgenjs loaded');
    } catch (e) {
        console.log('   ✗ pptxgenjs NOT FOUND:', e.message);
        console.log('\n   Install with: npm install -g pptxgenjs');
        return;
    }
    
    try {
        ({ html2pptx } = require('@ant/html2pptx'));
        console.log('   ✓ @ant/html2pptx loaded');
    } catch (e) {
        console.log('   ✗ @ant/html2pptx NOT FOUND:', e.message);
        console.log('\n   Install with: npm install -g @ant/html2pptx');
        console.log('   Or from local file: npm install -g skills/pptx/html2pptx.tgz');
        return;
    }
    
    // Step 2: Create a simple test HTML
    console.log('\n2. Creating Test HTML...');
    const testDir = path.join(__dirname, 'test-workspace');
    await fs.mkdir(testDir, { recursive: true });
    
    const testHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        .col {
            display: flex;
            flex-direction: column;
        }
        .center {
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>
</head>
<body class="col center" style="width: 960px; height: 540px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <h1 style="color: white; font-size: 3rem; text-align: center;">Test Slide</h1>
    <p style="color: white; font-size: 1.2rem; text-align: center;">This is a test slide created by html2pptx</p>
</body>
</html>`;
    
    const htmlPath = path.join(testDir, 'test-slide.html');
    await fs.writeFile(htmlPath, testHtml);
    console.log('   ✓ Test HTML created:', htmlPath);
    
    // Step 3: Try to create presentation
    console.log('\n3. Testing html2pptx Conversion...');
    try {
        const pptx = new pptxgen();
        pptx.layout = "LAYOUT_16x9";
        console.log('   ✓ PPTX instance created');
        
        console.log('   Converting HTML to PowerPoint...');
        await html2pptx(htmlPath, pptx);
        console.log('   ✓ HTML converted successfully');
        
        const outputPath = path.join(testDir, 'test-output.pptx');
        await pptx.writeFile(outputPath);
        console.log('   ✓ PowerPoint file created:', outputPath);
        
        console.log('\n' + '='.repeat(60));
        console.log('✓ SUCCESS! html2pptx is working correctly');
        console.log('='.repeat(60));
        console.log(`\nTest file created: ${outputPath}`);
        console.log('You can open this file in PowerPoint to verify.\n');
        
    } catch (error) {
        console.log('   ✗ FAILED:', error.message);
        console.log('\n   Full error:');
        console.log(error.stack);
        
        console.log('\n' + '='.repeat(60));
        console.log('✗ FAILED - html2pptx is not working');
        console.log('='.repeat(60));
        
        // Check Playwright
        console.log('\n4. Checking Playwright (required by html2pptx)...');
        try {
            const { chromium } = require('playwright');
            console.log('   ✓ Playwright module found');
            
            try {
                const browser = await chromium.launch({ headless: true });
                console.log('   ✓ Chromium can launch');
                await browser.close();
            } catch (launchError) {
                console.log('   ✗ Chromium launch failed:', launchError.message);
                console.log('\n   Solution: Install Playwright browsers:');
                console.log('   npx playwright install --with-deps chromium');
            }
        } catch (e) {
            console.log('   ✗ Playwright not found:', e.message);
            console.log('\n   Solution: Install Playwright:');
            console.log('   npm install -g playwright');
            console.log('   npx playwright install --with-deps chromium');
        }
    }
    
    // Cleanup
    console.log('\n5. Cleanup...');
    try {
        await fs.rm(testDir, { recursive: true, force: true });
        console.log('   ✓ Test files cleaned up\n');
    } catch (e) {
        console.log('   Note: Manual cleanup may be needed:', testDir, '\n');
    }
}

// Run the test
testHtml2Pptx().catch(err => {
    console.error('\nUnexpected error:', err);
    process.exit(1);
});

