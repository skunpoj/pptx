// Presentation viewer functionality

/**
 * View presentation in browser
 */
function viewPresentation(blobUrl) {
    // Create viewer modal
    const modal = document.createElement('div');
    modal.id = 'presentationViewer';
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
    
    // Create viewer content
    const viewerContent = document.createElement('div');
    viewerContent.style.backgroundColor = 'white';
    viewerContent.style.borderRadius = '8px';
    viewerContent.style.width = '90%';
    viewerContent.style.height = '90%';
    viewerContent.style.maxWidth = '1200px';
    viewerContent.style.position = 'relative';
    viewerContent.style.overflow = 'hidden';
    
    // Create header
    const header = document.createElement('div');
    header.style.padding = '1rem';
    header.style.borderBottom = '1px solid #eee';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    
    const title = document.createElement('h3');
    title.textContent = '📋 Presentation Viewer';
    title.style.margin = '0';
    title.style.color = '#333';
    header.appendChild(title);
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#666';
    closeBtn.onclick = closePresentationViewer;
    header.appendChild(closeBtn);
    
    // Create navigation
    const navigation = document.createElement('div');
    navigation.style.padding = '0.5rem 1rem';
    navigation.style.borderBottom = '1px solid #eee';
    navigation.style.display = 'flex';
    navigation.style.justifyContent = 'space-between';
    navigation.style.alignItems = 'center';
    navigation.style.backgroundColor = '#f8f9fa';
    
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.onclick = previousSlide;
    navigation.appendChild(prevBtn);
    
    const slideInfo = document.createElement('span');
    slideInfo.id = 'slideInfo';
    slideInfo.textContent = 'Slide 1 of 1';
    slideInfo.style.fontWeight = 'bold';
    slideInfo.style.color = '#333';
    navigation.appendChild(slideInfo);
    
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'btn btn-primary';
    nextBtn.onclick = nextSlide;
    navigation.appendChild(nextBtn);
    
    // Create content area
    const contentArea = document.createElement('div');
    contentArea.id = 'slideContent';
    contentArea.style.padding = '2rem';
    contentArea.style.height = 'calc(100% - 120px)';
    contentArea.style.overflow = 'auto';
    contentArea.style.backgroundColor = '#fff';
    
    // Create footer
    const footer = document.createElement('div');
    footer.style.padding = '1rem';
    footer.style.borderTop = '1px solid #eee';
    footer.style.backgroundColor = '#f8f9fa';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '📥 Download';
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = 'presentation.pptx';
        link.click();
    };
    footer.appendChild(downloadBtn);
    
    const shareBtn = document.createElement('button');
    shareBtn.textContent = '🔗 Share';
    shareBtn.className = 'btn btn-secondary';
    shareBtn.onclick = () => sharePresentation();
    footer.appendChild(shareBtn);
    
    // Assemble modal
    viewerContent.appendChild(header);
    viewerContent.appendChild(navigation);
    viewerContent.appendChild(contentArea);
    viewerContent.appendChild(footer);
    modal.appendChild(viewerContent);
    
    // Add to page
    document.body.appendChild(modal);
    
    // Load presentation
    loadPresentationViewer(blobUrl);
    
    // Handle keyboard navigation
    document.addEventListener('keydown', handleSlideNavigation);
}

/**
 * Load presentation data for viewer
 */
function loadPresentationViewer(blobUrl) {
    // This would typically load the presentation data
    // For now, we'll show a placeholder
    const contentArea = document.getElementById('slideContent');
    if (contentArea) {
        contentArea.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h2>📋 Presentation Viewer</h2>
                <p>Loading presentation...</p>
                <div style="margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="window.open('${blobUrl}', '_blank')">
                        Open in New Tab
                    </button>
                </div>
            </div>
        `;
    }
    
    // Initialize slide navigation
    window.currentSlide = 0;
    window.totalSlides = 1; // This would be set from actual presentation data
    displaySlide(0);
}

/**
 * Display current slide
 */
function displaySlide(index) {
    const slideInfo = document.getElementById('slideInfo');
    if (slideInfo) {
        slideInfo.textContent = `Slide ${index + 1} of ${window.totalSlides}`;
    }
    
    // Update navigation buttons
    const prevBtn = document.querySelector('#presentationViewer button[onclick="previousSlide()"]');
    const nextBtn = document.querySelector('#presentationViewer button[onclick="nextSlide()"]');
    
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === window.totalSlides - 1;
}

/**
 * Navigate to previous slide
 */
function previousSlide() {
    if (window.currentSlide > 0) {
        window.currentSlide--;
        displaySlide(window.currentSlide);
    }
}

/**
 * Navigate to next slide
 */
function nextSlide() {
    if (window.currentSlide < window.totalSlides - 1) {
        window.currentSlide++;
        displaySlide(window.currentSlide);
    }
}

/**
 * Handle keyboard navigation
 */
function handleSlideNavigation(e) {
    if (!document.getElementById('presentationViewer')) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            previousSlide();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextSlide();
            break;
        case 'Escape':
            e.preventDefault();
            closePresentationViewer();
            break;
    }
}

/**
 * Close presentation viewer
 */
function closePresentationViewer() {
    const modal = document.getElementById('presentationViewer');
    if (modal) {
        modal.remove();
    }
    
    // Remove keyboard listener
    document.removeEventListener('keydown', handleSlideNavigation);
}

/**
 * View PDF version
 */
function viewPDF(sessionId) {
    if (!sessionId) {
        alert('Session ID not available for PDF conversion');
        return;
    }
    
    // Open PDF viewer
    const pdfUrl = `/api/pdf/${sessionId}`;
    window.open(pdfUrl, '_blank');
}

/**
 * Open in Office 365
 */
function openInOffice365(blobUrl) {
    const officeUrl = `https://office.com/launch/powerpoint?url=${encodeURIComponent(blobUrl)}`;
    window.open(officeUrl, '_blank');
}

/**
 * Open in Google Slides
 */
function openInGoogleSlides(blobUrl) {
    const googleUrl = `https://docs.google.com/presentation/d/create?usp=sharing`;
    window.open(googleUrl, '_blank');
}

// Export functions for use in other modules
window.viewPresentation = viewPresentation;
window.closePresentationViewer = closePresentationViewer;
window.viewPDF = viewPDF;
