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
 * Modify existing slides (opens modal for individual slide editing)
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
 * Modify slides with AI based on user prompt
 */
async function modifySlidesWithAI() {
    if (!window.currentSlideData) {
        alert('Please generate a preview first');
        return;
    }
    
    const modificationPrompt = document.getElementById('modificationPrompt');
    const prompt = modificationPrompt.value.trim();
    
    if (!prompt) {
        alert('Please enter modification instructions');
        return;
    }
    
    console.log('🔄 Modifying slides with AI...');
    console.log('   Prompt:', prompt);
    
    const apiKey = (typeof getApiKey === 'function') ? getApiKey() : '';
    
    if (!apiKey) {
        console.log('ℹ️ No API key configured, using default backend provider');
    }
    
    const modifyBtn = document.getElementById('modifyBtn');
    const originalText = modifyBtn.textContent;
    modifyBtn.textContent = '🔄 Modifying with AI...';
    modifyBtn.disabled = true;
    
    try {
        const response = await fetch('/api/modify-slides', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slideData: window.currentSlideData,
                modificationPrompt: prompt,
                apiKey: apiKey,
                provider: window.currentProvider || 'anthropic'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Modification failed');
        }
        
        const result = await response.json();
        console.log('✅ Slides modified successfully');
        console.log('   Modified slide count:', result.slideData?.slides?.length || result.slides?.length);
        
        // Update slide data - handle both response formats
        const modifiedSlideData = result.slideData || result;
        window.currentSlideData = modifiedSlideData;
        
        console.log('   Stored slide data:', window.currentSlideData);
        
        // Re-render preview using the correct function
        const preview = document.getElementById('preview');
        if (preview && modifiedSlideData.slides) {
            console.log('   Re-rendering preview...');
            preview.innerHTML = '<div style="text-align: center; padding: 2rem; color: #667eea;"><span class="spinner"></span><p>Updating preview...</p></div>';
            
            // Call the preview rendering function
            if (typeof window.renderSlidesProgressively === 'function') {
                window.renderSlidesProgressively(modifiedSlideData);
            } else if (typeof renderSlidesProgressively === 'function') {
                renderSlidesProgressively(modifiedSlideData);
            } else if (typeof window.displayPreview === 'function') {
                window.displayPreview(modifiedSlideData);
            } else {
                // Fallback: manually render
                console.log('   Using fallback rendering');
                preview.innerHTML = '';
                modifiedSlideData.slides.forEach((slide, idx) => {
                    const slideCard = document.createElement('div');
                    slideCard.className = 'slide-preview-card';
                    slideCard.innerHTML = `
                        <div style="background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 1rem;">
                            <h3 style="color: ${modifiedSlideData.designTheme?.primaryColor || '#667eea'}; margin: 0 0 0.5rem 0;">
                                ${idx + 1}. ${slide.title || 'Untitled Slide'}
                            </h3>
                            ${slide.content ? `<p style="color: #666; margin: 0 0 0.5rem 0;">${slide.content}</p>` : ''}
                            ${slide.points && slide.points.length > 0 ? `
                                <ul style="margin: 0; padding-left: 1.5rem;">
                                    ${slide.points.map(point => `<li style="color: #444; margin: 0.25rem 0;">${point}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `;
                    preview.appendChild(slideCard);
                });
            }
            
            console.log('   ✓ Preview rendered');
        }
        
        // Show success message
        if (typeof showNotification === 'function') {
            showNotification('✅ Slides modified successfully! Preview updated.', 'success');
        }
        
        // Clear the modification prompt
        modificationPrompt.value = '';
        
        console.log('✅ Modification complete');
        
    } catch (error) {
        console.error('❌ Modification failed:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Modification failed: ' + error.message, 'error');
        } else {
            alert('Modification failed: ' + error.message);
        }
    } finally {
        modifyBtn.textContent = originalText;
        modifyBtn.disabled = false;
    }
}

/**
 * Show share and download section in two-column layout
 * Using Zscaler-safe DOM manipulation pattern
 */
function showDownloadLink(downloadUrl, fileSize, storage = {}) {
    // Find the modify section - we'll transform it into results layout
    const modifySection = document.getElementById('modificationSection');
    if (!modifySection) {
        console.error('❌ Modify section not found!');
        return;
    }
    
    // Make sure it's visible
    modifySection.style.display = 'block';
    
    // Find the grid container
    const modifyGrid = modifySection.querySelector('.modification-grid');
    if (!modifyGrid) {
        console.error('❌ Modification grid not found!');
        return;
    }
    
    // Clear existing content (Zscaler-safe method)
    while (modifyGrid.firstChild) {
        modifyGrid.removeChild(modifyGrid.firstChild);
    }
    
    // Create LEFT panel: Generate New Slide (placeholder for now)
    const leftPanel = document.createElement('div');
    leftPanel.className = 'card';
    leftPanel.style.cssText = `
        background: linear-gradient(135deg, #f0f4ff, #e8f0ff);
        border: 2px solid #667eea;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        gap: 1rem;
    `;
    leftPanel.innerHTML = `
        <div style="font-size: 2.5rem;">🚀</div>
        <h4 style="margin: 0; color: #667eea; font-size: 1.2rem;">
            Generate New Slide
        </h4>
        <button 
            class="btn btn-primary" 
            onclick="alert('Generate new slide feature coming soon!')"
            style="background: #667eea; padding: 0.75rem 1.5rem; width: 100%; border: none; border-radius: 6px; color: white; font-weight: 600; cursor: pointer;"
        >
            ➕ Add New Slide
        </button>
        <p style="margin: 0; font-size: 0.85rem; color: #666;">
            Generate additional slides to expand your presentation
        </p>
    `;
    
    // Create RIGHT panel: Loading message (will be replaced by share link)
    const rightPanel = document.createElement('div');
    rightPanel.id = 'shareLoadingMessage';
    rightPanel.className = 'card';
    rightPanel.style.cssText = `
        background: white;
        border: 2px solid #667eea;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
    `;
    rightPanel.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">🎉</div>
        <h3 style="margin: 0 0 0.5rem 0; color: #333; font-size: 1.2rem;">Presentation Generated Successfully!</h3>
        <p style="margin: 0; color: #666;">⏳ Creating shareable link...</p>
    `;
    
    // Append both panels to the grid (Zscaler-safe)
    modifyGrid.appendChild(leftPanel);
    modifyGrid.appendChild(rightPanel);
    
    // Auto-create share link (which will replace the right panel loading message)
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
window.modifySlidesWithAI = modifySlidesWithAI;
window.showDownloadLink = showDownloadLink;
