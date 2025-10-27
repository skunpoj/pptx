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
        <!-- Streaming Text Box (Always Visible from Start) -->
        <div id="streamingContainer" style="background: #1e1e1e; border: 2px solid #667eea; border-radius: 8px; margin-bottom: 1rem; text-align: left; overflow: hidden;">
            <div style="background: #667eea; padding: 0.5rem 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.toggleStreamingText()">
                <strong style="color: white; font-size: 0.9rem;">💬 AI Response Stream (Live)</strong>
                <span id="streamToggleIcon" style="color: white; font-size: 0.8rem;">▼</span>
            </div>
            <div id="streamingTextBox" style="max-height: 200px; overflow-y: auto; padding: 1rem; font-family: 'Courier New', monospace; font-size: 0.75rem; color: #00ff00; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word;">
                <span style="opacity: 0.6;">⏳ Connecting to AI... Waiting for response stream...</span>
            </div>
        </div>
        
        <div id="streamingStatus" style="text-align: center; padding: 2rem; max-width: 600px; margin: 0 auto;">
            <div style="position: relative; width: 80px; height: 80px; margin: 0 auto;">
                <span class="spinner" style="width: 80px; height: 80px; border-width: 4px; border-color: #667eea; border-top-color: transparent; display: inline-block; width: 80px; height: 80px; border: 4px solid #667eea; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></span>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem;">🤖</div>
            </div>
            
            <p style="margin-top: 1.5rem; color: #333; font-size: 1.2rem; font-weight: 700;">AI is Processing Your Content</p>
            <p id="aiStatus" style="margin-top: 0.5rem; color: #667eea; font-size: 1rem; font-weight: 600;">
                Analyzing ${wordCount} words...
            </p>
            
            <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left: 4px solid #667eea; padding: 1rem; border-radius: 8px; margin: 1.5rem 0; text-align: left;">
                <p style="margin: 0; font-size: 0.95rem; color: #555; line-height: 1.6;">
                    <strong style="color: #667eea;">⏱️ What's happening:</strong><br>
                    <span id="currentStep">1️⃣ Sending content to AI for analysis</span>
                </p>
                <div id="progressSteps" style="margin-top: 1rem; font-size: 0.85rem; color: #777; line-height: 1.8;">
                    <div id="step1" style="opacity: 0.5;">⏳ Analyzing content structure & themes</div>
                    <div id="step2" style="opacity: 0.5;">⏳ Determining optimal slide count</div>
                    <div id="step3" style="opacity: 0.5;">⏳ Creating slide layout & design</div>
                    <div id="step4" style="opacity: 0.5;">⏳ Extracting data for charts & visuals</div>
                    <div id="step5" style="opacity: 0.5;">⏳ Rendering slide previews</div>
                </div>
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
        { time: 1000, status: '1️⃣ AI is analyzing your content structure...', stepEl: 'step1' },
        { time: 3000, status: '2️⃣ AI is determining optimal slide layout...', stepEl: 'step2' },
        { time: 5000, status: '3️⃣ AI is creating slide designs...', stepEl: 'step3' },
        { time: 7000, status: '4️⃣ AI is extracting data for visualizations...', stepEl: 'step4' }
    ];
    
    const progressTimeouts = [];
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
        progressTimeouts.push(timeout);
    });
    
    // Store cleanup function
    window.cleanupPreviewProgress = () => {
        clearInterval(countdownInterval);
        progressTimeouts.forEach(t => clearTimeout(t));
    };
    
    try {
        const currentProvider = window.currentProvider || 'anthropic';
        
        // Update streaming status
        appendStreamingText('📤 Sending request to /api/preview...\n');
        appendStreamingText(`Provider: ${currentProvider}\n`);
        appendStreamingText(`Content length: ${text.length} chars (${wordCount} words)\n`);
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
                
                // Hide initial progress indicator
                hidePreviewProgress();
                
                // Show generation button (no modify section anymore)
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
            // Fallback: non-streaming response
            console.log('📋 Receiving non-streaming response...');
            appendStreamingText('⚠️ NON-STREAMING MODE\n');
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
                displayPreview(slideData);
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
 * Append text to streaming text box
 */
function appendStreamingText(text) {
    const textBox = document.getElementById('streamingTextBox');
    if (!textBox) {
        console.warn('⚠️ streamingTextBox not found!');
        return;
    }
    
    // Debug log
    console.log('📝 Appending to stream:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    // Append new text (no need to clear, handled by handleIncrementalStream)
    const textNode = document.createTextNode(text);
    textBox.appendChild(textNode);
    
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
    
    // Preserve the existing streaming container
    let streamingContainer = document.getElementById('streamingContainer');
    console.log('🔍 Streaming container found:', !!streamingContainer);
    
    if (!streamingContainer) {
        console.error('❌ streamingContainer not found! Creating new one...');
        // Create it if it doesn't exist
        streamingContainer = document.createElement('div');
        streamingContainer.id = 'streamingContainer';
        streamingContainer.style.cssText = 'background: #1e1e1e; border: 2px solid #667eea; border-radius: 8px; margin-bottom: 1rem; text-align: left; overflow: hidden;';
        streamingContainer.innerHTML = `
            <div style="background: #667eea; padding: 0.5rem 1rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.toggleStreamingText()">
                <strong style="color: white; font-size: 0.9rem;">💬 AI Response Stream (Live)</strong>
                <span id="streamToggleIcon" style="color: white; font-size: 0.8rem;">▼</span>
            </div>
            <div id="streamingTextBox" style="max-height: 200px; overflow-y: auto; padding: 1rem; font-family: 'Courier New', monospace; font-size: 0.75rem; color: #00ff00; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word;">
                <span style="opacity: 0.6;">Stream starting...</span>
            </div>
        `;
        previewContainer.insertBefore(streamingContainer, previewContainer.firstChild);
    }
    
    // Verify streaming text box exists and ensure it's visible
    const textBox = document.getElementById('streamingTextBox');
    console.log('🔍 Streaming text box found:', !!textBox);
    
    if (textBox) {
        // Force it to be visible
        textBox.style.display = 'block';
        console.log('✅ Streaming text box display set to block');
    }
    
    // Clear everything EXCEPT the streaming container
    const children = Array.from(previewContainer.children);
    children.forEach(child => {
        if (child.id !== 'streamingContainer') {
            console.log('🗑️ Removing child:', child.id || child.className || child.tagName);
            child.remove();
        }
    });
    
    // Test streaming text immediately
    console.log('🧪 Testing appendStreamingText...');
    appendStreamingText('═══════════════════════════════════\n');
    appendStreamingText('🔴 STREAM HANDLER STARTED\n');
    appendStreamingText('═══════════════════════════════════\n\n');
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    const slides = [];
    let theme = null;
    let totalSlides = 0;
    let progressDiv = null;
    let buffer = '';
    let isFirstChunk = true;
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('📡 Stream closed');
                appendStreamingText('\n\n✅ Stream complete!');
                
                // Auto-collapse streaming text box after 3 seconds
                setTimeout(() => {
                    const textBox = document.getElementById('streamingTextBox');
                    const toggleIcon = document.getElementById('streamToggleIcon');
                    if (textBox && toggleIcon) {
                        textBox.style.display = 'none';
                        toggleIcon.textContent = '▶';
                    }
                }, 3000);
                
                break;
            }
            
            // Decode chunk and add to buffer
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            console.log(`📦 Received chunk: ${chunk.length} bytes`);
            
            // On first chunk, add a marker (don't clear - keep the connection status)
            if (isFirstChunk) {
                console.log('🎬 First chunk received! Adding header...');
                appendStreamingText('\n📡 RECEIVING SSE DATA:\n');
                appendStreamingText('─────────────────────────────\n');
                isFirstChunk = false;
            }
            
            // Show raw chunk in streaming text box
            console.log(`✍️ Appending chunk to display...`);
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
                        
                        // THEME EVENT - Show theme header immediately
                        if (data.type === 'theme') {
                            theme = data.theme;
                            totalSlides = data.totalSlides;
                            console.log(`🎨 Theme received: ${theme.name} (${totalSlides} slides)`);
                            
                            // Clear initial loading UI
                            previewContainer.innerHTML = '';
                            
                            // Cleanup progress indicators
                            if (window.cleanupPreviewProgress) {
                                window.cleanupPreviewProgress();
                            }
                            
                            // Show theme banner
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
                            previewContainer.appendChild(themeDiv);
                            
                            // Add progress counter
                            progressDiv = document.createElement('div');
                            progressDiv.id = 'slideProgress';
                            progressDiv.style.cssText = `
                                background: #e3f2fd;
                                padding: 1rem;
                                border-radius: 8px;
                                margin-bottom: 1rem;
                                text-align: center;
                                font-weight: bold;
                                color: #1976d2;
                                font-size: 1.1rem;
                            `;
                            progressDiv.innerHTML = `⏳ Generating ${totalSlides} slides... <span id="slideProgressCount">0/${totalSlides}</span>`;
                            previewContainer.appendChild(progressDiv);
                        }
                        
                        // SLIDE EVENT - Render slide immediately as it arrives!
                        else if (data.type === 'slide') {
                            slides.push(data.slide);
                            console.log(`📄 Slide ${data.current}/${data.total}: ${data.slide.title}`);
                            
                            // Update progress counter in real-time
                            const progressCount = document.getElementById('slideProgressCount');
                            if (progressCount) {
                                progressCount.textContent = `${data.current}/${data.total}`;
                            }
                            
                            // Mark step 5 as active when first slide arrives
                            if (data.current === 1) {
                                const step5 = document.getElementById('step5');
                                if (step5) {
                                    step5.style.opacity = '1';
                                    step5.style.color = '#667eea';
                                    step5.style.fontWeight = '600';
                                    step5.innerHTML = '✅ Rendering slide previews';
                                }
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

