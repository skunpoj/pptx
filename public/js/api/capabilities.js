// Server capabilities and health checks

// Global state for server capabilities
window.serverCapabilities = {
    pdfConversion: false,
    features: {
        pptxDownload: true,
        pdfDownload: false,
        pdfViewer: false,
        shareableLinks: true,
        onlineViewer: true
    },
    loaded: false
};

/**
 * Check server capabilities on page load
 * Determines which features are available (e.g., PDF conversion)
 */
async function checkServerCapabilities() {
    try {
        const response = await fetch('/api/capabilities');
        if (response.ok) {
            const capabilities = await response.json();
            window.serverCapabilities = {
                ...capabilities,
                loaded: true
            };
            
            // Log status
            if (!capabilities.pdfConversion) {
                console.warn('⚠️ PDF features disabled:', capabilities.message);
            } else {
                console.log('✅ All features available, including PDF conversion');
            }
            
            return capabilities;
        }
    } catch (error) {
        console.warn('Could not check server capabilities:', error);
    }
    return window.serverCapabilities;
}

// Check capabilities when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkServerCapabilities);
} else {
    checkServerCapabilities();
}

/**
 * Get API key from localStorage based on current provider
 */
function getApiKey() {
    const currentProvider = window.currentProvider || localStorage.getItem('ai_provider') || 'anthropic';
    const apiKey = localStorage.getItem(`${currentProvider}_api_key`) || '';
    
    if (!apiKey) {
        console.log(`ℹ️ No API key found for provider: ${currentProvider}, using default backend provider`);
        // Return empty string - backend will use Bedrock as fallback
        return '';
    } else {
        console.log(`✅ API key loaded for provider: ${currentProvider}`);
    }
    
    return apiKey;
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Use existing showStatus function if available, otherwise create simple alert
    if (window.showStatus) {
        window.showStatus(message, type);
    } else {
        // Create a simple notification
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '100px'; // Moved down to be below header
        notification.style.right = '20px';
        notification.style.padding = '1rem';
        notification.style.borderRadius = '4px';
        notification.style.color = 'white';
        notification.style.fontWeight = 'bold';
        notification.style.zIndex = '10000';
        notification.style.maxWidth = '300px';
        notification.textContent = message;
        
        // Set color based on type
        switch(type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ff9800';
                break;
            default:
                notification.style.backgroundColor = '#2196F3';
        }
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
}

/**
 * Update progress indicator
 */
function updateProgress(percent, message) {
    if (window.updateProgress) {
        window.updateProgress(percent, message);
    } else {
        console.log(`Progress: ${percent}% - ${message}`);
    }
}

/**
 * Convert presentation to PDF
 */
function convertToPDF(sessionId) {
    if (!sessionId) {
        showNotification('Session ID not available for PDF conversion', 'error');
        return;
    }
    
    // Open PDF conversion endpoint
    const pdfUrl = `/api/pdf/${sessionId}`;
    window.open(pdfUrl, '_blank');
}

// Export for use in other modules
window.checkServerCapabilities = checkServerCapabilities;
window.getApiKey = getApiKey;
window.showNotification = showNotification;
window.updateProgress = updateProgress;
window.convertToPDF = convertToPDF;
