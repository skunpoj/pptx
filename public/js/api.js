// Main API module - loads all API functionality
// This replaces the monolithic api.js file with a modular approach

// Note: Individual API modules are loaded via script tags in HTML BEFORE this file
// This file only provides initialization and verification

// DO NOT create stub functions here - they will override the real functions!
// The real functions are loaded from /js/api/*.js modules before this file loads

// Initialize API on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📡 API modules verification...');
    
    // Verify critical functions are loaded
    const criticalFunctions = ['generatePreview', 'generatePresentation', 'displayPreview', 'getApiKey'];
    let allLoaded = true;
    
    criticalFunctions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName} loaded successfully`);
        } else {
            console.error(`❌ ${funcName} NOT loaded! Check script loading order.`);
            allLoaded = false;
        }
    });
    
    if (allLoaded) {
        console.log('🎉 All API modules loaded and ready!');
    } else {
        console.error('⚠️ Some API modules failed to load. Check browser console for errors.');
    }
    
    // Check server capabilities
    if (window.checkServerCapabilities) {
        window.checkServerCapabilities();
    } else {
        console.warn('⚠️ checkServerCapabilities not found');
    }
});