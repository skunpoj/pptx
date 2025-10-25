/**
 * Diagnostic Script for AI Text2PPT Pro
 * Run this to check if everything is working
 */

const fs = require('fs');
const path = require('path');

console.log('\n='.repeat(60));
console.log('AI Text2PPT Pro - Diagnostic Script');
console.log('='.repeat(60));

// Check Node version
console.log('\n1. Node Version:');
console.log(`   ${process.version} (Recommended: v16+)`);

// Check platform
console.log('\n2. Platform:');
console.log(`   ${process.platform} - ${process.arch}`);

// Check if packages are installed
console.log('\n3. Checking Global Packages:');
const packagesToCheck = ['pptxgenjs', 'jszip', 'sharp', 'playwright', '@ant/html2pptx'];

packagesToCheck.forEach(pkg => {
    try {
        const resolved = require.resolve(pkg);
        console.log(`   ✓ ${pkg} - Found`);
    } catch (e) {
        console.log(`   ✗ ${pkg} - NOT FOUND`);
    }
});

// Check if workspace directory exists
console.log('\n4. Workspace Directory:');
const workspaceDir = path.join(__dirname, 'workspace');
if (fs.existsSync(workspaceDir)) {
    console.log(`   ✓ Exists: ${workspaceDir}`);
    const files = fs.readdirSync(workspaceDir);
    console.log(`   Sessions: ${files.length}`);
} else {
    console.log(`   ✗ NOT FOUND: ${workspaceDir}`);
}

// Check Playwright
console.log('\n5. Playwright Status:');
try {
    const { chromium } = require('playwright');
    console.log('   ✓ Playwright module loaded');
    console.log('   Checking Chromium browser...');
    
    chromium.launch({ headless: true })
        .then(browser => {
            console.log('   ✓ Chromium browser can launch');
            return browser.close();
        })
        .catch(err => {
            console.log('   ✗ Chromium launch failed:', err.message);
        })
        .finally(() => {
            // Check html2pptx
            console.log('\n6. html2pptx Test:');
            try {
                const { html2pptx } = require('@ant/html2pptx');
                console.log('   ✓ html2pptx module loaded');
                console.log('   ✓ Function type:', typeof html2pptx);
            } catch (e) {
                console.log('   ✗ html2pptx load failed:', e.message);
            }
            
            console.log('\n' + '='.repeat(60));
            console.log('Diagnostic Complete');
            console.log('='.repeat(60) + '\n');
        });
} catch (e) {
    console.log('   ✗ Playwright not found:', e.message);
    
    console.log('\n6. html2pptx Test:');
    try {
        const { html2pptx } = require('@ant/html2pptx');
        console.log('   ✓ html2pptx module loaded');
    } catch (e) {
        console.log('   ✗ html2pptx load failed:', e.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('Diagnostic Complete');
    console.log('='.repeat(60) + '\n');
}

