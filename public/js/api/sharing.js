// Sharing and collaboration functionality

/**
 * Share presentation with others
 */
async function sharePresentation() {
    if (!window.currentSlideData) {
        alert('Please generate a presentation first');
        return;
    }
    
    console.log('📤 Creating shareable link...');
    
    // Show loading notification
    if (typeof showNotification === 'function') {
        showNotification('Creating shareable link...', 'info');
    }
    
    try {
        const response = await fetch('/api/share-presentation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slideData: window.currentSlideData,
                title: window.currentSlideData?.slides[0]?.title || 'AI Presentation',
                sessionId: window.currentSessionId  // Include sessionId for PDF access
            })
        });
        
        if (!response.ok) {
            throw new Error(`Sharing failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        console.log('✅ Share link created:', result.shareUrl);
        
        if (result.shareId && result.shareUrl) {
            // Show success notification
            if (typeof showNotification === 'function') {
                showNotification('✅ Shareable link created!', 'success');
            }
            
            // Show share link INLINE next to button
            showShareLinkInline(result.shareUrl, result.expiresIn);
        } else {
            throw new Error(result.error || 'Sharing failed');
        }
        
    } catch (error) {
        console.error('❌ Sharing failed:', error);
        console.error('   Error details:', error.message);
        
        if (typeof showNotification === 'function') {
            showNotification('❌ Sharing failed: ' + error.message, 'error');
        } else {
            alert('Sharing failed: ' + error.message);
        }
    }
}

/**
 * Show share link as the main result interface
 */
function showShareLinkInline(shareUrl, expiresIn) {
    // Find the presentation options container
    const optionsDiv = document.querySelector('.presentation-options');
    if (!optionsDiv) {
        console.warn('Could not find presentation options container');
        return;
    }
    
    // Remove loading message
    const loadingMsg = document.getElementById('shareLoadingMessage');
    if (loadingMsg) loadingMsg.remove();
    
    // Remove any existing share link display
    const existing = document.getElementById('shareLinkDisplay');
    if (existing) existing.remove();
    
    // Create main result display
    const shareDisplay = document.createElement('div');
    shareDisplay.id = 'shareLinkDisplay';
    
    // Build the content
    let contentHTML = `
        <div style="margin-bottom: 1.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <span style="font-size: 1.5rem;">🔗</span>
                <strong style="color: #667eea; font-size: 1.1rem;">Shareable Link</strong>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                <input 
                    type="text" 
                    value="${shareUrl}" 
                    readonly 
                    id="shareLinkInput"
                    style="flex: 1; min-width: 300px; padding: 0.5rem; border: 1px solid #667eea; border-radius: 4px; font-size: 0.9rem; font-family: monospace; background: white;"
                />
                <button 
                    onclick="window.copyShareLink()" 
                    style="padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; white-space: nowrap;"
                >📋 Copy Link</button>
                <button 
                    onclick="window.open('${shareUrl}', '_blank')" 
                    style="padding: 0.5rem 1rem; background: #764ba2; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; white-space: nowrap;"
                >👁️ View Online</button>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.85rem; color: #666;">
                ⏱️ Link expires in ${expiresIn} • Share with anyone!
            </div>
        </div>
    `;
    
    // Add download section
    if (window.currentDownloadUrl && window.currentFileSize) {
        contentHTML += `
            <div style="padding-top: 1rem; border-top: 1px solid #ddd;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span style="font-size: 1.5rem;">📥</span>
                    <strong style="color: #4CAF50; font-size: 1.1rem;">Download</strong>
                </div>
                <div id="downloadButtonContainer"></div>
            </div>
        `;
    }
    
    // Add PDF info section if sessionId is available
    if (window.currentSessionId) {
        contentHTML += `
            <div style="padding-top: 1rem; border-top: 1px solid #ddd; margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.5rem;">📄</span>
                    <strong style="color: #e67e22; font-size: 1.1rem;">PDF Version</strong>
                </div>
                <div style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem;">
                    PDF is automatically generated and accessible via:
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <a 
                        href="/view-pdf/${window.currentSessionId}" 
                        target="_blank"
                        style="padding: 0.5rem 1rem; background: #e67e22; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; white-space: nowrap;"
                    >👁️ View PDF</a>
                    <a 
                        href="/download/${window.currentSessionId}/presentation.pdf" 
                        download="presentation.pdf"
                        style="padding: 0.5rem 1rem; background: #d35400; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; white-space: nowrap;"
                    >📥 Download PDF</a>
                </div>
            </div>
        `;
    }
    
    shareDisplay.innerHTML = contentHTML;
    optionsDiv.appendChild(shareDisplay);
    
    // Add the download button
    if (window.currentDownloadUrl && window.currentFileSize) {
        const downloadContainer = document.getElementById('downloadButtonContainer');
        if (downloadContainer) {
            const downloadBtn = document.createElement('a');
            downloadBtn.href = window.currentDownloadUrl;
            downloadBtn.download = 'presentation.pptx';
            downloadBtn.className = 'download-link';
            downloadBtn.style.cssText = `
                display: inline-block;
                padding: 0.75rem 1.5rem;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 4px;
                font-weight: 600;
                cursor: pointer;
                transition: background-color 0.2s;
            `;
            downloadBtn.onmouseover = () => downloadBtn.style.backgroundColor = '#45a049';
            downloadBtn.onmouseout = () => downloadBtn.style.backgroundColor = '#4CAF50';
            downloadBtn.textContent = `📥 Download PowerPoint (${formatFileSize(window.currentFileSize)})`;
            downloadContainer.appendChild(downloadBtn);
        }
    }
    
    // Store URL for copy function
    window.currentShareUrl = shareUrl;
    
    // Scroll to show the link
    setTimeout(() => {
        shareDisplay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Format file size for display (helper function for sharing.js)
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Copy share link to clipboard (simplified version)
 */
function copyShareLink() {
    const input = document.getElementById('shareLinkInput');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999); // For mobile
        
        navigator.clipboard.writeText(input.value).then(() => {
            if (typeof showNotification === 'function') {
                showNotification('✅ Link copied!', 'success');
            }
        }).catch(() => {
            document.execCommand('copy');
            if (typeof showNotification === 'function') {
                showNotification('✅ Link copied!', 'success');
            }
        });
    }
}

/**
 * Show share link modal (OLD - KEPT FOR BACKWARDS COMPATIBILITY)
 */
function showShareLinkModal(shareUrl, expiresIn) {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '2rem';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '500px';
    modalContent.style.position = 'relative';
    
    // Create header
    const header = document.createElement('div');
    header.style.marginBottom = '1rem';
    
    const title = document.createElement('h3');
    title.textContent = '🔗 Share Presentation';
    title.style.margin = '0 0 0.5rem 0';
    title.style.color = '#333';
    header.appendChild(title);
    
    const description = document.createElement('p');
    description.textContent = 'Share this link with others to view your presentation:';
    description.style.margin = '0';
    description.style.color = '#666';
    header.appendChild(description);
    
    // Create URL input
    const urlContainer = document.createElement('div');
    urlContainer.style.marginBottom = '1rem';
    
    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.value = shareUrl;
    urlInput.readOnly = true;
    urlInput.style.width = '100%';
    urlInput.style.padding = '0.75rem';
    urlInput.style.border = '1px solid #ddd';
    urlInput.style.borderRadius = '4px';
    urlInput.style.fontSize = '0.9rem';
    urlContainer.appendChild(urlInput);
    
    // Create buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '0.5rem';
    buttonContainer.style.marginBottom = '1rem';
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy Link';
    copyBtn.className = 'btn btn-primary';
    copyBtn.onclick = copyShareUrl;
    buttonContainer.appendChild(copyBtn);
    
    const openBtn = document.createElement('button');
    openBtn.textContent = '🔗 Open Link';
    openBtn.className = 'btn btn-secondary';
    openBtn.onclick = openShareUrl;
    buttonContainer.appendChild(openBtn);
    
    // Create expiration info
    const expirationInfo = document.createElement('div');
    expirationInfo.style.fontSize = '0.9rem';
    expirationInfo.style.color = '#666';
    expirationInfo.style.textAlign = 'center';
    expirationInfo.style.padding = '0.5rem';
    expirationInfo.style.backgroundColor = '#f8f9fa';
    expirationInfo.style.borderRadius = '4px';
    expirationInfo.textContent = `Link expires in ${expiresIn}`;
    
    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '1rem';
    closeBtn.style.right = '1rem';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#666';
    closeBtn.onclick = () => modal.remove();
    
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(header);
    modalContent.appendChild(urlContainer);
    modalContent.appendChild(buttonContainer);
    modalContent.appendChild(expirationInfo);
    modal.appendChild(modalContent);
    
    // Add to page
    document.body.appendChild(modal);
    
    // Store URL for copy function
    window.currentShareUrl = shareUrl;
}

/**
 * Copy share URL to clipboard
 */
function copyShareUrl() {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(window.currentShareUrl).then(() => {
            showNotification('✅ Link copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(window.currentShareUrl);
        });
    } else {
        fallbackCopyTextToClipboard(window.currentShareUrl);
    }
}

/**
 * Fallback copy method
 */
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        showNotification('✅ Link copied to clipboard!', 'success');
    } catch (err) {
        showNotification('❌ Failed to copy link', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Open share URL
 */
function openShareUrl() {
    if (window.currentShareUrl) {
        window.open(window.currentShareUrl, '_blank');
    }
}

// Export functions for use in other modules
window.sharePresentation = sharePresentation;
window.copyShareUrl = copyShareUrl;
window.copyShareLink = copyShareLink;
window.openShareUrl = openShareUrl;
