// API communication module

function getApiKey() {
    const currentProvider = window.currentProvider || 'anthropic';
    return localStorage.getItem(`${currentProvider}_api_key`);
}

async function generatePreview() {
    const text = document.getElementById('textInput').value.trim();
    const apiKey = getApiKey();
    
    if (!apiKey) {
        window.showStatus('⚠️ Please enter your API key first!', 'error');
        return;
    }
    
    if (!text) {
        window.showStatus('⚠️ Please enter some text!', 'error');
        return;
    }
    
    // Start time tracking
    window.startTimeTracking();
    window.addTimeStep('init', 'Starting AI preview generation');
    
    const previewBtn = document.getElementById('previewBtn');
    previewBtn.disabled = true;
    previewBtn.innerHTML = '<span class="spinner"></span> Generating preview...';
    
    // Show initial loading state in preview with detailed explanation
    const preview = document.getElementById('preview');
    const wordCount = text.split(/\s+/).length;
    const estimatedTime = Math.max(5, Math.min(20, Math.ceil(wordCount / 100)));
    
    window.showStatus('🤖 AI is analyzing your content and designing slides...', 'info');
    preview.innerHTML = `
        <div id="streamingStatus" style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
            <div style="position: relative; width: 80px; height: 80px; margin: 0 auto;">
                <span class="spinner" style="width: 80px; height: 80px; border-width: 4px; border-color: #667eea; border-top-color: transparent;"></span>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem;">🤖</div>
            </div>
            
            <p style="margin-top: 1.5rem; color: #333; font-size: 1.2rem; font-weight: 700;">AI is Processing Your Content</p>
            <p id="aiStatus" style="margin-top: 0.5rem; color: #667eea; font-size: 1rem; font-weight: 600;">
                Analyzing ${wordCount} words...
            </p>
            
            ${window.createTimeTrackerHTML ? window.createTimeTrackerHTML() : ''}
            
            <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; padding: 1rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                <p style="margin: 0; font-size: 0.95rem; color: #555; line-height: 1.6;">
                    <strong style="color: #667eea;">⏱️ What's happening:</strong><br>
                    <span id="currentStep">1️⃣ Sending content to AI for analysis</span>
                </p>
                <div id="progressSteps" style="margin-top: 1rem; font-size: 0.85rem; color: #777; line-height: 1.8;">
                    <div id="step1" style="opacity: 0.5;">⏳ Analyzing content structure & themes</div>
                    <div id="step2" style="opacity: 0.5;">⏳ Determining optimal slide count (${estimatedTime}s)</div>
                    <div id="step3" style="opacity: 0.5;">⏳ Creating slide layout & design</div>
                    <div id="step4" style="opacity: 0.5;">⏳ Extracting data for charts & visuals</div>
                    <div id="step5" style="opacity: 0.5;">⏳ Rendering slide previews</div>
                </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 0.75rem; margin-top: 1rem;">
                <p style="margin: 0; font-size: 0.85rem; color: #856404;">
                    <strong>💡 First-time notice:</strong> AI analysis typically takes ${estimatedTime}-${estimatedTime + 5} seconds. 
                    Subsequent generations with similar content will be faster.
                </p>
            </div>
            
            <p id="slideCount" style="margin-top: 1rem; color: #999; font-size: 0.9rem;">
                Estimated completion: <span id="countdown">${estimatedTime}</span> seconds
            </p>
        </div>
    `;
    
    // Start countdown timer
    let remainingTime = estimatedTime;
    const countdownEl = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime > 0 && countdownEl) {
            countdownEl.textContent = remainingTime;
        } else {
            clearInterval(countdownInterval);
            if (countdownEl) {
                countdownEl.textContent = 'Finalizing...';
            }
        }
    }, 1000);
    
    // Simulate progress steps
    const steps = [
        { id: 'step1', time: 1000, status: '1️⃣ AI is analyzing your content structure...', stepEl: 'step1' },
        { id: 'step2', time: 3000, status: '2️⃣ AI is determining optimal slide layout...', stepEl: 'step2' },
        { id: 'step3', time: 5000, status: '3️⃣ AI is creating slide designs...', stepEl: 'step3' },
        { id: 'step4', time: 7000, status: '4️⃣ AI is extracting data for visualizations...', stepEl: 'step4' }
    ];
    
    const progressInterval = [];
    steps.forEach(step => {
        const timeout = setTimeout(() => {
            const currentStepEl = document.getElementById('currentStep');
            const stepEl = document.getElementById(step.stepEl);
            if (currentStepEl) currentStepEl.textContent = step.status;
            if (stepEl) {
                stepEl.style.opacity = '1';
                stepEl.style.color = '#667eea';
                stepEl.style.fontWeight = '600';
                stepEl.innerHTML = stepEl.innerHTML.replace('⏳', '✅');
            }
        }, step.time);
        progressInterval.push(timeout);
    });
    
    // Store cleanup function
    window.cleanupPreviewProgress = () => {
        clearInterval(countdownInterval);
        progressInterval.forEach(t => clearTimeout(t));
    };
    
    // Show view toggle
    document.getElementById('viewToggle').style.display = 'flex';
    
    try {
        const useStreaming = window.currentProvider === 'anthropic';
        
        // Check cache first (if content hasn't changed much)
        const cached = checkPreviewCache(text);
        if (cached) {
            console.log('✅ Using cached preview data');
            window.addTimeStep('cache', 'Loading from cache');
            if (window.cleanupPreviewProgress) window.cleanupPreviewProgress();
            const step5 = document.getElementById('step5');
            if (step5) {
                step5.style.opacity = '1';
                step5.style.color = '#28a745';
                step5.innerHTML = '✅ Loading from cache (instant)';
            }
            await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX
            window.displayPreview(cached);
            const timeReport = window.stopTimeTracking();
            window.showStatus(`✅ Preview loaded from cache in ${window.formatTime(timeReport.totalTime)}!`, 'success');
            return;
        }
        
        window.addTimeStep('content', 'Sending content to AI');
        
        if (useStreaming) {
            // STREAMING MODE: Handle incremental slide generation
            await handleStreamingPreview(text, apiKey);
        } else {
            // NON-STREAMING MODE: Traditional all-at-once generation
            await handleNonStreamingPreview(text, apiKey);
        }
        
    } catch (error) {
        console.error('Preview Error:', error);
        if (window.cleanupPreviewProgress) window.cleanupPreviewProgress();
        document.getElementById('preview').innerHTML = '';
        document.getElementById('viewToggle').style.display = 'none';
        document.getElementById('generatePptSection').style.display = 'none';
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            window.showStatus('❌ Connection error. Make sure the server is running on http://localhost:3000', 'error');
        } else if (error.message.includes('401') || error.message.includes('authentication')) {
            window.showStatus('❌ Invalid API key. Please check and try again.', 'error');
        } else {
            window.showStatus('❌ Error: ' + error.message, 'error');
        }
    } finally {
        if (window.cleanupPreviewProgress) window.cleanupPreviewProgress();
        previewBtn.disabled = false;
        previewBtn.innerHTML = '👁️ Generate Preview';
    }
}

/**
 * Check if we have a cached preview for similar content
 * @param {string} text - Input text
 * @returns {Object|null} - Cached slide data or null
 */
function checkPreviewCache(text) {
    if (!window.localStorage) return null;
    
    try {
        // Create a simple hash of the text
        const textHash = simpleHash(text.substring(0, 500)); // Use first 500 chars
        const cacheKey = `preview_cache_${textHash}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
            const data = JSON.parse(cached);
            // Check if cache is less than 1 hour old
            if (Date.now() - data.timestamp < 60 * 60 * 1000) {
                return data.slideData;
            } else {
                // Remove stale cache
                localStorage.removeItem(cacheKey);
            }
        }
    } catch (e) {
        console.warn('Cache check error:', e);
    }
    
    return null;
}

/**
 * Save preview to cache
 * @param {string} text - Input text
 * @param {Object} slideData - Slide data to cache
 */
function savePreviewCache(text, slideData) {
    if (!window.localStorage) return;
    
    try {
        const textHash = simpleHash(text.substring(0, 500));
        const cacheKey = `preview_cache_${textHash}`;
        const data = {
            timestamp: Date.now(),
            slideData: slideData
        };
        localStorage.setItem(cacheKey, JSON.stringify(data));
        console.log('✅ Preview cached for future use');
    } catch (e) {
        console.warn('Cache save error:', e);
        // Quota exceeded - clear old caches
        clearOldCaches();
    }
}

/**
 * Simple hash function for text
 * @param {string} str - String to hash
 * @returns {string} - Hash
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

/**
 * Clear old preview caches
 */
function clearOldCaches() {
    try {
        const keys = Object.keys(localStorage);
        const cacheKeys = keys.filter(k => k.startsWith('preview_cache_'));
        // Keep only the 5 most recent
        if (cacheKeys.length > 5) {
            cacheKeys.slice(0, -5).forEach(k => localStorage.removeItem(k));
        }
    } catch (e) {
        console.warn('Cache cleanup error:', e);
    }
}

/**
 * Handles incremental preview generation (render slides one by one)
 */
async function handleStreamingPreview(text, apiKey) {
    // Get user's slide preference
    const numSlidesInput = document.getElementById('numSlides');
    const numSlides = numSlidesInput ? parseInt(numSlidesInput.value) || 0 : 0;
    
    const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            text, 
            apiKey, 
            provider: window.currentProvider, 
            incremental: true,
            numSlides: numSlides
        })
    });
    
    if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const preview = document.getElementById('preview');
    
    let receivedSlides = [];
    let themeData = null;
    let suggestedThemeKey = null;
    let totalSlides = 0;
    let buffer = ''; // Buffer for incomplete SSE messages
    
    preview.innerHTML = ''; // Clear loading message
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Split by newlines to get complete lines
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || '';
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (!data || data === '[DONE]') continue;
                
                try {
                    const message = JSON.parse(data);
                    
                    if (message.type === 'theme') {
                        // Theme info received
                        themeData = message.theme;
                        suggestedThemeKey = message.suggestedThemeKey;
                        totalSlides = message.totalSlides;
                        
                        window.addTimeStep('data', `Processing ${totalSlides} slides`);
                        
                        const theme = window.colorThemes[suggestedThemeKey] || themeData;
                        preview.innerHTML = `
                            ${window.createTimeTrackerHTML ? window.createTimeTrackerHTML() : ''}
                            <div style="background: #f0f4ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${theme.colorPrimary};">
                                <strong style="color: ${theme.colorPrimary};">🎨 ${theme.name}</strong>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">${theme.description}</p>
                            </div>
                            <div style="background: #e3f2fd; padding: 0.5rem; border-radius: 6px; margin-bottom: 1rem; text-align: center; font-size: 0.9rem; color: #1976d2;">
                                ⏳ Generating ${totalSlides} slides... <span id="slideProgress">0/${totalSlides}</span>
                            </div>
                        `;
                        
                        console.log(`✓ Theme received: ${theme.name}, will generate ${totalSlides} slides`);
                        
                    } else if (message.type === 'slide') {
                        // New slide received - render it immediately!
                        receivedSlides.push(message.slide);
                        
                        if (message.current === 1) {
                            window.addTimeStep('design', 'Creating slide layouts');
                        } else if (message.current === Math.ceil(totalSlides / 2)) {
                            window.addTimeStep('render', 'Rendering previews');
                        }
                        
                        const theme = window.colorThemes[suggestedThemeKey] || themeData || window.colorThemes['vibrant-purple'];
                        const slideHtml = window.renderSlidePreviewCard(message.slide, message.index, theme);
                        
                        const slideDiv = document.createElement('div');
                        slideDiv.style.cssText = 'opacity: 0; transform: translateY(20px); transition: all 0.3s ease;';
                        slideDiv.innerHTML = slideHtml;
                        preview.appendChild(slideDiv);
                        
                        // Update progress
                        const progressEl = document.getElementById('slideProgress');
                        if (progressEl) {
                            progressEl.textContent = `${message.current}/${message.total}`;
                        }
                        
                        // Animate in
                        setTimeout(() => {
                            slideDiv.style.opacity = '1';
                            slideDiv.style.transform = 'translateY(0)';
                        }, 50);
                        
                        console.log(`✓ Slide ${message.current}/${message.total} rendered: ${message.slide.title}`);
                        
                    } else if (message.type === 'complete') {
                        // All slides received
                        window.currentSlideData = message.data;
                        
                        // Stop time tracking and get report
                        const timeReport = window.stopTimeTracking();
                        
                        // Cleanup progress UI
                        if (window.cleanupPreviewProgress) window.cleanupPreviewProgress();
                        
                        // Mark final step complete
                        const step5 = document.getElementById('step5');
                        if (step5) {
                            step5.style.opacity = '1';
                            step5.style.color = '#28a745';
                            step5.style.fontWeight = '600';
                            step5.innerHTML = '✅ Slide previews rendered successfully';
                        }
                        
                        // Save to cache for faster future access
                        const textInput = document.getElementById('textInput');
                        if (textInput) {
                            savePreviewCache(textInput.value, message.data);
                        }
                        
                        // Remove progress indicator
                        const progressDiv = preview.querySelector('[id*="slideProgress"]');
                        if (progressDiv && progressDiv.parentElement) {
                            progressDiv.parentElement.remove();
                        }
                        
                        // Handle theme selection
                        const suggestedTheme = message.data.suggestedThemeKey || suggestedThemeKey || 'vibrant-purple';
                        if (!window.selectedTheme && suggestedTheme && window.colorThemes[suggestedTheme]) {
                            window.selectedTheme = suggestedTheme;
                            localStorage.setItem('selected_theme', suggestedTheme);
                        }
                        
                        // Update theme selector
                        if (window.displayThemeSelector) {
                            window.displayThemeSelector(suggestedTheme);
                        }
                        
                        // Show modification section and generate button
                        document.getElementById('modificationSection').style.display = 'block';
                        document.getElementById('generatePptSection').style.display = 'block';
                        
                        const timeStr = window.formatTime(timeReport.totalTime);
                        if (window.templateFile) {
                            window.showStatus(`✅ ${receivedSlides.length} slides ready in ${timeStr}! Using ${window.templateFile.name} as template.`, 'success');
                        } else {
                            window.showStatus(`✅ ${receivedSlides.length} slides ready in ${timeStr}! You can modify slides or generate ${window.getOutputType().toUpperCase()}.`, 'success');
                        }
                        
                        console.log('✅ Incremental generation complete:', receivedSlides.length, 'slides in', timeStr);
                    }
                } catch (e) {
                    // Skip invalid JSON - log for debugging
                    console.warn('Failed to parse SSE message:', data.substring(0, 100), e.message);
                }
            }
        }
    }
}

/**
 * Handles non-streaming preview generation (all-at-once)
 */
async function handleNonStreamingPreview(text, apiKey) {
    // Get user's slide preference
    const numSlidesInput = document.getElementById('numSlides');
    const numSlides = numSlidesInput ? parseInt(numSlidesInput.value) || 0 : 0;
    
    const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            text, 
            apiKey, 
            provider: window.currentProvider, 
            incremental: false,
            numSlides: numSlides
        })
    });
    
    if (!response.ok) {
        let errorMessage = 'Preview generation failed';
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text.substring(0, 500));
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
        } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
    }
    
    let slideData;
    try {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Expected JSON but got:', text.substring(0, 500));
            throw new Error('Server returned invalid response (not JSON). Check console for details.');
        }
        slideData = await response.json();
    } catch (e) {
        if (e.message.includes('not JSON')) throw e;
        throw new Error('Failed to parse server response: ' + e.message);
    }
    
    window.currentSlideData = slideData;
    
    // Handle theme selection - prioritize user's pre-selected theme
    let suggestedTheme = slideData.suggestedThemeKey || 'vibrant-purple';
    
    if (window.selectedTheme && window.colorThemes[window.selectedTheme]) {
        // User has already selected a theme - use it
        window.currentSlideData.designTheme = {
            ...window.colorThemes[window.selectedTheme],
            name: window.colorThemes[window.selectedTheme].name,
            description: window.colorThemes[window.selectedTheme].description
        };
    } else if (suggestedTheme && window.colorThemes[suggestedTheme]) {
        // No pre-selection, use AI suggested theme
        window.currentSlideData.designTheme = {
            ...window.colorThemes[suggestedTheme],
            name: window.colorThemes[suggestedTheme].name,
            description: window.colorThemes[suggestedTheme].description
        };
        // Auto-select the suggested theme
        window.selectedTheme = suggestedTheme;
        localStorage.setItem('selected_theme', suggestedTheme);
    } else {
        // Fallback to default theme
        window.currentSlideData.designTheme = {
            ...window.colorThemes['vibrant-purple'],
            name: window.colorThemes['vibrant-purple'].name,
            description: window.colorThemes['vibrant-purple'].description
        };
    }
    
    window.currentSlideData.suggestedTheme = suggestedTheme;
    
    window.addTimeStep('data', 'Processing slide data');
    
    // Cleanup progress UI
    if (window.cleanupPreviewProgress) window.cleanupPreviewProgress();
    
    // Mark final step complete
    const step5 = document.getElementById('step5');
    if (step5) {
        step5.style.opacity = '1';
        step5.style.color = '#28a745';
        step5.style.fontWeight = '600';
        step5.innerHTML = '✅ Slide previews rendered successfully';
    }
    
    // Save to cache for faster future access
    savePreviewCache(text, slideData);
    
    // Update theme selector to show AI suggestion (if different from user's choice)
    if (window.displayThemeSelector) {
        window.displayThemeSelector(suggestedTheme);
    }
    
    window.addTimeStep('render', 'Rendering slide previews');
    
    // Render slides progressively with animation
    await renderSlidesProgressively(window.currentSlideData);
    
    // Show modification section and generate button
    document.getElementById('modificationSection').style.display = 'block';
    document.getElementById('generatePptSection').style.display = 'block';
    
    // Stop time tracking
    const timeReport = window.stopTimeTracking();
    const timeStr = window.formatTime(timeReport.totalTime);
    
    if (window.templateFile) {
        window.showStatus(`✅ Preview ready in ${timeStr}! Using ${window.templateFile.name} as template.`, 'success');
    } else {
        window.showStatus(`✅ Preview ready in ${timeStr}! You can modify slides or generate ${window.getOutputType().toUpperCase()}.`, 'success');
    }
}

/**
 * Renders slides progressively with animation
 * @param {Object} slideData - Complete slide data
 */
async function renderSlidesProgressively(slideData) {
    const preview = document.getElementById('preview');
    const theme = slideData.designTheme;
    
    console.log('🎬 Starting progressive rendering for', slideData.slides.length, 'slides');
    
    // Clear loading message
    preview.innerHTML = '';
    
    // Add theme banner
    const themeBanner = `
        <div style="background: #f0f4ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${theme.colorPrimary};">
            <strong style="color: ${theme.colorPrimary};">🎨 ${theme.name}</strong>
            <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">${theme.description}</p>
        </div>
    `;
    preview.innerHTML = themeBanner;
    
    // Check if renderSlidePreviewCard is available
    if (typeof window.renderSlidePreviewCard !== 'function') {
        console.error('❌ renderSlidePreviewCard function not found!');
        throw new Error('Slide rendering function not available');
    }
    
    // Render each slide with delay for progressive effect
    for (let i = 0; i < slideData.slides.length; i++) {
        const slide = slideData.slides[i];
        console.log(`  ✓ Rendering slide ${i + 1}/${slideData.slides.length}: ${slide.title}`);
        
        try {
            // Create placeholder
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'opacity: 0; transform: translateY(20px); transition: all 0.3s ease;';
            placeholder.innerHTML = window.renderSlidePreviewCard(slide, i, theme);
            preview.appendChild(placeholder);
            
            // Animate in with slightly longer delay for visibility
            await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay between slides
            placeholder.style.opacity = '1';
            placeholder.style.transform = 'translateY(0)';
        } catch (error) {
            console.error(`❌ Error rendering slide ${i + 1}:`, error);
            throw error;
        }
    }
    
    console.log('✅ Progressive rendering complete!');
}

async function generatePresentation() {
    const text = document.getElementById('textInput').value.trim();
    const apiKey = getApiKey();
    
    if (!apiKey) {
        window.showStatus('⚠️ Please enter your API key first!', 'error');
        return;
    }
    
    if (!text) {
        window.showStatus('⚠️ Please enter some text!', 'error');
        return;
    }
    
    if (!window.currentSlideData) {
        await generatePreview();
        if (!window.currentSlideData) return;
    }
    
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating PowerPoint...';
    
    window.showStatus('📊 Generating your professional PowerPoint...', 'info');
    
    console.log('🚀 Starting PowerPoint generation...');
    console.log('  Provider:', window.currentProvider);
    console.log('  Slides:', window.currentSlideData.slides.length);
    console.log('  Template:', window.templateFile ? window.templateFile.name : 'None');
    
    // Show detailed progress steps
    const slideCount = window.currentSlideData.slides.length;
    const progressSteps = [
        `⏳ Step 1/5: Setting up workspace...`,
        `⏳ Step 2/5: Generating ${slideCount} HTML slides...`,
        `⏳ Step 3/5: Creating slide designs...`,
        `⏳ Step 4/5: Converting to PowerPoint format (30-60s)...`,
        `⏳ Step 5/5: Preparing download...`
    ];
    
    let currentStep = 0;
    const statusInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
            window.showStatus(progressSteps[currentStep], 'info');
            currentStep++;
        }
    }, 8000); // Update every 8 seconds
    
    try {
        let response;
        
        if (window.templateFile) {
            const formData = new FormData();
            formData.append('templateFile', window.templateFile);
            formData.append('text', text);
            formData.append('apiKey', apiKey);
            formData.append('provider', window.currentProvider);
            formData.append('slideData', JSON.stringify(window.currentSlideData));
            
            console.log('  Sending to /api/generate-with-template...');
            response = await fetch('/api/generate-with-template', {
                method: 'POST',
                body: formData
            });
        } else {
            console.log('  Sending to /api/generate...');
            response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, apiKey, provider: window.currentProvider, slideData: window.currentSlideData })
            });
        }
        
        clearInterval(statusInterval);
        
        console.log('  Response status:', response.status, response.statusText);
        
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
            } catch (parseError) {
                console.error('  Error parsing error response:', parseError);
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            
            console.error('  Error message:', errorMessage);
            
            // Check for specific error types
            if (response.status === 401 || errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('authentication')) {
                throw new Error('AUTHENTICATION_ERROR: ' + errorMessage);
            } else {
                throw new Error(errorMessage);
            }
        }
        
        console.log('  Preparing PowerPoint file...');
        const blob = await response.blob();
        console.log('  File size:', (blob.size / 1024).toFixed(2), 'KB');
        
        // Get storage URLs from response headers
        const sessionId = response.headers.get('X-Session-Id');
        const downloadUrl = response.headers.get('X-Download-Url');
        const pdfUrl = response.headers.get('X-PDF-Url');
        
        // Create blob URL as fallback
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Store for cleanup later
        if (window.currentDownloadUrl) {
            window.URL.revokeObjectURL(window.currentDownloadUrl);
        }
        window.currentDownloadUrl = blobUrl;
        window.currentSessionId = sessionId;
        
        console.log('✅ PowerPoint generation complete!');
        console.log('  Session ID:', sessionId);
        console.log('  Download URL:', downloadUrl);
        console.log('  PDF URL:', pdfUrl);
        
        // Show download link with PDF viewing option
        showDownloadLink(blobUrl, blob.size, { sessionId, downloadUrl, pdfUrl });
    } catch (error) {
        clearInterval(statusInterval);
        console.error('❌ PowerPoint generation error:', error);
        
        if (error.message.startsWith('AUTHENTICATION_ERROR:')) {
            const cleanMessage = error.message.replace('AUTHENTICATION_ERROR: ', '');
            window.showStatus('❌ Authentication Error: ' + cleanMessage, 'error');
        } else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            window.showStatus('❌ Connection error. Please check your server is running.', 'error');
        } else {
            window.showStatus('❌ Generation Error: ' + error.message, 'error');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✨ Generate PowerPoint';
    }
}

/**
 * Modifies specific slides based on user prompt
 */
async function modifySlides() {
    const modificationPrompt = document.getElementById('modificationPrompt').value.trim();
    const apiKey = getApiKey();
    
    if (!modificationPrompt) {
        window.showStatus('⚠️ Please enter modification instructions!', 'error');
        return;
    }
    
    if (!window.currentSlideData || !window.currentSlideData.slides) {
        window.showStatus('⚠️ No slides to modify! Generate preview first.', 'error');
        return;
    }
    
    if (!apiKey) {
        window.showStatus('⚠️ Please enter your API key first!', 'error');
        return;
    }
    
    const modifyBtn = document.getElementById('modifyBtn');
    const originalBtnText = modifyBtn.innerHTML;
    modifyBtn.disabled = true;
    modifyBtn.innerHTML = '<span class="spinner"></span> Applying changes...';
    
    window.showStatus('🔄 AI is modifying your slides...', 'info');
    
    try {
        // Call backend to get modification prompt from config/prompts.json
        const response = await fetch('/api/modify-slides', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                currentSlides: window.currentSlideData.slides,
                modificationRequest: modificationPrompt,
                apiKey, 
                provider: window.currentProvider
            })
        });
        
        if (!response.ok) {
            throw new Error(`Modification failed: ${response.status}`);
        }
        
        const modifiedData = await response.json();
        
        // Update current slide data
        window.currentSlideData.slides = modifiedData.slides;
        
        // Re-render preview
        window.displayPreview(window.currentSlideData);
        
        // Clear modification prompt
        document.getElementById('modificationPrompt').value = '';
        
        window.showStatus(`✅ Slides modified successfully! ${modifiedData.slides.length} slides total.`, 'success');
        
    } catch (error) {
        console.error('Modification Error:', error);
        window.showStatus('❌ Error modifying slides: ' + error.message, 'error');
    } finally {
        modifyBtn.disabled = false;
        modifyBtn.innerHTML = originalBtnText;
    }
}

/**
 * Shows download link for generated PowerPoint
 * @param {string} downloadUrl - Blob URL for download
 * @param {number} fileSize - File size in bytes
 * @param {Object} storage - Storage URLs (optional)
 */
function showDownloadLink(downloadUrl, fileSize, storage = {}) {
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(2);
    const sizeText = fileSize > 1024 * 1024 ? `${fileSizeMB} MB` : `${fileSizeKB} KB`;
    
    const timestamp = new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Create download section
    const downloadSection = document.createElement('div');
    downloadSection.id = 'downloadSection';
    downloadSection.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 12px;
        margin: 2rem 0;
        text-align: center;
        box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
        animation: slideIn 0.5s ease-out;
    `;
    
    downloadSection.innerHTML = `
        <style>
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .download-btn {
                display: inline-block;
                background: white;
                color: #667eea;
                padding: 1rem 2rem;
                border-radius: 8px;
                text-decoration: none;
                font-weight: bold;
                font-size: 1.1rem;
                margin: 0.5rem;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            }
            
            .download-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
                background: #f0f0f0;
            }
            
            .download-btn:active {
                transform: translateY(0);
            }
            
            .download-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                animation: bounce 2s infinite;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }
            
            .file-info {
                margin: 1rem 0;
                opacity: 0.9;
                font-size: 0.95rem;
            }
        </style>
        
        <div class="download-icon">📊</div>
        <h2 style="margin: 0 0 0.5rem 0; font-size: 1.8rem;">Your Presentation is Ready!</h2>
        <div class="file-info">
            <p style="margin: 0.25rem 0;">📦 File size: ${sizeText}</p>
            <p style="margin: 0.25rem 0;">📅 Generated: ${timestamp}</p>
        </div>
        <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="${downloadUrl}" download="AI-Presentation-Pro.pptx" class="download-btn" id="pptxDownloadBtn">
                ⬇️ Download PPTX
            </a>
            ${storage.sessionId ? `
            <a href="/download/${storage.sessionId}/presentation.pptx" download="AI-Presentation-Pro.pptx" class="download-btn" style="background: #667eea; text-decoration: none;">
                ⬇️ Direct PPTX Link
            </a>
            ` : ''}
            <button onclick="window.viewPresentation('${downloadUrl}')" class="download-btn" style="border: none; cursor: pointer;">
                👁️ View Slides Online
            </button>
            ${storage.sessionId ? `
            <button onclick="window.viewPDF('${storage.sessionId}')" class="download-btn" style="border: none; cursor: pointer; background: #dc3545; color: white;">
                📄 View PDF Online
            </button>
            <a href="/download/${storage.sessionId}/presentation.pdf" download="AI-Presentation-Pro.pdf" class="download-btn" style="background: #28a745; text-decoration: none; color: white;">
                ⬇️ Download PDF
            </a>
            ` : ''}
        </div>
        <p style="margin-top: 1rem; font-size: 0.85rem; opacity: 0.8;">
            💡 <strong>Tip:</strong> If downloads are blocked by corporate firewall, try "View Online" buttons or use Direct Links
        </p>
        ${storage.sessionId ? `
        <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
            <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; font-weight: 600;">🔗 Shareable Links (bypass firewall):</p>
            <div style="display: flex; gap: 0.5rem; align-items: center; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 6px; margin-top: 0.5rem;">
                <input type="text" value="${window.location.origin}/download/${storage.sessionId}/presentation.pptx" readonly 
                    style="flex: 1; background: white; border: none; padding: 0.5rem; border-radius: 4px; font-size: 0.85rem;" 
                    id="directLinkInput"
                    onclick="this.select()">
                <button onclick="navigator.clipboard.writeText(document.getElementById('directLinkInput').value).then(() => window.showStatus('✅ Link copied!', 'success'))" 
                    class="download-btn" style="padding: 0.5rem 1rem; margin: 0; background: white; color: #667eea; font-size: 0.9rem;">
                    📋 Copy
                </button>
            </div>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.75rem; opacity: 0.9;">Share this link to download from any device</p>
        </div>
        ` : ''}
    `;
    
    // Remove old download section if exists
    const oldSection = document.getElementById('downloadSection');
    if (oldSection) {
        oldSection.remove();
    }
    
    // Insert after generate button section
    const generateSection = document.getElementById('generatePptSection');
    if (generateSection) {
        generateSection.parentNode.insertBefore(downloadSection, generateSection.nextSibling);
    }
    
    // Update status
    window.showStatus(`✅ PowerPoint ready! File size: ${sizeText}`, 'success');
    
    // Auto-scroll to download section
    setTimeout(() => {
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
}

/**
 * Opens PowerPoint viewer in modal
 * @param {string} blobUrl - Blob URL of the PowerPoint file
 */
function viewPresentation(blobUrl) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'presentationViewerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .viewer-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            
            .viewer-close {
                background: rgba(255,255,255,0.2);
                border: 2px solid white;
                color: white;
                padding: 0.5rem 1.5rem;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            
            .viewer-close:hover {
                background: white;
                color: #667eea;
                transform: scale(1.05);
            }
            
            .viewer-content {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                overflow: auto;
            }
            
            .viewer-iframe {
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 8px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                background: white;
            }
            
            .viewer-options {
                background: #1a1a1a;
                padding: 1rem 2rem;
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .viewer-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .viewer-btn:hover {
                background: #764ba2;
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }
            
            .loading-spinner {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 1rem;
                color: white;
            }
            
            .spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
        
        <div class="viewer-header">
            <div>
                <h2 style="margin: 0; font-size: 1.5rem;">📊 PowerPoint Viewer</h2>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">AI-Presentation-Pro.pptx</p>
            </div>
            <button class="viewer-close" onclick="window.closePresentationViewer()">✕ Close</button>
        </div>
        
        <div class="viewer-content" id="viewerContent">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p style="font-size: 1.1rem; margin: 0;">Loading presentation...</p>
                <p style="font-size: 0.9rem; margin: 0; opacity: 0.7;">This may take a few moments</p>
            </div>
        </div>
        
        <div class="viewer-options">
            <a href="${blobUrl}" download="AI-Presentation-Pro.pptx" class="viewer-btn">
                ⬇️ Download File
            </a>
            <button onclick="window.sharePresentation()" class="viewer-btn">
                🔗 Share Link
            </button>
            <button onclick="window.modifyCurrentSlide()" class="viewer-btn">
                ✏️ Modify Slide
            </button>
            <button onclick="window.openInOffice365('${blobUrl}')" class="viewer-btn" style="background: #0078d4;">
                📄 Office 365
            </button>
            <button onclick="window.openInGoogleSlides('${blobUrl}')" class="viewer-btn" style="background: #34a853;">
                🎨 Google Slides
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Try to load with Office Online Viewer
    setTimeout(() => {
        loadPresentationViewer(blobUrl);
    }, 100);
}

/**
 * Loads the presentation in the viewer
 * @param {string} blobUrl - Blob URL of PowerPoint file
 */
function loadPresentationViewer(blobUrl) {
    const viewerContent = document.getElementById('viewerContent');
    
    // Option 1: Try Office Online Viewer (requires public URL)
    // Option 2: Use Google Docs Viewer (requires public URL)
    // Option 3: Show slide preview from our data
    
    // Since we have blob URL (local), we'll show our slide preview
    if (window.currentSlideData && window.currentSlideData.slides) {
        renderFullSlidePreview(viewerContent);
    } else {
        // Fallback: Show instructions
        viewerContent.innerHTML = `
            <div style="text-align: center; color: white; max-width: 600px;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
                <h3 style="margin: 0 0 1rem 0;">PowerPoint File Ready</h3>
                <p style="font-size: 1.1rem; line-height: 1.6; opacity: 0.9;">
                    To view this presentation, you can:
                </p>
                <ul style="text-align: left; font-size: 1rem; line-height: 1.8; opacity: 0.8;">
                    <li>📥 <strong>Download</strong> the file and open in PowerPoint</li>
                    <li>☁️ <strong>Upload</strong> to Office 365 or Google Drive</li>
                    <li>🖥️ <strong>Open</strong> with desktop PowerPoint application</li>
                </ul>
                <p style="margin-top: 1.5rem; font-size: 0.9rem; opacity: 0.7;">
                    Online preview requires the file to be uploaded to a cloud service
                </p>
            </div>
        `;
    }
}

/**
 * Renders full slide preview in viewer
 * @param {HTMLElement} container - Container element
 */
function renderFullSlidePreview(container) {
    const slides = window.currentSlideData.slides;
    const theme = window.currentSlideData.designTheme || window.colorThemes['vibrant-purple'];
    
    container.innerHTML = `
        <div style="width: 100%; max-width: 1200px; color: white;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h3 style="margin: 0 0 0.5rem 0; font-size: 1.8rem;">📊 Presentation Preview</h3>
                <p style="margin: 0; opacity: 0.8; font-size: 1rem;">${slides.length} slides • ${theme.name} theme</p>
            </div>
            
            <div id="slideViewer" style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 2rem; backdrop-filter: blur(10px);">
                <div id="slideContainer"></div>
                <div style="display: flex; justify-content: center; align-items: center; gap: 1rem; margin-top: 2rem;">
                    <button onclick="window.previousSlide()" class="viewer-btn" style="padding: 0.5rem 1rem;">
                        ◀ Previous
                    </button>
                    <span id="slideCounter" style="font-size: 1.1rem; min-width: 100px; text-align: center;">
                        1 / ${slides.length}
                    </span>
                    <button onclick="window.nextSlide()" class="viewer-btn" style="padding: 0.5rem 1rem;">
                        Next ▶
                    </button>
                </div>
            </div>
            
            <p style="text-align: center; margin-top: 1.5rem; opacity: 0.7; font-size: 0.9rem;">
                💡 Use arrow keys to navigate • Download for full PowerPoint features
            </p>
        </div>
    `;
    
    // Initialize slide viewer
    window.currentSlideIndex = 0;
    window.totalSlides = slides.length;
    displaySlide(0);
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleSlideNavigation);
}

/**
 * Displays a specific slide
 * @param {number} index - Slide index
 */
function displaySlide(index) {
    if (!window.currentSlideData) return;
    
    const slides = window.currentSlideData.slides;
    const theme = window.currentSlideData.designTheme || window.colorThemes['vibrant-purple'];
    
    if (index < 0 || index >= slides.length) return;
    
    window.currentSlideIndex = index;
    const slide = slides[index];
    
    const container = document.getElementById('slideContainer');
    const counter = document.getElementById('slideCounter');
    
    if (container) {
        // Render slide preview
        container.innerHTML = window.renderSlidePreviewCard(slide, index, theme);
        counter.textContent = `${index + 1} / ${slides.length}`;
    }
}

/**
 * Navigate to previous slide
 */
function previousSlide() {
    if (window.currentSlideIndex > 0) {
        displaySlide(window.currentSlideIndex - 1);
    }
}

/**
 * Navigate to next slide
 */
function nextSlide() {
    if (window.currentSlideIndex < window.totalSlides - 1) {
        displaySlide(window.currentSlideIndex + 1);
    }
}

/**
 * Handle keyboard navigation
 * @param {KeyboardEvent} e - Keyboard event
 */
function handleSlideNavigation(e) {
    if (!document.getElementById('presentationViewerModal')) return;
    
    if (e.key === 'ArrowLeft') {
        previousSlide();
    } else if (e.key === 'ArrowRight') {
        nextSlide();
    } else if (e.key === 'Escape') {
        closePresentationViewer();
    }
}

/**
 * Closes the presentation viewer modal
 */
function closePresentationViewer() {
    const modal = document.getElementById('presentationViewerModal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', handleSlideNavigation);
        }, 300);
    }
}

/**
 * View PDF in browser using standard HTML iframe tag
 * @param {string} sessionId - Session identifier
 */
function viewPDF(sessionId) {
    // Create simple full-screen PDF viewer with iframe
    const modal = document.createElement('div');
    modal.id = 'pdfViewerModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background: #dc3545; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h2 style="margin: 0; font-size: 1.5rem;">📄 PDF Viewer</h2>
                <p style="margin: 0.25rem 0 0 0; font-size: 0.9rem; opacity: 0.9;">Use browser PDF controls to navigate</p>
            </div>
            <button onclick="document.getElementById('pdfViewerModal').remove(); document.body.style.overflow = '';" 
                style="background: rgba(255,255,255,0.2); border: 2px solid white; color: white; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: bold;">
                ✕ Close
            </button>
        </div>
        
        <div style="flex: 1; padding: 2rem; overflow: hidden;">
            <!-- Standard HTML iframe for PDF - Simple and effective -->
            <iframe 
                src="/view-pdf/${sessionId}" 
                type="application/pdf" 
                width="100%" 
                height="100%" 
                style="border: none; border-radius: 8px; background: white;">
            </iframe>
        </div>
        
        <div style="background: #1a1a1a; padding: 1rem; text-align: center;">
            <a href="/download/${sessionId}/presentation.pdf" download="AI-Presentation-Pro.pdf" 
                style="background: #28a745; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; text-decoration: none; display: inline-block; font-weight: bold;">
                ⬇️ Download PDF
            </a>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    window.showStatus('📄 Opening PDF viewer...', 'info');
}

/**
 * Opens file in Office 365
 * @param {string} blobUrl - Blob URL (will need to be uploaded)
 */
function openInOffice365(blobUrl) {
    window.showStatus('💡 Tip: Download the file and upload to OneDrive, then open with Office 365', 'info');
}

/**
 * Opens file in Google Slides
 * @param {string} blobUrl - Blob URL (will need to be uploaded)
 */
function openInGoogleSlides(blobUrl) {
    window.showStatus('💡 Tip: Download the file and upload to Google Drive, then open with Google Slides', 'info');
}

/**
 * Share presentation - creates a shareable link
 */
async function sharePresentation() {
    if (!window.currentSlideData) {
        window.showStatus('⚠️ No presentation to share. Generate a presentation first.', 'error');
        return;
    }
    
    window.showStatus('🔗 Creating shareable link...', 'info');
    
    try {
        const response = await fetch('/api/share-presentation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                slideData: window.currentSlideData,
                title: window.currentSlideData.slides[0]?.title || 'AI Presentation'
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create share link');
        }
        
        const data = await response.json();
        
        // Show share link modal
        showShareLinkModal(data.shareUrl, data.expiresIn);
        
        window.showStatus('✅ Shareable link created!', 'success');
        
    } catch (error) {
        console.error('Share error:', error);
        window.showStatus('❌ Failed to create share link: ' + error.message, 'error');
    }
}

/**
 * Shows modal with shareable link
 * @param {string} shareUrl - The shareable URL
 * @param {string} expiresIn - Expiration time
 */
function showShareLinkModal(shareUrl, expiresIn) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 600px; width: 90%;">
            <h2 style="margin: 0 0 1rem 0; color: #667eea; display: flex; align-items: center; gap: 0.5rem;">
                🔗 Shareable Link Created!
            </h2>
            
            <p style="color: #666; margin-bottom: 1rem;">
                Anyone with this link can view and modify your presentation. Link expires in ${expiresIn}.
            </p>
            
            <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; display: flex; gap: 0.5rem;">
                <input type="text" value="${shareUrl}" readonly 
                    style="flex: 1; border: none; background: transparent; font-family: monospace; font-size: 0.9rem; outline: none;"
                    id="shareUrlInput">
                <button onclick="copyShareUrl()" class="viewer-btn" style="padding: 0.5rem 1rem;">
                    📋 Copy
                </button>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick="openShareUrl()" class="viewer-btn" style="background: #667eea;">
                    🌐 Open Link
                </button>
                <button onclick="this.closest('div').parentElement.remove()" class="viewer-btn" style="background: #999;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Auto-select the URL
    setTimeout(() => {
        document.getElementById('shareUrlInput')?.select();
    }, 100);
}

/**
 * Copy share URL to clipboard
 */
function copyShareUrl() {
    const input = document.getElementById('shareUrlInput');
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
        window.showStatus('✅ Link copied to clipboard!', 'success');
    }).catch(() => {
        window.showStatus('⚠️ Please copy the link manually', 'info');
    });
}

/**
 * Open share URL in new tab
 */
function openShareUrl() {
    const input = document.getElementById('shareUrlInput');
    window.open(input.value, '_blank');
}

/**
 * Modify current slide in viewer
 */
function modifyCurrentSlide() {
    if (!window.currentSlideData || window.currentSlideIndex === undefined) {
        window.showStatus('⚠️ No slide selected', 'error');
        return;
    }
    
    const slide = window.currentSlideData.slides[window.currentSlideIndex];
    
    // Show modification modal
    showSlideModificationModal(slide, window.currentSlideIndex);
}

/**
 * Shows modal to modify slide
 * @param {Object} slide - Slide data
 * @param {number} index - Slide index
 */
function showSlideModificationModal(slide, index) {
    const modal = document.createElement('div');
    modal.id = 'modifySlideModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10001;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
        overflow-y: auto;
    `;
    
    const contentItems = slide.content || [];
    const contentHtml = contentItems.map((item, i) => `
        <div style="margin-bottom: 0.5rem;">
            <label style="display: block; font-weight: 600; margin-bottom: 0.25rem;">Point ${i + 1}:</label>
            <input type="text" value="${escapeHtmlAttribute(item)}" 
                data-content-index="${i}"
                style="width: 100%; padding: 0.5rem; border: 2px solid #ddd; border-radius: 6px;">
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 12px; padding: 2rem; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <h2 style="margin: 0 0 1rem 0; color: #667eea;">
                ✏️ Modify Slide ${index + 1}
            </h2>
            
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Title:</label>
                <input type="text" id="modifySlideTitle" value="${escapeHtmlAttribute(slide.title)}" 
                    style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1.1rem;">
            </div>
            
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Content:</label>
                <div id="modifySlideContent">
                    ${contentHtml}
                </div>
                <button onclick="addContentPoint()" style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #f0f0f0; border: 2px dashed #999; border-radius: 6px; cursor: pointer;">
                    + Add Point
                </button>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick="saveSlideModification(${index})" class="viewer-btn" style="background: #667eea;">
                    💾 Save Changes
                </button>
                <button onclick="document.getElementById('modifySlideModal').remove()" class="viewer-btn" style="background: #999;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

/**
 * Escape HTML for attribute usage
 */
function escapeHtmlAttribute(text) {
    return String(text).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Add content point to modification modal
 */
function addContentPoint() {
    const container = document.getElementById('modifySlideContent');
    const index = container.querySelectorAll('input').length;
    
    const div = document.createElement('div');
    div.style.marginBottom = '0.5rem';
    div.innerHTML = `
        <label style="display: block; font-weight: 600; margin-bottom: 0.25rem;">Point ${index + 1}:</label>
        <input type="text" value="" data-content-index="${index}"
            style="width: 100%; padding: 0.5rem; border: 2px solid #ddd; border-radius: 6px;">
    `;
    
    container.appendChild(div);
}

/**
 * Save slide modification
 */
function saveSlideModification(slideIndex) {
    if (!window.currentSlideData) return;
    
    const title = document.getElementById('modifySlideTitle').value;
    const contentInputs = document.querySelectorAll('#modifySlideContent input');
    const content = Array.from(contentInputs).map(input => input.value).filter(v => v.trim());
    
    // Update slide data
    window.currentSlideData.slides[slideIndex].title = title;
    window.currentSlideData.slides[slideIndex].content = content;
    
    // Re-render slide
    displaySlide(slideIndex);
    
    // Close modal
    document.getElementById('modifySlideModal').remove();
    
    window.showStatus('✅ Slide updated! Changes will be included in the next download.', 'success');
}

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Export functions
window.getApiKey = getApiKey;
window.generatePreview = generatePreview;
window.generatePresentation = generatePresentation;
window.modifySlides = modifySlides;
window.showDownloadLink = showDownloadLink;
window.viewPresentation = viewPresentation;
window.viewPDF = viewPDF;
window.closePresentationViewer = closePresentationViewer;
window.previousSlide = previousSlide;
window.nextSlide = nextSlide;
window.openInOffice365 = openInOffice365;
window.openInGoogleSlides = openInGoogleSlides;
window.sharePresentation = sharePresentation;
window.modifyCurrentSlide = modifyCurrentSlide;
window.copyShareUrl = copyShareUrl;
window.openShareUrl = openShareUrl;
window.addContentPoint = addContentPoint;
window.saveSlideModification = saveSlideModification;

// Immediate diagnostic
console.log('✅ api.js loaded - window.generatePreview:', typeof window.generatePreview);

