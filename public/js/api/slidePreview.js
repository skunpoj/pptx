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
    
    // Get word count for progress estimation
    const wordCount = text.split(/\s+/).length;
    
    console.log(`📝 Processing ${text.length} characters of content (${wordCount} words)`);
    
    const apiKey = (typeof getApiKey === 'function') ? getApiKey() : '';
    
    if (!apiKey) {
        console.log('ℹ️ No API key configured, using default backend provider');
    } else {
        console.log('✅ API key found, proceeding with preview generation');
    }
    
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
    
    // Show detailed loading state with progress steps
    const preview = document.getElementById('preview');
    // wordCount already declared at line 74, reuse it here
    const estimatedTime = Math.max(5, Math.min(20, Math.ceil(wordCount / 100)));
    
    preview.innerHTML = `
        <!-- Compact Status Bar (Always Visible) -->
        <div id="statusBar" style="position: sticky; top: 0; z-index: 100; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1rem; color: white; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3); margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.75rem;">
                <div style="position: relative; width: 40px; height: 40px; flex-shrink: 0;">
                    <span class="spinner" style="width: 40px; height: 40px; border: 2px solid rgba(255,255,255,0.3); border-top: 2px solid white; border-radius: 50%; animation: spin 1s linear infinite; display: block;"></span>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1rem;">🎨</div>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h3 style="margin: 0; font-size: 1rem; font-weight: 700;">✨ AI Design Studio</h3>
                            <p id="aiStatus" style="margin: 0; opacity: 0.9; font-size: 0.85rem;">Crafting ${wordCount}-word presentation...</p>
                        </div>
                        <div style="text-align: right;">
                            <div id="progressPercent" style="font-size: 1.5rem; font-weight: 700; line-height: 1;">0%</div>
                            <div style="font-size: 0.7rem; opacity: 0.8;">⏱️ <span id="countdown">${estimatedTime}s</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.15); height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 0.75rem;">
                <div id="progressBar" style="background: linear-gradient(90deg, #4ade80, #22c55e); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
            </div>
            
            <div id="progressSteps" style="display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.75rem;">
                <div id="step1" style="opacity: 0.5; display: flex; align-items: center; gap: 0.25rem;">
                    <span>⏳</span><span>Structure</span>
                </div>
                <div id="step2" style="opacity: 0.5; display: flex; align-items: center; gap: 0.25rem;">
                    <span>⏳</span><span>Layout</span>
                </div>
                <div id="step3" style="opacity: 0.5; display: flex; align-items: center; gap: 0.25rem;">
                    <span>⏳</span><span>Design</span>
                </div>
                <div id="step4" style="opacity: 0.5; display: flex; align-items: center; gap: 0.25rem;">
                    <span>⏳</span><span>Charts</span>
                </div>
                <div id="step5" style="opacity: 0.5; display: flex; align-items: center; gap: 0.25rem;">
                    <span>⏳</span><span>Rendering</span>
                </div>
            </div>
        </div>
        
        <!-- Live Code Stream (Always Visible, Collapsible) -->
        <div id="streamingContainer" style="background: #0d1117; border: 2px solid #30363d; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.3); margin-bottom: 1rem;">
            <div style="background: linear-gradient(90deg, #238636, #2ea043); padding: 0.5rem 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.toggleStreamingText()">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; animation: pulse 2s ease-in-out infinite;"></div>
                    <strong style="color: white; font-size: 0.85rem;">📡 Live Code Stream</strong>
                    <span style="font-size: 0.7rem; background: rgba(0,0,0,0.3); padding: 0.15rem 0.5rem; border-radius: 3px;">Real-time SSE</span>
                </div>
                <span id="streamToggleIcon" style="color: white; font-size: 0.8rem;">▼</span>
            </div>
            <div id="streamingTextBox" style="max-height: 250px; overflow-y: auto; padding: 0.75rem; font-family: 'Consolas', 'Monaco', 'Courier New', monospace; font-size: 0.65rem; color: #58a6ff; line-height: 1.5; white-space: pre-wrap; word-wrap: break-word; background: #0d1117;">
                <div style="color: #8b949e; font-style: italic;">⚡ Initializing connection...</div>
                <div style="color: #8b949e; font-style: italic;">🔌 Waiting for stream...</div>
            </div>
        </div>
        
        <!-- Slides Render Here (Incrementally, Below) -->
        <div id="slidesContainer" style="margin-top: 1rem;">
            <div id="slideSkeleton" style="text-align: center; padding: 2rem 1rem; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px dashed #0ea5e9; border-radius: 12px;">
                <div style="font-size: 3rem; margin-bottom: 0.75rem; animation: float 3s ease-in-out infinite;">🎬</div>
                <h3 style="color: #0369a1; margin: 0 0 0.5rem 0; font-size: 1.2rem; font-weight: 700;">Your Slides Will Appear Here</h3>
                <p style="color: #0c4a6e; margin: 0; font-size: 0.9rem;">Watch them materialize one-by-one as AI generates them...</p>
                <div style="display: flex; justify-content: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 1rem;">
                    <div style="background: white; padding: 0.75rem 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); animation: slideIn 0.5s ease-out;">
                        <div style="font-size: 1.5rem;">🎨</div>
                        <div style="font-size: 0.75rem; color: #0369a1; font-weight: 600;">Themes</div>
                    </div>
                    <div style="background: white; padding: 0.75rem 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); animation: slideIn 0.5s ease-out 0.1s; animation-fill-mode: both;">
                        <div style="font-size: 1.5rem;">📊</div>
                        <div style="font-size: 0.75rem; color: #0369a1; font-weight: 600;">Charts</div>
                    </div>
                    <div style="background: white; padding: 0.75rem 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); animation: slideIn 0.5s ease-out 0.2s; animation-fill-mode: both;">
                        <div style="font-size: 1.5rem;">✨</div>
                        <div style="font-size: 0.75rem; color: #0369a1; font-weight: 600;">Layout</div>
                    </div>
                    <div style="background: white; padding: 0.75rem 1rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); animation: slideIn 0.5s ease-out 0.3s; animation-fill-mode: both;">
                        <div style="font-size: 1.5rem;">🎯</div>
                        <div style="font-size: 0.75rem; color: #0369a1; font-weight: 600;">Content</div>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.5; transform: scale(1.2); }
            }
        </style>
    `;
    
    // Start countdown timer
    let remainingTime = estimatedTime;
    const countdownEl = document.getElementById('countdown');
    const countdownInterval = setInterval(() => {
        remainingTime--;
        if (remainingTime > 0 && countdownEl) {
            countdownEl.textContent = remainingTime + 's';
        } else if (countdownEl) {
            // Don't show "Finalizing" - just show completion indicator
            countdownEl.textContent = '...';
        }
    }, 1000);
    
    // Simulate progress steps with progress bar updates
    const steps = [
        { time: 1000, stepEl: 'step1', progress: 20 },
        { time: 3000, stepEl: 'step2', progress: 40 },
        { time: 5000, stepEl: 'step3', progress: 60 },
        { time: 7000, stepEl: 'step4', progress: 80 }
    ];
    
    const progressTimeouts = [];
    steps.forEach(step => {
        const timeout = setTimeout(() => {
            const stepEl = document.getElementById(step.stepEl);
            const progressBar = document.getElementById('progressBar');
            const progressPercent = document.getElementById('progressPercent');
            
            if (stepEl) {
                stepEl.style.opacity = '1';
                stepEl.style.fontWeight = '600';
                const icon = stepEl.querySelector('span:first-child');
                if (icon) icon.textContent = '✅';
            }
            
            if (progressBar) progressBar.style.width = step.progress + '%';
            if (progressPercent) progressPercent.textContent = step.progress + '%';
        }, step.time);
        progressTimeouts.push(timeout);
    });
    
    // Store cleanup function
    window.cleanupPreviewProgress = () => {
        clearInterval(countdownInterval);
        progressTimeouts.forEach(t => clearTimeout(t));
    };
    
    try {
        const currentProvider = window.currentProvider || 'bedrock';
        const numSlides = document.getElementById('numSlides')?.value || 6;
        
        console.log('🔍 Provider check:', {
            'window.currentProvider': window.currentProvider,
            'selectedProvider': currentProvider,
            'willUseBedrock': currentProvider === 'bedrock',
            'numSlides': numSlides
        });
        
        // Update streaming status
        appendStreamingText('📤 Sending request to /api/preview...\n');
        appendStreamingText(`Provider: ${currentProvider}\n`);
        appendStreamingText(`Content length: ${text.length} chars (${wordCount} words)\n`);
        appendStreamingText(`Expected slides: ${numSlides}\n`);
        appendStreamingText(`Incremental: true\n\n`);
        
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minute timeout for long slide generations
        
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                apiKey: apiKey,
                provider: currentProvider,
                numSlides: parseInt(numSlides),
                incremental: true  // Enable real-time streaming
            }),
            signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        appendStreamingText('✅ Response received!\n');
        appendStreamingText(`Status: ${response.status} ${response.statusText}\n`);
        
        if (!response.ok) {
            // Try to get the actual error message from backend
            let errorDetails = `Preview failed: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorDetails = errorData.error;
                }
                if (errorData.provider) {
                    errorDetails += ` (Provider: ${errorData.provider})`;
                }
            } catch (e) {
                // If parsing fails, use status text
                errorDetails = `Preview failed: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorDetails);
        }
        
        // Check if it's SSE streaming response
        const contentType = response.headers.get('content-type');
        appendStreamingText(`Content-Type: ${contentType}\n\n`);
        
        if (contentType && contentType.includes('text/event-stream')) {
            console.log('📡 Receiving real-time SSE stream...');
            appendStreamingText('🔴 STREAMING MODE DETECTED\n');
            appendStreamingText('📡 Processing Server-Sent Events...\n\n');
            
            // Use ReadableStream to process chunks as they arrive (REAL-TIME!)
            const slideData = await handleIncrementalStream(response);
            
            // Save and finalize
            if (slideData && slideData.slides) {
                console.log(`✅ Stream complete: ${slideData.slides.length} slides received`);
                
                // Match uploaded images to slides
                if (window.uploadedImages && window.uploadedImages.length > 0 && window.matchImagesToSlides) {
                    console.log(`🖼️ Matching ${window.uploadedImages.length} uploaded images to slides...`);
                    slideData.slides = window.matchImagesToSlides(slideData.slides, window.uploadedImages);
                }
                
                savePreviewCache(text, slideData);
                window.currentSlideData = slideData;
                
                // Track slide count in cookie for non-logged-in users
                if (typeof window.updateSlideCountCookie === 'function') {
                    window.updateSlideCountCookie(slideData.slides.length);
                }
                
                // Stop spinner and show completion
                const statusBar = document.getElementById('statusBar');
                if (statusBar) {
                    statusBar.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    const spinnerContainer = statusBar.querySelector('.spinner');
                    if (spinnerContainer && spinnerContainer.parentElement) {
                        spinnerContainer.parentElement.innerHTML = '<div style="font-size: 2.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">✅</div>';
                    }
                }
                
                // Update all status indicators to complete
                const aiStatus = document.getElementById('aiStatus');
                const progressBar = document.getElementById('progressBar');
                const progressPercent = document.getElementById('progressPercent');
                const countdownEl = document.getElementById('countdown');
                
                if (aiStatus) aiStatus.textContent = `✅ Complete! ${slideData.slides.length} slides rendered`;
                if (progressBar) progressBar.style.width = '100%';
                if (progressPercent) progressPercent.textContent = '100%';
                if (countdownEl) countdownEl.textContent = '✅ Done';
                
                // Hide initial progress indicator
                hidePreviewProgress();
                
                // Show generation section
                const generationSection = document.getElementById('generationSection');
                if (generationSection) generationSection.style.display = 'block';
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ Preview generated successfully!', 'success');
                }
                
                // Automatically generate images if slides have image descriptions
                if (typeof autoGenerateImagesForSlides === 'function') {
                    setTimeout(() => {
                        autoGenerateImagesForSlides();
                    }, 1000); // Small delay for better UX
                }
            }
        } else {
            // Fallback: non-streaming response (batch mode) - render progressively like streaming
            console.log('📋 Receiving non-streaming response...');
            appendStreamingText('⚠️ BATCH MODE - Rendering all slides progressively\n');
            appendStreamingText('📋 Waiting for complete response...\n\n');
            
            const responseText = await response.text();
            appendStreamingText(`Response received: ${responseText.length} bytes\n`);
            appendStreamingText('Parsing JSON...\n\n');
            
            const slideData = JSON.parse(responseText);
            
            if (slideData && slideData.slides) {
                // Match uploaded images to slides
                if (window.uploadedImages && window.uploadedImages.length > 0 && window.matchImagesToSlides) {
                    console.log(`🖼️ Matching ${window.uploadedImages.length} uploaded images to slides...`);
                    slideData.slides = window.matchImagesToSlides(slideData.slides, window.uploadedImages);
                }
                
                savePreviewCache(text, slideData);
                window.currentSlideData = slideData;
                
                // Track slide count in cookie for non-logged-in users
                if (typeof window.updateSlideCountCookie === 'function') {
                    window.updateSlideCountCookie(slideData.slides.length);
                }
                
                // Use progressive rendering like streaming - don't call displayPreview which wipes everything
                const slidesContainer = document.getElementById('slidesContainer');
                const theme = slideData.designTheme;
                
                if (slidesContainer && theme) {
                    // Remove skeleton if still present
                    const skeleton = document.getElementById('slideSkeleton');
                    if (skeleton) {
                        skeleton.style.transition = 'opacity 0.3s ease';
                        skeleton.style.opacity = '0';
                        setTimeout(() => skeleton.remove(), 300);
                    }
                    
                    // Add theme banner if not exists
                    if (!slidesContainer.querySelector('.theme-banner-batch')) {
                        const themeDiv = document.createElement('div');
                        themeDiv.className = 'theme-banner-batch';
                        themeDiv.style.cssText = `
                            background: linear-gradient(135deg, ${theme.colorPrimary}, ${theme.colorSecondary});
                            color: white;
                            padding: 1rem;
                            border-radius: 8px;
                            margin-bottom: 1rem;
                            text-align: center;
                        `;
                        themeDiv.innerHTML = `
                            <h3 style="margin: 0 0 0.5rem 0; color: white;">🎨 ${theme.name}</h3>
                            <p style="margin: 0; opacity: 0.9;">${theme.description}</p>
                        `;
                        slidesContainer.insertBefore(themeDiv, slidesContainer.firstChild);
                    }
                    
                    // Render slides progressively with animation
                    slideData.slides.forEach((slide, index) => {
                        setTimeout(() => {
                            const slideDiv = createSlidePreviewCard(slide, index, theme);
                            slideDiv.style.opacity = '0';
                            slideDiv.style.transform = 'translateY(20px)';
                            slidesContainer.appendChild(slideDiv);
                            
                            // Animate in
                            requestAnimationFrame(() => {
                                slideDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                slideDiv.style.opacity = '1';
                                slideDiv.style.transform = 'translateY(0)';
                            });
                        }, index * 100); // Stagger animations
                    });
                } else {
                    // Fallback to displayPreview if slidesContainer not found
                    displayPreview(slideData);
                }
                
                // Stop spinner and show completion (for non-streaming mode)
                const statusBar = document.getElementById('statusBar');
                if (statusBar) {
                    statusBar.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    const spinnerContainer = statusBar.querySelector('.spinner');
                    if (spinnerContainer && spinnerContainer.parentElement) {
                        spinnerContainer.parentElement.innerHTML = '<div style="font-size: 2.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">✅</div>';
                    }
                }
                
                // Update progress to 100%
                const progressBar = document.getElementById('progressBar');
                const progressPercent = document.getElementById('progressPercent');
                const aiStatus = document.getElementById('aiStatus');
                const countdownEl = document.getElementById('countdown');
                
                if (progressBar) progressBar.style.width = '100%';
                if (progressPercent) progressPercent.textContent = '100%';
                if (aiStatus) aiStatus.textContent = `✅ Complete! ${slideData.slides.length} slides rendered`;
                if (countdownEl) countdownEl.textContent = '✅ Done';
                
                hidePreviewProgress();
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ Preview generated successfully!', 'success');
                }
                
                // Automatically generate images if slides have image descriptions
                if (typeof autoGenerateImagesForSlides === 'function') {
                    setTimeout(() => {
                        autoGenerateImagesForSlides();
                    }, 1000); // Small delay for better UX
                }
            }
        }
        
    } catch (error) {
        console.error('Preview generation failed:', error);
        
        // Cleanup all progress indicators
        if (window.cleanupPreviewProgress) {
            window.cleanupPreviewProgress();
        }
        
        // Stop spinner on error
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {
            const spinnerContainer = statusBar.querySelector('.spinner');
            if (spinnerContainer && spinnerContainer.parentElement) {
                spinnerContainer.parentElement.innerHTML = '<div style="font-size: 2.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">❌</div>';
            }
        }
        
        // Get detailed error message
        let errorMessage = error.message || 'Unknown error';
        
        // Better error messages for common issues
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. The presentation is taking longer than expected. Try reducing the content length or number of slides.';
        } else if (errorMessage.includes('524')) {
            errorMessage = 'Server timeout (524). The presentation generation is taking too long. This can happen with very large presentations (20+ slides). Try:\n\n• Reducing the amount of content\n• Splitting into smaller presentations\n• Removing complex charts or images\n\nThe server is working but needs more time than allowed.';
        } else if (errorMessage.includes('Failed to fetch')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        console.log('Full error details:', error);
        
        // Show error in preview area
        preview.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #721c24; background: #f8d7da; border: 2px solid #f5c6cb; border-radius: 8px;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                <h3 style="margin: 0 0 0.5rem 0;">Preview Generation Failed</h3>
                <p style="margin: 0; font-size: 0.9rem; white-space: pre-wrap; max-width: 600px; margin-left: auto; margin-right: auto;">${errorMessage}</p>
                <p style="margin-top: 1rem; font-size: 0.85rem; color: #856404;">
                    Check browser console (F12) for more details.
                </p>
            </div>
        `;
        
        if (typeof showNotification === 'function') {
            showNotification('❌ Preview failed: ' + error.message, 'error');
        }
    } finally {
        // Restore button state
        previewBtn.textContent = originalText;
        previewBtn.disabled = false;
        
        // Final cleanup to ensure spinner is stopped
        if (window.cleanupPreviewProgress) {
            window.cleanupPreviewProgress();
        }
    }
}

/**
 * Toggle streaming text box visibility
 */
function toggleStreamingText() {
    const textBox = document.getElementById('streamingTextBox');
    const toggleIcon = document.getElementById('streamToggleIcon');
    if (!textBox || !toggleIcon) return;
    
    if (textBox.style.display === 'none') {
        textBox.style.display = 'block';
        toggleIcon.textContent = '▼';
    } else {
        textBox.style.display = 'none';
        toggleIcon.textContent = '▶';
    }
}

/**
 * Append text to streaming text box with syntax highlighting
 */
function appendStreamingText(text, type = 'data') {
    const textBox = document.getElementById('streamingTextBox');
    if (!textBox) {
        console.warn('⚠️ streamingTextBox not found!');
        return;
    }
    
    console.log('📝 Appending to stream:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Color coding based on content type
    let color = '#58a6ff'; // Default blue
    let icon = '';
    
    if (text.includes('data:')) {
        color = '#79c0ff'; // Lighter blue for data
        icon = '📦 ';
    } else if (text.includes('[DONE]')) {
        color = '#3fb950'; // Green for completion
        icon = '✅ ';
    } else if (text.includes('"type":"theme"')) {
        color = '#d2a8ff'; // Purple for theme
        icon = '🎨 ';
    } else if (text.includes('"type":"slide"')) {
        color = '#ffa657'; // Orange for slides
        icon = '📄 ';
    } else if (text.includes('error') || text.includes('Error')) {
        color = '#f85149'; // Red for errors
        icon = '❌ ';
    }
    
    // Create colored span
    const span = document.createElement('span');
    span.style.color = color;
    span.textContent = icon + text;
    textBox.appendChild(span);
    
    // Auto-scroll to bottom
    textBox.scrollTop = textBox.scrollHeight;
}

/**
 * Handle incremental stream - render slides as they arrive (REAL-TIME!)
 */
async function handleIncrementalStream(response) {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) {
        throw new Error('Preview container not found');
    }
    
    // Get the slides container (where slides will be appended)
    const slidesContainer = document.getElementById('slidesContainer');
    if (!slidesContainer) {
        console.error('❌ slidesContainer not found!');
        throw new Error('Slides container not found');
    }
    
    console.log('✅ Slides container found, slides will render here');
    
    // Verify streaming text box exists
    let verifyTextBox = document.getElementById('streamingTextBox');
    console.log('🔍 Streaming text box found:', !!verifyTextBox);
    
    if (verifyTextBox) {
        verifyTextBox.style.display = 'block';
        console.log('✅ Streaming text box is visible');
    }
    
    // Clear only the skeleton from slidesContainer
    const skeleton = document.getElementById('slideSkeleton');
    console.log('🔍 Skeleton placeholder found:', !!skeleton);
    
    // Clear initial status messages and show stream start
    let streamTextBox = document.getElementById('streamingTextBox');
    if (streamTextBox) {
        streamTextBox.innerHTML = '';
    }
    
    // Track stream start time
    window.streamStartTime = Date.now();
    
    appendStreamingText('🚀 Stream connection established\n', 'info');
    appendStreamingText(`⏰ Started: ${new Date().toLocaleTimeString()}\n`, 'info');
    appendStreamingText('⚡ LIVE STREAMING from AI...\n', 'info');
    appendStreamingText('📡 Receiving JSON as it\'s being generated...\n\n', 'info');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const slides = [];
    let theme = null;
    let totalSlides = 0;
    let progressDiv = null;
    let buffer = '';
    let isFirstChunk = true;
    let jsonBuffer = ''; // Buffer for concatenating raw_text JSON chunks
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('📡 Stream closed');
                const endTime = Date.now();
                const duration = endTime - (window.streamStartTime || endTime);
                
                // If we have accumulated JSON from raw_text events but no slides were rendered incrementally,
                // parse and render in batch (this handles cases where only raw_text comes through)
                if (jsonBuffer && jsonBuffer.trim().length > 0 && slides.length === 0) {
                    console.log('📦 Processing accumulated JSON buffer for batch rendering...');
                    appendStreamingText('\n📦 Processing accumulated JSON from raw_text events...\n');
                    
                    try {
                        // Clean the JSON buffer - remove malformed fragments
                        let cleanedJson = jsonBuffer
                            // Remove any non-JSON prefixes
                            .replace(/^[^{[]*/, '')
                            // Remove any non-JSON suffixes
                            .replace(/[^}\]]*$/, '')
                            // Fix common corruption: remove inserted event markers
                            .replace(/📦\s*data:\s*\{[^}]*\}/g, '')
                            .replace(/data:\s*\{[^}]*\}/g, '')
                            // Fix broken quotes from concatenation
                            .replace(/"([^"]*)"\s*📦/g, '"$1"')
                            // Fix broken graphics markers
                            .replace(/"graphics":\s*true/g, '"graphics": {}')
                            .replace(/"backgroundSh([^"]*?)"/g, (match) => {
                                // Try to fix broken backgroundShapes
                                return '"backgroundShapes": []';
                            })
                            // Remove incomplete property declarations
                            .replace(/,\s*"([^"]*?)":\s*([^,}\]]*?),?\s*$/gm, '')
                            // Fix trailing commas
                            .replace(/,(\s*[}\]])/g, '$1')
                            .trim();
                        
                        // Try to extract valid JSON object
                        const jsonMatch = cleanedJson.match(/(\{[\s\S]*\})/);
                        if (jsonMatch) {
                            cleanedJson = jsonMatch[1];
                        }
                        
                        console.log(`📦 Cleaned JSON length: ${cleanedJson.length} chars`);
                        
                        const batchData = JSON.parse(cleanedJson);
                        
                        if (batchData.slides && batchData.slides.length > 0) {
                            console.log(`✅ Parsed ${batchData.slides.length} slides from accumulated JSON`);
                            
                            // Use the same progressive rendering as batch mode
                            if (!theme && batchData.designTheme) {
                                theme = batchData.designTheme;
                                totalSlides = batchData.slides.length;
                                
                                // Remove skeleton
                                const skeleton = document.getElementById('slideSkeleton');
                                if (skeleton) {
                                    skeleton.style.transition = 'opacity 0.3s ease';
                                    skeleton.style.opacity = '0';
                                    setTimeout(() => skeleton.remove(), 300);
                                }
                                
                                // Show theme banner
                                const themeDiv = document.createElement('div');
                                themeDiv.className = 'theme-banner-batch';
                                themeDiv.style.cssText = `
                                    background: linear-gradient(135deg, ${theme.colorPrimary}, ${theme.colorSecondary});
                                    color: white;
                                    padding: 1rem;
                                    border-radius: 8px;
                                    margin-bottom: 1rem;
                                    text-align: center;
                                `;
                                themeDiv.innerHTML = `
                                    <h3 style="margin: 0 0 0.5rem 0; color: white;">🎨 ${theme.name}</h3>
                                    <p style="margin: 0; opacity: 0.9;">${theme.description}</p>
                                `;
                                slidesContainer.insertBefore(themeDiv, slidesContainer.firstChild);
                            }
                            
                            // Render slides progressively
                            batchData.slides.forEach((slide, index) => {
                                slides.push(slide);
                                setTimeout(() => {
                                    const slideDiv = createSlidePreviewCard(slide, index, theme || batchData.designTheme);
                                    slideDiv.style.opacity = '0';
                                    slideDiv.style.transform = 'translateY(20px)';
                                    slidesContainer.appendChild(slideDiv);
                                    
                                    requestAnimationFrame(() => {
                                        slideDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                        slideDiv.style.opacity = '1';
                                        slideDiv.style.transform = 'translateY(0)';
                                    });
                                }, index * 100);
                            });
                            
                            // Update final counts
                            totalSlides = batchData.slides.length;
                        }
                    } catch (parseError) {
                        console.error('❌ Failed to parse accumulated JSON:', parseError);
                        appendStreamingText(`\n❌ Error parsing accumulated JSON: ${parseError.message}\n`);
                    }
                }
                
                appendStreamingText('\n\n' + '═'.repeat(50) + '\n');
                appendStreamingText('✅ STREAM COMPLETE!\n');
                appendStreamingText(`⏱️ Total duration: ${(duration/1000).toFixed(2)}s\n`);
                appendStreamingText(`📊 Total data received: ${buffer.length} bytes\n`);
                appendStreamingText(`📦 JSON buffer size: ${jsonBuffer.length} chars\n`);
                appendStreamingText(`📄 Slides rendered: ${slides.length}\n`);
                appendStreamingText('═'.repeat(50) + '\n');
                
                // Stop spinner when stream closes
                const statusBar = document.getElementById('statusBar');
                if (statusBar) {
                    statusBar.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                    const spinnerContainer = statusBar.querySelector('.spinner');
                    if (spinnerContainer && spinnerContainer.parentElement) {
                        spinnerContainer.parentElement.innerHTML = '<div style="font-size: 2.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">✅</div>';
                    }
                }
                
                // Update status text
                const aiStatus = document.getElementById('aiStatus');
                const progressBar = document.getElementById('progressBar');
                const progressPercent = document.getElementById('progressPercent');
                const countdownEl = document.getElementById('countdown');
                
                if (aiStatus && !aiStatus.textContent.includes('Complete')) {
                    aiStatus.textContent = `✅ Stream complete!`;
                }
                if (progressBar && progressBar.style.width !== '100%') {
                    progressBar.style.width = '100%';
                }
                if (progressPercent && progressPercent.textContent !== '100%') {
                    progressPercent.textContent = '100%';
                }
                if (countdownEl) {
                    countdownEl.textContent = '✅ Done';
                }
                
                // Keep streaming box visible for user review (no auto-collapse)
                // User can manually collapse by clicking header
                
                break;
            }
            
            // Decode chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            console.log(`📦 Received chunk: ${chunk.length} bytes`);
            
            // On first chunk, add separator
            if (isFirstChunk) {
                console.log('🎬 First chunk received!');
                const sep = document.createElement('div');
                sep.style.cssText = 'color: #8b949e; margin: 0.5rem 0; border-top: 1px solid #30363d; padding-top: 0.5rem;';
                sep.textContent = '─'.repeat(50);
                const textBox = document.getElementById('streamingTextBox');
                if (textBox) textBox.appendChild(sep);
                isFirstChunk = false;
            }
            
            // Show raw chunk in streaming text box with color coding
            console.log(`✍️ Appending chunk (${chunk.length} bytes)...`);
            appendStreamingText(chunk);
            
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
                        
                        // PROVIDER INFO EVENT - Show actual provider being used
                        if (data.type === 'provider_info') {
                            console.log('🔍 Actual provider being used:', data.provider);
                            const textBox = document.getElementById('streamingTextBox');
                            if (textBox) {
                                const providerSpan = document.createElement('div');
                                providerSpan.style.color = '#28a745';
                                providerSpan.style.fontWeight = 'bold';
                                providerSpan.textContent = `🔍 Actual provider: ${data.provider} (Expected slides: ${data.numSlides})`;
                                textBox.appendChild(providerSpan);
                                textBox.scrollTop = textBox.scrollHeight;
                            }
                        }
                        
                        // RAW TEXT EVENT - Collect JSON chunks for batch rendering
                        else if (data.type === 'raw_text') {
                            // Accumulate JSON text chunks - we'll parse and render in batch at the end
                            jsonBuffer += data.text;
                            
                            // Show it in the streaming box character by character for visual feedback
                            const rawSpan = document.createElement('span');
                            rawSpan.style.color = '#8b949e';
                            rawSpan.textContent = data.text;
                            const textBox = document.getElementById('streamingTextBox');
                            if (textBox) {
                                textBox.appendChild(rawSpan);
                                textBox.scrollTop = textBox.scrollHeight;
                            }
                        }
                        
                        // THEME EVENT - Show theme header immediately
                        else if (data.type === 'theme') {
                            theme = data.theme;
                            totalSlides = data.totalSlides;
                            console.log(`🎨 Theme received: ${theme.name} (${totalSlides} slides)`);
                            
                            // Remove skeleton
                            const skeleton = document.getElementById('slideSkeleton');
                            if (skeleton) {
                                skeleton.style.transition = 'opacity 0.3s ease';
                                skeleton.style.opacity = '0';
                                setTimeout(() => skeleton.remove(), 300);
                            }
                            
                            // Show theme banner in slides container
                            const themeDiv = document.createElement('div');
                            themeDiv.style.cssText = `
                                background: linear-gradient(135deg, ${theme.colorPrimary}, ${theme.colorSecondary});
                                color: white;
                                padding: 1rem;
                                border-radius: 8px;
                                margin-bottom: 1rem;
                                text-align: center;
                            `;
                            themeDiv.innerHTML = `
                                <h3 style="margin: 0 0 0.5rem 0; color: white;">🎨 ${theme.name}</h3>
                                <p style="margin: 0; opacity: 0.9;">${theme.description}</p>
                            `;
                            slidesContainer.appendChild(themeDiv);
                            
                            // Add progress counter
                            progressDiv = document.createElement('div');
                            progressDiv.id = 'slideProgress';
                            progressDiv.style.cssText = `
                                background: #e3f2fd;
                                padding: 0.75rem 1rem;
                                border-radius: 8px;
                                margin-bottom: 1rem;
                                text-align: center;
                                font-weight: bold;
                                color: #1976d2;
                                font-size: 1rem;
                            `;
                            progressDiv.innerHTML = `⏳ Generating ${totalSlides} slides... <span id="slideProgressCount">0/${totalSlides}</span>`;
                            slidesContainer.appendChild(progressDiv);
                        }
                        
                        // SLIDE EVENT - Render slide immediately as it arrives! (INCREMENTAL RENDERING)
                        else if (data.type === 'slide') {
                            slides.push(data.slide);
                            console.log(`📄 Slide ${data.current}/${data.total}: ${data.slide.title}`);
                            
                            // Update progress counter and progress bar in real-time
                            const progressCount = document.getElementById('slideProgressCount');
                            const progressBar = document.getElementById('progressBar');
                            const progressPercent = document.getElementById('progressPercent');
                            const aiStatus = document.getElementById('aiStatus');
                            
                            if (progressCount) {
                                progressCount.textContent = `${data.current}/${data.total}`;
                            }
                            
                            // Calculate and update progress percentage (80% to 100% range for slides)
                            const slideProgress = 80 + Math.floor((data.current / data.total) * 20);
                            if (progressBar) progressBar.style.width = slideProgress + '%';
                            if (progressPercent) progressPercent.textContent = slideProgress + '%';
                            if (aiStatus) aiStatus.textContent = `Rendering slide ${data.current} of ${data.total}...`;
                            
                            // Add streaming update
                            appendStreamingText(`\n📊 Progress: ${data.current}/${data.total} slides (${Math.floor((data.current/data.total)*100)}%)\n`);
                            
                            // Mark step 5 as active and hide skeleton when first slide arrives
                            if (data.current === 1) {
                                const step5 = document.getElementById('step5');
                                if (step5) {
                                    step5.style.opacity = '1';
                                    step5.style.fontWeight = '600';
                                    const icon = step5.querySelector('span:first-child');
                                    if (icon) icon.textContent = '✅';
                                }
                                
                                // Hide the skeleton placeholder
                                const skeleton = document.getElementById('slideSkeleton');
                                if (skeleton) {
                                    skeleton.style.transition = 'opacity 0.3s ease';
                                    skeleton.style.opacity = '0';
                                    setTimeout(() => skeleton.remove(), 300);
                                }
                            }
                            
                            // Render THIS slide right now (not waiting for others!) - APPEND TO SLIDES CONTAINER
                            const slideDiv = createSlidePreviewCard(data.slide, data.index, theme);
                            slideDiv.style.opacity = '0';
                            slideDiv.style.transform = 'translateY(20px)';
                            slidesContainer.appendChild(slideDiv);
                            
                            // Animate in
                            requestAnimationFrame(() => {
                                slideDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                                slideDiv.style.opacity = '1';
                                slideDiv.style.transform = 'translateY(0)';
                            });
                            
                            // Auto-scroll to latest slide (smooth scroll)
                            slideDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }
                        
                        // COMPLETE EVENT - Finalize
                        else if (data.type === 'complete') {
                            console.log('✅ Stream complete event received');
                            
                            // IMPORTANT: Don't re-render if slides were already rendered via streaming
                            // The complete event may contain full data, but we already rendered slides incrementally
                            // Only update completion status, don't wipe and re-render
                            
                            // Update progress to 100%
                            const progressBar = document.getElementById('progressBar');
                            const progressPercent = document.getElementById('progressPercent');
                            const aiStatus = document.getElementById('aiStatus');
                            const countdownEl = document.getElementById('countdown');
                            const statusBar = document.getElementById('statusBar');
                            
                            if (progressBar) progressBar.style.width = '100%';
                            if (progressPercent) progressPercent.textContent = '100%';
                            if (aiStatus) aiStatus.textContent = `✅ Complete! ${totalSlides} slides rendered`;
                            if (countdownEl) countdownEl.textContent = '✅ Done';
                            
                            // Stop the spinner and change status bar to success style
                            if (statusBar) {
                                statusBar.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                                
                                // Remove spinner, replace with success icon
                                const spinnerContainer = statusBar.querySelector('.spinner');
                                if (spinnerContainer && spinnerContainer.parentElement) {
                                    spinnerContainer.parentElement.innerHTML = '<div style="font-size: 2.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">✅</div>';
                                }
                            }
                            
                            // If complete event has full data, save it but DON'T call displayPreview
                            // Slides are already rendered incrementally above
                            if (data.data && data.data.slides) {
                                console.log('✅ Complete event has full data, but skipping re-render (slides already rendered)');
                                // Just update the stored data for future reference
                                if (!window.currentSlideData || slides.length > 0) {
                                    // Only update if we actually have rendered slides
                                    window.currentSlideData = data.data;
                                }
                            }
                            
                            // Add final streaming message
                            appendStreamingText('\n\n🎉 GENERATION COMPLETE!\n');
                            appendStreamingText(`✅ Total slides: ${totalSlides}\n`);
                            appendStreamingText(`⏱️ Stream duration: ${Date.now() - (window.streamStartTime || Date.now())}ms\n`);
                            
                            // Cleanup countdown and timers
                            if (window.cleanupPreviewProgress) {
                                window.cleanupPreviewProgress();
                            }
                            
                            // Show completion message
                            if (progressDiv) {
                                progressDiv.innerHTML = `✅ All ${totalSlides} slides generated successfully!`;
                                progressDiv.style.background = '#d4edda';
                                progressDiv.style.borderColor = '#28a745';
                                progressDiv.style.color = '#155724';
                                
                                // Fade out after 2 seconds
                                setTimeout(() => {
                                    progressDiv.style.transition = 'opacity 0.5s ease';
                                    progressDiv.style.opacity = '0';
                                    setTimeout(() => {
                                        if (progressDiv && progressDiv.parentNode) {
                                            progressDiv.remove();
                                        }
                                    }, 500);
                                }, 2000);
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
        
        // Ensure spinner stops and status updates
        const statusBar = document.getElementById('statusBar');
        if (statusBar) {
            const spinnerContainer = statusBar.querySelector('.spinner');
            if (spinnerContainer && spinnerContainer.parentElement) {
                spinnerContainer.parentElement.innerHTML = '<div style="font-size: 2.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">✅</div>';
            }
        }
        
        // Cleanup timers
        if (window.cleanupPreviewProgress) {
            window.cleanupPreviewProgress();
        }
    }
    
    // Return complete slideData object
    const finalSlideData = {
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
    
    // Track slide count in cookie for non-logged-in users (after stream completes)
    if (typeof window.updateSlideCountCookie === 'function' && slides.length > 0) {
        window.updateSlideCountCookie(slides.length);
    }
    
    return finalSlideData;
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
        // Check if this is a chart slide
        if (slide.layout === 'chart' && slide.chart) {
            slideDiv.innerHTML += `
                <h3 style="color: ${theme?.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h3>
                ${slide.header ? `<p style="color: #666; font-style: italic; margin: 0.5rem 0;">${slide.header}</p>` : ''}
                <div style="background: #f8f9fa; border: 2px solid ${theme?.colorAccent || '#F39C12'}; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                    <div style="font-weight: 600; color: ${theme?.colorPrimary || '#667eea'}; margin-bottom: 0.5rem; text-align: center;">
                        📊 ${slide.chart.title || 'Chart'}
                    </div>
                    <div style="text-align: center;">
                        ${typeof window.generateChartSVG === 'function' ? window.generateChartSVG(slide.chart, theme || {}, 450, 250) : '<p>Chart rendering not available</p>'}
                    </div>
                </div>
                ${slide.content && slide.content.length > 0 ? `
                    <ul style="color: ${theme?.colorText || '#1d1d1d'}; margin-top: 1rem;">
                        ${slide.content.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                ` : ''}
            `;
        } else {
            // Regular content slide
            slideDiv.innerHTML += `
                <h3 style="color: ${theme?.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h3>
                ${slide.header ? `<p style="color: #666; font-style: italic; margin: 0.5rem 0;">${slide.header}</p>` : ''}
                ${slide.content ? `
                    <ul style="color: ${theme?.colorText || '#1d1d1d'};">
                        ${slide.content.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                ` : ''}
                ${slide.imageUrl ? `
                    <div style="margin-top: 1rem; text-align: center;">
                        <img src="${slide.imageUrl}" 
                             alt="${slide.imageDescription || 'Slide image'}" 
                             style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                        <div style="display: none; background: #f0f4ff; border: 2px dashed ${theme?.colorAccent || '#667eea'}; padding: 1rem; border-radius: 8px; color: #666;">
                            🖼️ Image failed to load
                        </div>
                    </div>
                ` : (slide.imageDescription ? `
                    <div style="margin-top: 1rem; background: #f0f4ff; border: 2px dashed ${theme?.colorAccent || '#667eea'}; padding: 1rem; border-radius: 8px;">
                        <div style="font-weight: 600; color: ${theme?.colorPrimary || '#667eea'}; margin-bottom: 0.5rem;">
                            🖼️ Image Placeholder
                        </div>
                        <div style="font-size: 0.9rem; color: #666; font-style: italic;">
                            ${slide.imageDescription}
                        </div>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #999;">
                            Generate images to replace this placeholder
                        </div>
                    </div>
                ` : '')}
            `;
        }
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
 * Clear preview cache for specific text
 */
function clearPreviewCacheForText(text) {
    try {
        const cacheKey = 'preview_cache_' + simpleHash(text);
        localStorage.removeItem(cacheKey);
        console.log('🗑️ Cache cleared for this content');
    } catch (error) {
        console.warn('Cache clear failed:', error);
    }
}

/**
 * Clear all preview caches
 */
function clearAllPreviewCaches() {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('preview_cache_')) {
                localStorage.removeItem(key);
            }
        });
        console.log('🗑️ All preview caches cleared');
    } catch (error) {
        console.warn('Cache clear all failed:', error);
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
                const theme = slideData.designTheme || {};
                // Check if this is a chart slide
                if (slide.layout === 'chart' && slide.chart) {
                    slideDiv.innerHTML += `
                        <h3 style="color: ${theme.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h3>
                        ${slide.header ? `<p style="color: #666; font-style: italic; margin: 0.5rem 0;">${slide.header}</p>` : ''}
                        <div style="background: #f8f9fa; border: 2px solid ${theme.colorAccent || '#F39C12'}; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                            <div style="font-weight: 600; color: ${theme.colorPrimary || '#667eea'}; margin-bottom: 0.5rem; text-align: center;">
                                📊 ${slide.chart.title || 'Chart'}
                            </div>
                            <div style="text-align: center;">
                                ${typeof window.generateChartSVG === 'function' ? window.generateChartSVG(slide.chart, theme, 450, 250) : '<p>Chart rendering not available</p>'}
                            </div>
                        </div>
                        ${slide.content && slide.content.length > 0 ? `
                            <ul style="color: ${theme.colorText || '#1d1d1d'}; margin-top: 1rem;">
                                ${slide.content.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        ` : ''}
                    `;
                } else {
                    // Regular content slide
                    slideDiv.innerHTML += `
                        <h3 style="color: ${theme.colorPrimary || '#1C2833'}; margin-top: 0;">${slide.title}</h3>
                        ${slide.header ? `<p style="color: #666; font-style: italic; margin: 0.5rem 0;">${slide.header}</p>` : ''}
                        ${slide.content ? `
                            <ul style="color: ${theme.colorText || '#1d1d1d'};">
                                ${slide.content.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        ` : ''}
                        ${slide.imageUrl ? `
                            <div style="margin-top: 1rem; text-align: center;">
                                <img src="${slide.imageUrl}" 
                                     alt="${slide.imageDescription || 'Slide image'}" 
                                     style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                                <div style="display: none; background: #f0f4ff; border: 2px dashed ${theme.colorAccent || '#667eea'}; padding: 1rem; border-radius: 8px; color: #666;">
                                    🖼️ Image failed to load
                                </div>
                            </div>
                        ` : (slide.imageDescription ? `
                            <div style="margin-top: 1rem; background: #f0f4ff; border: 2px dashed ${theme.colorAccent || '#667eea'}; padding: 1rem; border-radius: 8px;">
                                <div style="font-weight: 600; color: ${theme.colorPrimary || '#667eea'}; margin-bottom: 0.5rem;">
                                    🖼️ Image Placeholder
                                </div>
                                <div style="font-size: 0.9rem; color: #666; font-style: italic;">
                                    ${slide.imageDescription}
                                </div>
                                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #999;">
                                    Click "Generate Images" to create this image
                                </div>
                            </div>
                        ` : '')}
                    `;
                }
            }
            
            previewContainer.appendChild(slideDiv);
        });
    }
    
    const generationSection = document.getElementById('generationSection');
    if (generationSection) generationSection.style.display = 'block';
}

// Export functions
window.generatePreview = generatePreview;
window.displayPreview = displayPreview;
window.showPreviewProgress = showPreviewProgress;
window.hidePreviewProgress = hidePreviewProgress;
window.handleIncrementalStream = handleIncrementalStream;
window.clearPreviewCacheForText = clearPreviewCacheForText;
window.clearAllPreviewCaches = clearAllPreviewCaches;
window.toggleStreamingText = toggleStreamingText;
window.appendStreamingText = appendStreamingText;

// Add spinner animation CSS if not exists
if (!document.querySelector('#spinnerAnimationStyle')) {
    const style = document.createElement('style');
    style.id = 'spinnerAnimationStyle';
    style.textContent = `
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        .spinner {
            display: inline-block;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

// Verify loading
console.log('✅ slidePreview.js loaded - Real-time incremental rendering enabled');
console.log('   window.generatePreview:', typeof window.generatePreview);
console.log('   window.handleIncrementalStream:', typeof window.handleIncrementalStream);
console.log('   window.toggleStreamingText:', typeof window.toggleStreamingText);
console.log('   window.appendStreamingText:', typeof window.appendStreamingText);

