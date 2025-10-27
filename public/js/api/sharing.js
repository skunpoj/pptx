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
            
            // Notify progress tracker that share link is ready
            if (window.onShareLinkCreated) {
                window.onShareLinkCreated();
            }
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
 * Show share link inline - replaces loading message in right card
 */
function showShareLinkInline(shareUrl, expiresIn) {
    // Store the share URL
    window.currentShareUrl = shareUrl;
    window.shareUrlExpiry = expiresIn;
    
    // Extract shareId from URL
    const shareId = shareUrl.split('/').pop();
    
    // Find the results card on the right
    const resultsCard = document.getElementById('generateResultsCard');
    if (!resultsCard) {
        console.error('❌ Results card not found!');
        return;
    }
    
    // Make sure it's visible
    resultsCard.style.display = 'block';
    
    // Clear existing content (Zscaler-safe method)
    while (resultsCard.firstChild) {
        resultsCard.removeChild(resultsCard.firstChild);
    }
    
    console.log('✅ Creating share link display in results card');
    
    // Create the success card with share link
    const successCard = document.createElement('div');
    successCard.id = 'shareLinkDisplay';
    successCard.className = 'card';
    successCard.style.cssText = `
        background: white;
        border: 2px solid #667eea;
        border-radius: 8px;
        padding: 1.5rem;
    `;
    
    // Build compact success message - EVERYTHING ON ONE LINE
    let contentHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div style="font-size: 2rem;">✅</div>
            <h3 style="margin: 0; color: #155724; font-size: 1.1rem;">Presentation Ready!</h3>
        </div>
        
        <!-- Share Link + Copy Button + All Action Buttons - ALL ON ONE SINGLE LINE -->
        <div style="margin-bottom: 0.5rem;">
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: nowrap;">
                <input 
                    type="text" 
                    value="${shareUrl}" 
                    readonly 
                    id="shareLinkInput"
                    style="flex: 0 0 250px; min-width: 200px; padding: 0.6rem; border: 2px solid #667eea; border-radius: 4px; font-size: 0.75rem; font-family: monospace; background: #f8f9fa;"
                />
                <button 
                    onclick="window.copyShareLink()" 
                    style="padding: 0.6rem 0.8rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.85rem; white-space: nowrap;"
                >📋</button>
                <a 
                    href="/view/${shareId}" 
                    target="_blank"
                    style="padding: 0.6rem 0.8rem; background: #764ba2; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 0.85rem; white-space: nowrap;"
                >👁️ View</a>
    `;
    
    // Add download button - compact
    if (window.currentDownloadUrl && window.currentFileSize) {
        contentHTML += `
                <a 
                    href="${window.currentDownloadUrl}" 
                    download="presentation.pptx"
                    style="padding: 0.6rem 0.8rem; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 0.85rem; white-space: nowrap;"
                >📥 PPT</a>
        `;
    }
    
    // Check if PDF is ready and add button - compact, ready state only
    if (window.currentSessionId) {
        contentHTML += `
                <a 
                    href="/view-pdf/${window.currentSessionId}" 
                    target="_blank"
                    id="pdfViewBtn"
                    style="padding: 0.6rem 0.8rem; background: #e67e22; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 0.85rem; white-space: nowrap;"
                >📄 PDF</a>
        `;
    }
    
    contentHTML += `
            </div>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; color: #666;">
                ⏱️ Expires in ${expiresIn}
            </p>
        </div>
    `;
    
    successCard.innerHTML = contentHTML;
    
    // Append to results card
    resultsCard.appendChild(successCard);
    
    // Scroll to show the result
    setTimeout(() => {
        successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Check if PDF exists
 */
async function checkPDFStatus(sessionId) {
    try {
        const response = await fetch(`/view-pdf/${sessionId}`, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        return false;
    }
}

// PDF status checking removed - now we wait for PDF before showing success

/**
 * Open share link modal
 */
function openShareModal() {
    if (!window.currentShareUrl) {
        alert('No share link available');
        return;
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'shareModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 600px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        position: relative;
    `;
    
    modalContent.innerHTML = `
        <button 
            onclick="document.getElementById('shareModal').remove()" 
            style="position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #666; line-height: 1;"
        >×</button>
        
        <h2 style="margin: 0 0 1.5rem 0; color: #333; font-size: 1.5rem;">🔗 Shareable Link</h2>
        
        <div style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; color: #666; font-size: 0.9rem;">Your presentation link:</label>
            <div style="display: flex; gap: 0.5rem;">
                <input 
                    type="text" 
                    value="${window.currentShareUrl}" 
                    readonly 
                    id="shareModalInput"
                    style="flex: 1; padding: 0.75rem; border: 2px solid #667eea; border-radius: 4px; font-size: 0.95rem; font-family: monospace; background: #f8f9fa;"
                />
                <button 
                    onclick="window.copyShareLinkFromModal()" 
                    style="padding: 0.75rem 1.25rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; white-space: nowrap;"
                >📋 Copy</button>
            </div>
        </div>
        
        <div style="background: #f0f4ff; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <p style="margin: 0 0 0.5rem 0; color: #333; font-weight: 600;">📌 What's included in this link:</p>
            <ul style="margin: 0; padding-left: 1.5rem; color: #666;">
                <li>View slides online with navigation</li>
                <li>Download PowerPoint file</li>
                <li>View PDF version</li>
                <li>Modify slides and regenerate</li>
            </ul>
        </div>
        
        <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
            <button 
                onclick="window.open('${window.currentShareUrl}', '_blank')" 
                style="padding: 0.75rem 1.5rem; background: #764ba2; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;"
            >👁️ Open Link</button>
            <button 
                onclick="document.getElementById('shareModal').remove()" 
                style="padding: 0.75rem 1.5rem; background: #ddd; color: #333; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;"
            >Close</button>
        </div>
        
        <p style="margin-top: 1rem; font-size: 0.85rem; color: #999; text-align: center;">
            ⏱️ Link expires in ${window.shareUrlExpiry || '7 days'}
        </p>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

/**
 * Copy share link from modal
 */
function copyShareLinkFromModal() {
    const input = document.getElementById('shareModalInput');
    if (input) {
        input.select();
        input.setSelectionRange(0, 99999);
        
        navigator.clipboard.writeText(input.value).then(() => {
            if (typeof showNotification === 'function') {
                showNotification('✅ Link copied to clipboard!', 'success');
            }
        }).catch(() => {
            document.execCommand('copy');
            if (typeof showNotification === 'function') {
                showNotification('✅ Link copied to clipboard!', 'success');
            }
        });
    }
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
window.openShareModal = openShareModal;
window.copyShareLinkFromModal = copyShareLinkFromModal;
window.openShareUrl = openShareUrl;
