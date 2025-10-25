// Presentation generation functionality

/**
 * Generate PowerPoint presentation from current slide data
 */
async function generatePresentation() {
    if (!window.currentSlideData) {
        alert('Please generate a preview first');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        alert('Please enter your API key first');
        return;
    }
    
    // Show loading state
    const generateBtn = document.getElementById('generateBtn');
    const originalText = generateBtn.textContent;
    generateBtn.textContent = '🔄 Generating PowerPoint...';
    generateBtn.disabled = true;
    
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slideData: window.currentSlideData,
                apiKey: apiKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`Generation failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Show download link
            showDownloadLink(result.downloadUrl, result.fileSize, result.storage);
            showNotification('✅ PowerPoint generated successfully!', 'success');
        } else {
            throw new Error(result.error || 'Generation failed');
        }
        
    } catch (error) {
        console.error('Generation failed:', error);
        showNotification('❌ Generation failed: ' + error.message, 'error');
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
    
    // Add to preview container
    const container = document.getElementById('previewContainer');
    if (container) {
        // Remove existing download link
        const existingLink = container.querySelector('.download-link');
        if (existingLink) {
            existingLink.remove();
        }
        
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
    const container = document.getElementById('previewContainer');
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
