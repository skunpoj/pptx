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
    
    const apiKey = (typeof getApiKey === 'function') ? getApiKey() : null;
    if (!apiKey) {
        console.error('❌ No API key found');
        alert('Please enter your API key first');
        return;
    }
    
    console.log('✅ API key found, proceeding with generation');
    
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
        alert('Please enter your API key first');
        return;
    }
    
    // Show modification modal
    showSlideModificationModal(window.currentSlideData.slides[0], 0);
}

/**
 * Show download link with file information
 */
function showDownloadLink(downloadUrl, fileSize, storage = {}) {
    // Create download link element
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = 'presentation.pptx';
    downloadLink.className = 'download-link';
    downloadLink.style.display = 'inline-block';
    downloadLink.style.marginTop = '1rem';
    downloadLink.style.padding = '0.75rem 1.5rem';
    downloadLink.style.backgroundColor = '#4CAF50';
    downloadLink.style.color = 'white';
    downloadLink.style.textDecoration = 'none';
    downloadLink.style.borderRadius = '4px';
    downloadLink.style.fontWeight = 'bold';
    downloadLink.textContent = `📥 Download PowerPoint (${formatFileSize(fileSize)})`;
    
    // Add to generatePptSection instead of preview container
    const container = document.getElementById('generatePptSection');
    if (container) {
        // Remove existing download link and options
        const existingLink = container.querySelector('.download-link');
        const existingOptions = container.querySelector('.presentation-options');
        if (existingLink) existingLink.remove();
        if (existingOptions) existingOptions.remove();
        
        container.appendChild(downloadLink);
    }
    
    // Auto-click to start download
    downloadLink.click();
    
    // Show additional options
    showPresentationOptions(downloadUrl, storage);
}

/**
 * Show presentation viewing options
 */
function showPresentationOptions(downloadUrl, storage) {
    const container = document.getElementById('generatePptSection');
    if (!container) return;
    
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'presentation-options';
    optionsDiv.style.marginTop = '1rem';
    optionsDiv.style.padding = '1rem';
    optionsDiv.style.backgroundColor = '#f5f5f5';
    optionsDiv.style.borderRadius = '4px';
    optionsDiv.style.border = '1px solid #ddd';
    
    const title = document.createElement('h4');
    title.textContent = '📋 Presentation Options';
    title.style.margin = '0 0 0.5rem 0';
    title.style.color = '#333';
    optionsDiv.appendChild(title);
    
    // View in browser button
    const viewBtn = document.createElement('button');
    viewBtn.textContent = '👁️ View in Browser';
    viewBtn.className = 'btn btn-secondary';
    viewBtn.style.marginRight = '0.5rem';
    viewBtn.onclick = () => viewPresentation(downloadUrl);
    optionsDiv.appendChild(viewBtn);
    
    // PDF conversion (if available)
    if (window.serverCapabilities.pdfConversion) {
        const pdfBtn = document.createElement('button');
        pdfBtn.textContent = '📄 Convert to PDF';
        pdfBtn.className = 'btn btn-secondary';
        pdfBtn.style.marginRight = '0.5rem';
        pdfBtn.onclick = () => convertToPDF(storage.sessionId);
        optionsDiv.appendChild(pdfBtn);
    }
    
    // Share button
    const shareBtn = document.createElement('button');
    shareBtn.textContent = '🔗 Share Link';
    shareBtn.className = 'btn btn-secondary';
    shareBtn.onclick = () => sharePresentation();
    optionsDiv.appendChild(shareBtn);
    
    container.appendChild(optionsDiv);
}

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
