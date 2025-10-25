// Slide Preview Generation and Caching
// Fresh file created to avoid caching issues

/**
 * Show preview progress indicator
 */
function showPreviewProgress(message) {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) return;
    
    let progressDiv = document.getElementById('previewProgress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'previewProgress';
        progressDiv.style.cssText = `
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 1.5rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        previewContainer.appendChild(progressDiv);
    }
    
    progressDiv.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <div class="spinner" style="width: 20px; height: 20px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <span style="font-weight: 600; font-size: 1.1rem;">${message}</span>
        </div>
        <div style="font-size: 0.9rem; opacity: 0.9;">Please wait while we process your content...</div>
    `;
    
    if (!document.querySelector('#spinnerStyle')) {
        const style = document.createElement('style');
        style.id = 'spinnerStyle';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Hide preview progress indicator
 */
function hidePreviewProgress() {
    const progressDiv = document.getElementById('previewProgress');
    if (progressDiv) {
        progressDiv.remove();
    }
}

/**
 * Generate preview of slides from text content
 */
async function generatePreview() {
    console.log('🎬 generatePreview called');
    
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    if (!text) {
        console.warn('⚠️ No text input provided');
        alert('Please enter some content first');
        return;
    }
    
    console.log(`📝 Processing ${text.length} characters of content`);
    
    const apiKey = (typeof getApiKey === 'function') ? getApiKey() : null;
    if (!apiKey) {
        console.warn('⚠️ No API key configured');
        alert('Please enter your API key first in Advanced Configuration section');
        return;
    }
    
    console.log('✅ API key found, proceeding with preview generation');
    
    const cachedData = checkPreviewCache(text);
    if (cachedData) {
        console.log('📋 Using cached preview data');
        displayPreview(cachedData);
        return;
    }
    
    const previewBtn = document.getElementById('previewBtn');
    const originalText = previewBtn.textContent;
    previewBtn.textContent = '🔄 Generating Preview...';
    previewBtn.disabled = true;
    
    showPreviewProgress('🤖 AI is analyzing your content...');
    
    try {
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                apiKey: apiKey,
                incremental: true  // Enable real-time streaming
            })
        });
        
        if (!response.ok) {
            throw new Error(`Preview failed: ${response.status} ${response.statusText}`);
        }
        
        // Check if it's SSE streaming response
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/event-stream')) {
            console.log('📡 Receiving real-time SSE stream...');
            
            // Use ReadableStream to process chunks as they arrive (REAL-TIME!)
            const slideData = await handleIncrementalStream(response);
            
            // Save and finalize
            if (slideData && slideData.slides) {
                console.log(`✅ Stream complete: ${slideData.slides.length} slides received`);
                savePreviewCache(text, slideData);
                window.currentSlideData = slideData;
                
                // Hide initial progress indicator
                hidePreviewProgress();
                
                // Show view toggle
                const viewToggle = document.getElementById('viewToggle');
                if (viewToggle) viewToggle.style.display = 'flex';
                
                // Show action buttons
                const modificationSection = document.getElementById('modificationSection');
                const generatePptSection = document.getElementById('generatePptSection');
                if (modificationSection) modificationSection.style.display = 'block';
                if (generatePptSection) generatePptSection.style.display = 'block';
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ Preview generated successfully!', 'success');
                }
            }
        } else {
            // Fallback: non-streaming response
            console.log('📋 Receiving non-streaming response...');
            const responseText = await response.text();
            const slideData = JSON.parse(responseText);
            
            if (slideData && slideData.slides) {
                savePreviewCache(text, slideData);
                window.currentSlideData = slideData;
                displayPreview(slideData);
                hidePreviewProgress();
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ Preview generated successfully!', 'success');
                }
            }
        }
        
    } catch (error) {
        console.error('Preview generation failed:', error);
        hidePreviewProgress();
        if (typeof showNotification === 'function') {
            showNotification('❌ Preview generation failed: ' + error.message, 'error');
        }
    } finally {
        previewBtn.textContent = originalText;
        previewBtn.disabled = false;
    }
}

/**
 * Handle incremental stream - render slides as they arrive (REAL-TIME!)
 */
async function handleIncrementalStream(response) {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) {
        throw new Error('Preview container not found');
    }
    
    // Clear container
    previewContainer.innerHTML = '';
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const slides = [];
    let theme = null;
    let totalSlides = 0;
    let progressDiv = null;
    let buffer = '';
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('📡 Stream closed');
                break;
            }
            
            // Decode chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.substring(5).trim();
                    
                    if (jsonStr === '[DONE]') {
                        console.log('✅ Received [DONE] marker');
                        continue;
                    }
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        
                        // THEME EVENT - Show theme header immediately
                        if (data.type === 'theme') {
                            theme = data.theme;
                            totalSlides = data.totalSlides;
                            console.log(`🎨 Theme received: ${theme.name} (${totalSlides} slides)`);
                            
                            // Remove initial loading, show theme
                            hidePreviewProgress();
                            
                            const themeDiv = document.createElement('div');
                            themeDiv.className = 'theme-info';
                            themeDiv.style.cssText = `
                                background: linear-gradient(135deg, ${theme.colorPrimary}, ${theme.colorSecondary});
                                color: white;
                                padding: 1rem;
                                border-radius: 8px;
                                margin-bottom: 1rem;
                                text-align: center;
                            `;
                            themeDiv.innerHTML = `
                                <h3 style="margin: 0 0 0.5rem 0; color: white;">${theme.name}</h3>
                                <p style="margin: 0; opacity: 0.9;">${theme.description}</p>
                            `;
                            previewContainer.appendChild(themeDiv);
                            
                            // Add progress counter
                            progressDiv = document.createElement('div');
                            progressDiv.id = 'slideProgress';
                            progressDiv.style.cssText = `
                                background: rgba(102, 126, 234, 0.1);
                                padding: 1rem;
                                border-radius: 8px;
                                margin-bottom: 1rem;
                                text-align: center;
                                font-weight: bold;
                                color: #667eea;
                                font-size: 1.1rem;
                            `;
                            progressDiv.innerHTML = `⏳ Generating slides... 0/${totalSlides}`;
                            previewContainer.appendChild(progressDiv);
                        }
                        
                        // SLIDE EVENT - Render slide immediately as it arrives!
                        else if (data.type === 'slide') {
                            slides.push(data.slide);
                            console.log(`📄 Slide ${data.current}/${data.total}: ${data.slide.title}`);
                            
                            // Update progress counter in real-time
                            if (progressDiv) {
                                progressDiv.innerHTML = `⏳ Generating slides... ${data.current}/${data.total}`;
                            }
                            
                            // Render THIS slide right now (not waiting for others!)
                            const slideDiv = createSlidePreviewCard(data.slide, data.index, theme);
                            slideDiv.style.opacity = '0';
                            slideDiv.style.transform = 'translateY(20px)';
                            previewContainer.appendChild(slideDiv);
                            
                            // Animate in
                            requestAnimationFrame(() => {
                                slideDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                slideDiv.style.opacity = '1';
                                slideDiv.style.transform = 'translateY(0)';
                            });
                        }
                        
                        // COMPLETE EVENT - Finalize
                        else if (data.type === 'complete') {
                            console.log('✅ Stream complete event received');
                            
                            // Show completion message
                            if (progressDiv) {
                                progressDiv.innerHTML = `✅ All ${totalSlides} slides generated successfully!`;
                                progressDiv.style.background = 'rgba(40, 167, 69, 0.1)';
                                progressDiv.style.color = '#28a745';
                                
                                // Fade out after 1.5 seconds
                                setTimeout(() => {
                                    progressDiv.style.transition = 'opacity 0.3s ease';
                                    progressDiv.style.opacity = '0';
                                    setTimeout(() => {
                                        if (progressDiv && progressDiv.parentNode) {
                                            progressDiv.remove();
                                        }
                                    }, 300);
                                }, 1500);
                            }
                        }
                        
                    } catch (parseError) {
                        console.warn('⚠️ Failed to parse SSE event:', jsonStr.substring(0, 100));
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
    
    // Return complete slideData object
    return {
        slides: slides,
        designTheme: theme || {
            name: 'Default Theme',
            description: 'Professional presentation theme',
            colorPrimary: '#667eea',
            colorSecondary: '#764ba2',
            colorAccent: '#F39C12',
            colorBackground: '#FFFFFF',
            colorText: '#1d1d1d'
        },
        totalSlides: totalSlides || slides.length
    };
}

/**
 * Parse Server-Sent Events (SSE) response format with live rendering
 * (Fallback for non-streaming responses)
 */
function parseSSEResponse(sseText) {
    console.log('📡 Parsing SSE response with live rendering...');
    
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) return null;
    
    // Clear container and show theme header
    previewContainer.innerHTML = '';
    
    const lines = sseText.trim().split('\n');
    const slides = [];
    let theme = null;
    let totalSlides = 0;
    let progressDiv = null;
    
    for (const line of lines) {
        if (line.startsWith('data:')) {
            try {
                const jsonStr = line.substring(5).trim(); // Remove "data:" prefix
                const data = JSON.parse(jsonStr);
                
                if (data.type === 'theme') {
                    theme = data.theme;
                    totalSlides = data.totalSlides;
                    console.log(`🎨 Theme received: ${theme.name}`);
                    
                    // Show theme header immediately
                    const themeDiv = document.createElement('div');
                    themeDiv.className = 'theme-info';
                    themeDiv.style.cssText = `
                        background: linear-gradient(135deg, ${theme.colorPrimary}, ${theme.colorSecondary});
                        color: white;
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1rem;
                        text-align: center;
                    `;
                    themeDiv.innerHTML = `
                        <h3 style="margin: 0 0 0.5rem 0; color: white;">${theme.name}</h3>
                        <p style="margin: 0; opacity: 0.9;">${theme.description}</p>
                    `;
                    previewContainer.appendChild(themeDiv);
                    
                    // Add progress counter
                    progressDiv = document.createElement('div');
                    progressDiv.id = 'slideProgress';
                    progressDiv.style.cssText = `
                        background: rgba(102, 126, 234, 0.1);
                        padding: 1rem;
                        border-radius: 8px;
                        margin-bottom: 1rem;
                        text-align: center;
                        font-weight: bold;
                        color: #667eea;
                        font-size: 1.1rem;
                    `;
                    progressDiv.innerHTML = `⏳ Generating slides... 0/${totalSlides}`;
                    previewContainer.appendChild(progressDiv);
                    
                } else if (data.type === 'slide') {
                    slides.push(data.slide);
                    console.log(`📄 Slide ${data.current}/${data.total}: ${data.slide.title}`);
                    
                    // Update progress counter
                    if (progressDiv) {
                        progressDiv.innerHTML = `⏳ Generating slides... ${data.current}/${data.total}`;
                    }
                    
                    // Render slide immediately as it arrives
                    const slideDiv = createSlidePreviewCard(data.slide, data.current - 1, theme);
                    slideDiv.style.opacity = '0';
                    slideDiv.style.transform = 'translateY(20px)';
                    previewContainer.appendChild(slideDiv);
                    
                    // Animate in
                    setTimeout(() => {
                        slideDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                        slideDiv.style.opacity = '1';
                        slideDiv.style.transform = 'translateY(0)';
                    }, 50);
                }
            } catch (e) {
                if (!line.includes('[DONE]')) {
                    console.warn('⚠️ Failed to parse SSE line:', line.substring(0, 100));
                }
            }
        }
    }
    
    // Remove progress counter when complete
    if (progressDiv) {
        progressDiv.innerHTML = `✅ All ${totalSlides} slides generated successfully!`;
        setTimeout(() => {
            progressDiv.style.transition = 'opacity 0.3s ease';
            progressDiv.style.opacity = '0';
            setTimeout(() => progressDiv.remove(), 300);
        }, 1500);
    }
    
    console.log(`✅ SSE parsing complete: ${slides.length} slides, theme: ${theme?.name || 'default'}`);
    
    // Construct the slideData object expected by displayPreview
    return {
        slides: slides,
        designTheme: theme || {
            name: 'Default Theme',
            description: 'Professional presentation theme',
            colorPrimary: '#667eea',
            colorSecondary: '#764ba2',
            colorAccent: '#F39C12',
            colorBackground: '#FFFFFF',
            colorText: '#1d1d1d'
        },
        totalSlides: totalSlides || slides.length
    };
}

/**
 * Create a slide preview card
 */
function createSlidePreviewCard(slide, index, theme) {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'slide-preview';
    slideDiv.style.cssText = `
        background: white;
        border: 2px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        position: relative;
    `;
    
    const slideNumber = document.createElement('div');
    slideNumber.style.cssText = `
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        background: ${theme?.colorAccent || '#F39C12'};
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        font-weight: bold;
    `;
    slideNumber.textContent = `${index + 1}`;
    slideDiv.appendChild(slideNumber);
    
    if (slide.type === 'title') {
        slideDiv.innerHTML += `
            <h2 style="color: ${theme?.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h2>
            <p style="color: ${theme?.colorSecondary || '#2E4053'}; font-size: 1.1rem;">${slide.subtitle || ''}</p>
        `;
    } else if (slide.type === 'content') {
        slideDiv.innerHTML += `
            <h3 style="color: ${theme?.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h3>
            ${slide.header ? `<p style="color: #666; font-style: italic; margin: 0.5rem 0;">${slide.header}</p>` : ''}
            <ul style="color: ${theme?.colorText || '#1d1d1d'};">
                ${slide.content ? slide.content.map(item => `<li>${item}</li>`).join('') : ''}
            </ul>
        `;
    }
    
    return slideDiv;
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/**
 * Check if preview data is cached for this text
 */
function checkPreviewCache(text) {
    try {
        const cacheKey = 'preview_cache_' + simpleHash(text);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const data = JSON.parse(cached);
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                return data.slideData;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (error) {
        console.warn('Cache check failed:', error);
    }
    return null;
}

/**
 * Save preview data to cache
 */
function savePreviewCache(text, slideData) {
    try {
        const cacheKey = 'preview_cache_' + simpleHash(text);
        const cacheData = {
            slideData: slideData,
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        clearOldCaches();
    } catch (error) {
        console.warn('Cache save failed:', error);
    }
}

/**
 * Clear old cache entries
 */
function clearOldCaches() {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        
        keys.forEach(key => {
            if (key.startsWith('preview_cache_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (now - data.timestamp > maxAge) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.warn('Cache cleanup failed:', error);
    }
}

/**
 * Display preview of slides
 */
function displayPreview(slideData) {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) {
        console.error('Preview container not found');
        return;
    }
    
    previewContainer.innerHTML = '';
    
    if (slideData.designTheme) {
        const themeDiv = document.createElement('div');
        themeDiv.className = 'theme-info';
        themeDiv.style.cssText = `
            background: linear-gradient(135deg, ${slideData.designTheme.colorPrimary}, ${slideData.designTheme.colorSecondary});
            color: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
        `;
        themeDiv.innerHTML = `
            <h3 style="margin: 0 0 0.5rem 0; color: white;">${slideData.designTheme.name}</h3>
            <p style="margin: 0; opacity: 0.9;">${slideData.designTheme.description}</p>
        `;
        previewContainer.appendChild(themeDiv);
    }
    
    if (slideData.slides && slideData.slides.length > 0) {
        slideData.slides.forEach((slide, index) => {
            const slideDiv = document.createElement('div');
            slideDiv.className = 'slide-preview';
            slideDiv.style.cssText = `
                background: white;
                border: 2px solid #ddd;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                position: relative;
            `;
            
            const slideNumber = document.createElement('div');
            slideNumber.style.cssText = `
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: ${slideData.designTheme?.colorAccent || '#F39C12'};
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: bold;
            `;
            slideNumber.textContent = `${index + 1}`;
            slideDiv.appendChild(slideNumber);
            
            if (slide.type === 'title') {
                slideDiv.innerHTML += `
                    <h2 style="color: ${slideData.designTheme?.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h2>
                    <p style="color: ${slideData.designTheme?.colorSecondary || '#2E4053'}; font-size: 1.1rem;">${slide.subtitle || ''}</p>
                `;
            } else if (slide.type === 'content') {
                slideDiv.innerHTML += `
                    <h3 style="color: ${slideData.designTheme?.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h3>
                    <ul style="color: ${slideData.designTheme?.colorText || '#1d1d1d'};">
                        ${slide.content ? slide.content.map(item => `<li>${item}</li>`).join('') : ''}
                    </ul>
                `;
            }
            
            previewContainer.appendChild(slideDiv);
        });
    }
    
    const modificationSection = document.getElementById('modificationSection');
    const generatePptSection = document.getElementById('generatePptSection');
    if (modificationSection) modificationSection.style.display = 'block';
    if (generatePptSection) generatePptSection.style.display = 'block';
}

// Export functions
window.generatePreview = generatePreview;
window.displayPreview = displayPreview;
window.showPreviewProgress = showPreviewProgress;
window.hidePreviewProgress = hidePreviewProgress;
window.handleIncrementalStream = handleIncrementalStream;

// Verify loading
console.log('✅ slidePreview.js loaded - Real-time incremental rendering enabled');
console.log('   window.generatePreview:', typeof window.generatePreview);
console.log('   window.handleIncrementalStream:', typeof window.handleIncrementalStream);

