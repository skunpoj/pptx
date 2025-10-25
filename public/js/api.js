// Main API module - loads all API functionality
// This replaces the monolithic api.js file with a modular approach

// Note: Individual API modules are loaded via script tags in HTML
// This file provides backward compatibility and initialization

// Re-export commonly used functions for backward compatibility
window.generatePreview = window.generatePreview;
window.generatePresentation = window.generatePresentation;
window.viewPresentation = window.viewPresentation;
window.sharePresentation = window.sharePresentation;
window.modifyCurrentSlide = window.modifyCurrentSlide;

// Initialize API on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📡 API modules loaded successfully');
    
    // Check server capabilities
    if (window.checkServerCapabilities) {
        window.checkServerCapabilities();
    }
});