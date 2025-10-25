// Sharing and collaboration functionality

/**
 * Share presentation with others
 */
async function sharePresentation() {
    if (!window.currentSlideData) {
        alert('Please generate a presentation first');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        alert('Please enter your API key first');
        return;
    }
    
    try {
        const response = await fetch('/api/share', {
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
            throw new Error(`Sharing failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            showShareLinkModal(result.shareUrl, result.expiresIn);
        } else {
            throw new Error(result.error || 'Sharing failed');
        }
        
    } catch (error) {
        console.error('Sharing failed:', error);
        showNotification('❌ Sharing failed: ' + error.message, 'error');
    }
}

/**
 * Show share link modal
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
window.openShareUrl = openShareUrl;
