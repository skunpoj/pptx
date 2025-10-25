// Preview generation and caching functionality

/**
 * Show preview progress indicator
 */
function showPreviewProgress(message) {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) return;
    
    // Create or update progress indicator
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
    
    // Add spinner animation
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
    
    const apiKey = getApiKey();
    if (!apiKey) {
        console.warn('⚠️ No API key configured');
        alert('Please enter your API key first in Advanced Configuration section');
        return;
    }
    
    console.log('✅ API key found, proceeding with preview generation');
    
    // Check cache first
    const cachedData = checkPreviewCache(text);
    if (cachedData) {
        console.log('📋 Using cached preview data');
        displayPreview(cachedData);
        return;
    }
    
    // Show loading state
    const previewBtn = document.getElementById('previewBtn');
    const originalText = previewBtn.textContent;
    previewBtn.textContent = '🔄 Generating Preview...';
    previewBtn.disabled = true;
    
    // Show progress indicators
    showPreviewProgress('🤖 AI is analyzing your content...');
    
    try {
        // Call the preview API
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                apiKey: apiKey
            })
        });
        
        if (!response.ok) {
            throw new Error(`Preview failed: ${response.status} ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('📋 Raw server response:', responseText.substring(0, 200) + '...');
        
        let slideData;
        try {
            slideData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ JSON parse error:', parseError);
            console.error('❌ Response text:', responseText);
            throw new Error('Invalid JSON response from server');
        }
        
        if (slideData && slideData.slides) {
            // Update progress
            showPreviewProgress('📊 Processing slide data...');
            
            // Cache the result
            savePreviewCache(text, slideData);
            
            // Store for generation
            window.currentSlideData = slideData;
            
            // Update progress
            showPreviewProgress('🎨 Rendering slide previews...');
            
            // Display the preview
            displayPreview(slideData);
            
            // Hide progress
            hidePreviewProgress();
            
            // Show success message
            showNotification('✅ Preview generated successfully!', 'success');
        } else {
            console.error('❌ Invalid slide data:', slideData);
            throw new Error('Invalid preview data received');
        }
        
    } catch (error) {
        console.error('Preview generation failed:', error);
        hidePreviewProgress();
        showNotification('❌ Preview generation failed: ' + error.message, 'error');
    } finally {
        // Restore button state
        previewBtn.textContent = originalText;
        previewBtn.disabled = false;
    }
}

/**
 * Simple hash function for cache keys
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
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
            // Check if cache is still valid (24 hours)
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
        
        // Clean up old caches
        clearOldCaches();
    } catch (error) {
        console.warn('Cache save failed:', error);
}

/**
 * Clear old cache entries
 */
function clearOldCaches() {
    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
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
 * Handle streaming preview generation
 */
async function handleStreamingPreview(text, apiKey) {
    const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            apiKey: apiKey,
            stream: true
        })
    });
    
    if (!response.ok) {
        throw new Error(`Preview failed: ${response.status} ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let slideData = null;
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'slide_data') {
                            slideData = data.slideData;
                        } else if (data.type === 'progress') {
                            updateProgress(data.progress, data.message);
                        }
                    } catch (e) {
                        // Ignore malformed JSON
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
    
    if (!slideData) {
        throw new Error('No slide data received from streaming preview');
    }
    
    return slideData;
}

/**
 * Handle non-streaming preview generation
 */
async function handleNonStreamingPreview(text, apiKey) {
    const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            apiKey: apiKey
        })
    });
    
    if (!response.ok) {
        throw new Error(`Preview failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.slideData;
}

/**
 * Render slides progressively with animation
 */
async function renderSlidesProgressively(slideData) {
    const container = document.getElementById('preview');
    if (!container) {
        console.error('Preview container not found');
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = '📋 Slide Preview';
    title.style.marginBottom = '1rem';
    title.style.color = '#333';
    container.appendChild(title);
    
    // Create slides container
    const slidesContainer = document.createElement('div');
    slidesContainer.className = 'slides-preview-container';
    slidesContainer.style.display = 'grid';
    slidesContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    slidesContainer.style.gap = '1rem';
    slidesContainer.style.marginBottom = '1rem';
    container.appendChild(slidesContainer);
    
    // Render each slide with animation
    for (let i = 0; i < slideData.slides.length; i++) {
        const slide = slideData.slides[i];
        const slideElement = createSlideElement(slide, i);
        slideElement.style.opacity = '0';
        slideElement.style.transform = 'translateY(20px)';
        slidesContainer.appendChild(slideElement);
        
        // Animate in
        setTimeout(() => {
            slideElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            slideElement.style.opacity = '1';
            slideElement.style.transform = 'translateY(0)';
        }, i * 100);
        
        // Small delay between slides
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    // Store slide data for generation
    window.currentSlideData = slideData;
    
    // Show generation button
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.disabled = false;
        generateBtn.textContent = '✨ Generate Professional PowerPoint';
    }
}

/**
 * Create a slide element for preview
 */
function createSlideElement(slide, index) {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'slide-preview';
    slideDiv.style.border = '2px solid #e0e0e0';
    slideDiv.style.borderRadius = '8px';
    slideDiv.style.padding = '1rem';
    slideDiv.style.backgroundColor = '#fff';
    slideDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    
    const slideNumber = document.createElement('div');
    slideNumber.textContent = `Slide ${index + 1}`;
    slideNumber.style.fontWeight = 'bold';
    slideNumber.style.color = '#666';
    slideNumber.style.marginBottom = '0.5rem';
    slideNumber.style.fontSize = '0.9rem';
    slideDiv.appendChild(slideNumber);
    
    const title = document.createElement('h4');
    title.textContent = slide.title || 'Untitled Slide';
    title.style.margin = '0 0 0.5rem 0';
    title.style.color = '#333';
    title.style.fontSize = '1.1rem';
    slideDiv.appendChild(title);
    
    if (slide.content) {
        const content = document.createElement('div');
        content.innerHTML = slide.content;
        content.style.color = '#666';
        content.style.fontSize = '0.9rem';
        content.style.lineHeight = '1.4';
        slideDiv.appendChild(content);
    }
    
    return slideDiv;
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
    
    // Clear existing content
    previewContainer.innerHTML = '';
    
    // Add theme information
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
    
    // Add slides
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
            
            // Add slide number
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
            
            // Add slide content
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
    
    // Show action buttons
    const modificationSection = document.getElementById('modificationSection');
    const generatePptSection = document.getElementById('generatePptSection');
    if (modificationSection) modificationSection.style.display = 'block';
    if (generatePptSection) generatePptSection.style.display = 'block';
}

// Export functions for use in other modules
window.generatePreview = generatePreview;
window.displayPreview = displayPreview;
window.renderSlidesProgressively = renderSlidesProgressively;

// Ensure the function is available immediately
if (typeof window.generatePreview === 'function') {
    console.log('✅ generatePreview function loaded successfully');
} else {
    console.error('❌ Failed to load generatePreview function');
}
