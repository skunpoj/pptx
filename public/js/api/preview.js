// Preview generation and caching functionality

/**
 * Generate preview of slides from text content
 */
async function generatePreview() {
    const textInput = document.getElementById('textInput');
    const text = textInput.value.trim();
    
    if (!text) {
        alert('Please enter some content first');
        return;
    }
    
    const apiKey = getApiKey();
    if (!apiKey) {
        alert('Please enter your API key first');
        return;
    }
    
    // Check cache first
    const cachedData = checkPreviewCache(text);
    if (cachedData) {
        console.log('📋 Using cached preview data');
        await renderSlidesProgressively(cachedData);
        return;
    }
    
    // Show loading state
    const previewBtn = document.getElementById('previewBtn');
    const originalText = previewBtn.textContent;
    previewBtn.textContent = '🔄 Generating Preview...';
    previewBtn.disabled = true;
    
    try {
        // Check if server supports streaming
        const capabilities = await checkServerCapabilities();
        const useStreaming = capabilities.features?.streamingPreview || false;
        
        let slideData;
        if (useStreaming) {
            console.log('📡 Using streaming preview');
            slideData = await handleStreamingPreview(text, apiKey);
        } else {
            console.log('📋 Using standard preview');
            slideData = await handleNonStreamingPreview(text, apiKey);
        }
        
        if (slideData && slideData.slides) {
            // Cache the result
            savePreviewCache(text, slideData);
            
            // Render the slides
            await renderSlidesProgressively(slideData);
            
            // Show success message
            showNotification('✅ Preview generated successfully!', 'success');
        } else {
            throw new Error('Invalid preview data received');
        }
        
    } catch (error) {
        console.error('Preview generation failed:', error);
        showNotification('❌ Preview generation failed: ' + error.message, 'error');
    } finally {
        // Restore button state
        previewBtn.textContent = originalText;
        previewBtn.disabled = false;
    }
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
    const container = document.getElementById('previewContainer');
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

// Export functions for use in other modules
window.generatePreview = generatePreview;
window.renderSlidesProgressively = renderSlidesProgressively;
