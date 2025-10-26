// Presentation generation functionality

/**
 * Generate PowerPoint presentation from current slide data
 */
async function generatePresentation() {
    console.log('🎬 generatePresentation called');
    
    if (!window.currentSlideData) {
        console.error('❌ No currentSlideData found');
        alert('Please generate a preview first');
        return;
    }
    
    console.log('📊 Current slide data:', {
        slides: window.currentSlideData.slides?.length || 0,
        hasTheme: !!window.currentSlideData.designTheme,
        hasTemplate: !!window.templateFile
    });
    
    const apiKey = (typeof getApiKey === 'function') ? getApiKey() : '';
    
    if (!apiKey) {
        console.log('ℹ️ No API key configured, using default backend provider');
    } else {
        console.log('✅ API key found, proceeding with generation');
    }
    
    // Show loading state
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = window.templateFile ? '🔄 Generating with template...' : '🔄 Generating PowerPoint...';
    generateBtn.disabled = true;
    
    try {
        let response;
        
        // Check if template file is available
        if (window.templateFile) {
            console.log('📄 Using template file:', window.templateFile.name);
            
            // Use FormData for template-based generation
            const formData = new FormData();
            formData.append('templateFile', window.templateFile);
            formData.append('slideData', JSON.stringify(window.currentSlideData));
            formData.append('text', JSON.stringify(window.currentSlideData.slides));
            formData.append('apiKey', apiKey);
            formData.append('provider', window.currentProvider || 'anthropic');
            
            response = await fetch('/api/generate-with-template', {
                method: 'POST',
                body: formData
            });
        } else {
            // Regular generation without template
    const requestBody = {
        slideData: window.currentSlideData,
        apiKey: apiKey,
        provider: window.currentProvider || 'anthropic'
    };
    
    console.log('📤 Sending request to /api/generate:', {
        slideCount: requestBody.slideData.slides?.length,
        hasApiKey: !!requestBody.apiKey,
        provider: requestBody.provider
    });
    
            response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        }
        
        if (!response.ok) {
            let errorMessage = 'Generation failed';
            try {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const error = await response.json();
                    errorMessage = error.error || errorMessage;
                } else {
                    const text = await response.text();
                    errorMessage = text || `Server error: ${response.status}`;
                }
            } catch (e) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        console.log('✅ Preparing PowerPoint file...');
        const blob = await response.blob();
        console.log('  File size:', (blob.size / 1024).toFixed(2), 'KB');
        
        // Get storage URLs from response headers
        const sessionId = response.headers.get('X-Session-Id');
        const downloadUrl = response.headers.get('X-Download-Url');
        const pdfUrl = response.headers.get('X-PDF-Url');
        
        // Create blob URL for download
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Store for cleanup later
        if (window.currentDownloadUrl) {
            window.URL.revokeObjectURL(window.currentDownloadUrl);
        }
        window.currentDownloadUrl = blobUrl;
        window.currentSessionId = sessionId;
        window.currentFileSize = blob.size;  // Store file size for later use
        
        console.log('✅ PowerPoint generation complete!');
        console.log('  Session ID:', sessionId);
        console.log('  Download URL:', downloadUrl);
        console.log('  PDF URL:', pdfUrl);
        
            // Show download link
        showDownloadLink(blobUrl, blob.size, { sessionId, downloadUrl, pdfUrl });
        
        const successMessage = window.templateFile 
            ? '✅ PowerPoint generated with template successfully!' 
            : '✅ PowerPoint generated successfully!';
        if (typeof showNotification === 'function') {
            showNotification(successMessage, 'success');
        }
        
    } catch (error) {
        console.error('Generation failed:', error);
        if (typeof showNotification === 'function') {
        showNotification('❌ Generation failed: ' + error.message, 'error');
        }
    } finally {
        // Restore button state
        generateBtn.textContent = originalText;
        generateBtn.disabled = false;
    }
}

/**
 * Modify existing slides
 */
async function modifySlides() {
    if (!window.currentSlideData) {
        alert('Please generate a preview first');
        return;
    }
    
    const apiKey = getApiKey();
    
    if (!apiKey) {
        console.log('ℹ️ No API key configured, using default backend provider');
    }
    
    // Show modification modal
    showSlideModificationModal(window.currentSlideData.slides[0], 0);
}

/**
 * Show share and download section
 */
function showDownloadLink(downloadUrl, fileSize, storage = {}) {
    const container = document.getElementById('generatePptSection');
    if (!container) return;
    
    // Remove any existing sections
    const existingLink = container.querySelector('.download-link');
    const existingOptions = container.querySelector('.presentation-options');
    if (existingLink) existingLink.remove();
    if (existingOptions) existingOptions.remove();
    
    // Create share link section (this will be the main interface)
    const shareSection = document.createElement('div');
    shareSection.className = 'presentation-options';
    shareSection.style.marginTop = '1rem';
    shareSection.style.padding = '1.5rem';
    shareSection.style.backgroundColor = '#f8f9fa';
    shareSection.style.borderRadius = '8px';
    shareSection.style.border = '2px solid #667eea';
    
    const title = document.createElement('h3');
    title.textContent = '🎉 Presentation Generated Successfully!';
    title.style.margin = '0 0 1rem 0';
    title.style.color = '#333';
    title.style.fontSize = '1.3rem';
    shareSection.appendChild(title);
    
    const loadingMessage = document.createElement('div');
    loadingMessage.textContent = '⏳ Creating shareable link...';
    loadingMessage.style.padding = '0.5rem';
    loadingMessage.style.color = '#666';
    loadingMessage.style.fontSize = '0.95rem';
    loadingMessage.id = 'shareLoadingMessage';
    shareSection.appendChild(loadingMessage);
    
    container.appendChild(shareSection);
    
    // Auto-create share link (which will contain the download button)
    sharePresentation();
}

// PDF conversion functions removed - PDFs are now auto-generated on the server

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Export functions for use in other modules
window.generatePresentation = generatePresentation;
window.modifySlides = modifySlides;
window.showDownloadLink = showDownloadLink;
