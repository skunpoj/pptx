// Main API module - loads all API functionality
// This replaces the monolithic api.js file with a modular approach

// Note: Individual API modules are loaded via script tags in HTML
// This file provides backward compatibility and initialization

// Re-export commonly used functions for backward compatibility
// These will be set by individual modules when they load
window.generatePreview = window.generatePreview || function() {
    console.error('generatePreview not loaded yet');
    alert('Preview functionality is loading, please try again in a moment');
};
window.generatePresentation = window.generatePresentation || function() {
    console.error('generatePresentation not loaded yet');
    alert('Generation functionality is loading, please try again in a moment');
};
window.viewPresentation = window.viewPresentation || function() {
    console.error('viewPresentation not loaded yet');
    alert('View functionality is loading, please try again in a moment');
};
window.sharePresentation = window.sharePresentation || function() {
    console.error('sharePresentation not loaded yet');
    alert('Share functionality is loading, please try again in a moment');
};
window.modifyCurrentSlide = window.modifyCurrentSlide || function() {
    console.error('modifyCurrentSlide not loaded yet');
    alert('Modification functionality is loading, please try again in a moment');
};

// Initialize API on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('📡 API modules loaded successfully');
    
    // Check server capabilities
    if (window.checkServerCapabilities) {
        window.checkServerCapabilities();
    }
});