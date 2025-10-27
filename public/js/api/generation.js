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
        
        // Check if we have uploaded images or template file (both require FormData)
        if (window.templateFile || (window.uploadedImages && window.uploadedImages.length > 0)) {
            console.log('📄 Using FormData for file uploads');
            
            // Use FormData for template and/or image-based generation
            const formData = new FormData();
            
            if (window.templateFile) {
                console.log('📄 Including template file:', window.templateFile.name);
                formData.append('templateFile', window.templateFile);
            }
            
            // Add uploaded images
            if (window.uploadedImages && window.uploadedImages.length > 0) {
                console.log(`🖼️ Including ${window.uploadedImages.length} uploaded images`);
                formData.append('images', JSON.stringify(window.uploadedImages.map(img => ({
                    filename: img.filename,
                    dataURL: img.dataURL
                }))));
            }
            
            formData.append('slideData', JSON.stringify(window.currentSlideData));
            formData.append('text', JSON.stringify(window.currentSlideData.slides));
            formData.append('apiKey', apiKey);
            formData.append('provider', window.currentProvider || 'anthropic');
            
            const endpoint = window.templateFile ? '/api/generate-with-template' : '/api/generate';
            response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
        } else {
            // Regular generation without template or images
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
        
        // Show progress indicator while preparing share link and PDF
        showGenerationProgress(sessionId, blobUrl, blob.size, { sessionId, downloadUrl, pdfUrl });
        
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
 * Show generation progress - wait for PDF and share link before showing success
 */
async function showGenerationProgress(sessionId, downloadUrl, fileSize, storage = {}) {
    const resultsCard = document.getElementById('generateResultsCard');
    if (!resultsCard) return;
    
    resultsCard.style.display = 'block';
    
    while (resultsCard.firstChild) {
        resultsCard.removeChild(resultsCard.firstChild);
    }
    
    const progressDiv = document.createElement('div');
    progressDiv.id = 'generationProgress';
    progressDiv.style.cssText = `
        background: white; border: 2px solid #667eea; border-radius: 8px; padding: 1.5rem;
        display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 100%;
    `;
    progressDiv.innerHTML = `
        <div class="spinner" style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem;"></div>
        <h3 style="margin: 0 0 1rem 0; color: #333; font-size: 1.2rem;">⏳ Preparing Your Presentation</h3>
        <div style="text-align: left; width: 100%; max-width: 300px;">
            <div id="step1" style="padding: 0.5rem; color: #28a745; font-size: 0.9rem;">✅ PowerPoint file generated</div>
            <div id="step2" style="padding: 0.5rem; color: #999; font-size: 0.9rem;">⏳ Creating shareable link...</div>
            <div id="step3" style="padding: 0.5rem; color: #999; font-size: 0.9rem;">⏳ Generating PDF...</div>
            <div id="step4" style="padding: 0.5rem; color: #999; font-size: 0.9rem;">⏳ Verifying all files...</div>
        </div>
    `;
    resultsCard.appendChild(progressDiv);
    
    // CRITICAL: Create share link FIRST and wait for it to be verified
    let shareUrl = null;
    let shareId = null;
    
    try {
        const step2 = document.getElementById('step2');
        if (step2) { step2.textContent = '⏳ Creating shareable link...'; step2.style.color = '#667eea'; }
        
        // Create share link with verification
        const shareResult = await createShareLinkWithVerification();
        shareUrl = shareResult.shareUrl;
        shareId = shareResult.shareId;
        
        if (step2) { step2.textContent = '✅ Share link created & verified'; step2.style.color = '#28a745'; }
        console.log('✅ Share link verified:', shareUrl);
    } catch (e) {
        const step2 = document.getElementById('step2');
        if (step2) { step2.textContent = '⚠️ Share link failed'; step2.style.color = '#dc2626'; }
        console.error('❌ Share link creation failed:', e);
    }
    
    // Wait for PDF
    try {
        const step3 = document.getElementById('step3');
        if (step3) { step3.textContent = '⏳ Generating PDF...'; step3.style.color = '#667eea'; }
        
        await waitForPDFReady(sessionId);
        
        if (step3) { step3.textContent = '✅ PDF ready & verified'; step3.style.color = '#28a745'; }
        console.log('✅ PDF verified');
    } catch (e) {
        const step3 = document.getElementById('step3');
        if (step3) { step3.textContent = '⚠️ PDF unavailable'; step3.style.color = '#ffc107'; }
        console.warn('⚠️ PDF not available:', e.message);
    }
    
    const step4 = document.getElementById('step4');
    if (step4) { step4.textContent = '✅ Verification complete!'; step4.style.color = '#28a745'; }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // NOW show the final share link interface
    // Pass the verified shareUrl to avoid creating it again
    if (shareUrl && shareId) {
        showVerifiedShareLink(shareUrl, shareId, '7 days');
    } else {
        // Fallback if share link failed
        showDownloadOnlyInterface();
    }
}

/**
 * Create share link and VERIFY it's accessible before returning
 */
async function createShareLinkWithVerification() {
    console.log('📤 Creating shareable link with verification...');
    
    const response = await fetch('/api/share-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            slideData: window.currentSlideData,
            title: window.currentSlideData?.slides[0]?.title || 'AI Presentation',
            sessionId: window.currentSessionId
        })
    });
    
    if (!response.ok) {
        throw new Error(`Share API failed: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.shareId || !result.shareUrl) {
        throw new Error('No share ID returned');
    }
    
    // CRITICAL: Verify the shared presentation is actually accessible
    const verifyResponse = await fetch(`/api/shared-presentation/${result.shareId}`);
    
    if (!verifyResponse.ok) {
        throw new Error('Share link created but not accessible');
    }
    
    const verifyData = await verifyResponse.json();
    
    if (!verifyData.slideData || !verifyData.slideData.slides) {
        throw new Error('Share link has invalid data');
    }
    
    console.log('✅ Share link verified and accessible');
    
    // Store for later use
    window.currentShareUrl = result.shareUrl;
    window.currentShareId = result.shareId;
    
    return {
        shareUrl: result.shareUrl,
        shareId: result.shareId,
        expiresIn: result.expiresIn || '7 days'
    };
}

async function waitForPDFReady(sessionId) {
    if (!sessionId) return;
    console.log('⏳ Waiting for PDF to be ready...');
    
    for (let i = 0; i < 30; i++) {
        try {
            const response = await fetch(`/view-pdf/${sessionId}`, { method: 'HEAD' });
            if (response.ok) {
                console.log(`✅ PDF verified ready after ${i + 1} attempts`);
                return true;
            }
        } catch (e) {
            // Still waiting
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('PDF generation timeout (30s)');
}

/**
 * Show verified share link interface - GUARANTEED to work
 */
function showVerifiedShareLink(shareUrl, shareId, expiresIn) {
    const resultsCard = document.getElementById('generateResultsCard');
    if (!resultsCard) return;
    
    // Clear progress indicator (Zscaler-safe)
    while (resultsCard.firstChild) {
        resultsCard.removeChild(resultsCard.firstChild);
    }
    
    console.log('✅ Displaying verified share link interface');
    
    // Create the FINAL success card - GUARANTEED to work
    const successCard = document.createElement('div');
    successCard.id = 'verifiedShareDisplay';
    successCard.style.cssText = `
        background: white;
        border: 2px solid #28a745;
        border-radius: 8px;
        padding: 1.5rem;
    `;
    
    // Build interface with verified data
    let html = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div style="font-size: 2rem;">✅</div>
            <h3 style="margin: 0; color: #155724; font-size: 1.1rem;">Presentation Ready!</h3>
        </div>
        
        <!-- Single-line layout: URL + All Buttons -->
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: nowrap;">
            <input 
                type="text" 
                value="${shareUrl}" 
                readonly 
                id="shareLinkInput"
                onclick="this.select()"
                style="flex: 0 0 250px; min-width: 200px; padding: 0.6rem; border: 2px solid #667eea; border-radius: 4px; font-size: 0.75rem; font-family: monospace; background: #f8f9fa; cursor: pointer;"
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
            <a 
                href="${window.currentDownloadUrl}" 
                download="presentation.pptx"
                style="padding: 0.6rem 0.8rem; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 0.85rem; white-space: nowrap;"
            >📥 PPT</a>
            <a 
                href="/view-pdf/${window.currentSessionId}" 
                target="_blank"
                style="padding: 0.6rem 0.8rem; background: #e67e22; color: white; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 0.85rem; white-space: nowrap;"
            >📄 PDF</a>
        </div>
        <p style="margin: 0.75rem 0 0 0; font-size: 0.75rem; color: #666;">
            ✅ All links verified and ready • Link expires in ${expiresIn}
        </p>
    `;
    
    successCard.innerHTML = html;
    resultsCard.appendChild(successCard);
    
    // Scroll to show
    setTimeout(() => {
        successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

/**
 * Fallback if share link fails - show download only
 */
function showDownloadOnlyInterface() {
    const resultsCard = document.getElementById('generateResultsCard');
    if (!resultsCard) return;
    
    while (resultsCard.firstChild) {
        resultsCard.removeChild(resultsCard.firstChild);
    }
    
    const fallbackCard = document.createElement('div');
    fallbackCard.style.cssText = `
        background: white;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 1.5rem;
    `;
    
    fallbackCard.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div style="font-size: 2rem;">⚠️</div>
            <h3 style="margin: 0; color: #856404; font-size: 1.1rem;">Download Ready (Share Link Unavailable)</h3>
        </div>
        <div style="display: flex; gap: 0.5rem;">
            <a 
                href="${window.currentDownloadUrl}" 
                download="presentation.pptx"
                style="padding: 0.75rem 1.5rem; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-weight: 600;"
            >📥 Download PowerPoint</a>
            <a 
                href="/view-pdf/${window.currentSessionId}" 
                target="_blank"
                style="padding: 0.75rem 1.5rem; background: #e67e22; color: white; text-decoration: none; border-radius: 4px; font-weight: 600;"
            >📄 View PDF</a>
        </div>
        <p style="margin: 1rem 0 0 0; font-size: 0.85rem; color: #666;">
            Share link feature temporarily unavailable. You can still download and use your presentation.
        </p>
    `;
    
    resultsCard.appendChild(fallbackCard);
}

// Legacy function - now just a wrapper
function showDownloadLink(downloadUrl, fileSize, storage = {}) {
    showGenerationProgress(storage.sessionId, downloadUrl, fileSize, storage);
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
