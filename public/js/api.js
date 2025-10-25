// API communication module

function getApiKey() {
    const currentProvider = window.currentProvider || 'anthropic';
    return localStorage.getItem(`${currentProvider}_api_key`);
}

async function generatePreview() {
    const text = document.getElementById('textInput').value.trim();
    const apiKey = getApiKey();
    
    if (!apiKey) {
        showStatus('⚠️ Please enter your API key first!', 'error');
        return;
    }
    
    if (!text) {
        showStatus('⚠️ Please enter some text!', 'error');
        return;
    }
    
    const previewBtn = document.getElementById('previewBtn');
    previewBtn.disabled = true;
    previewBtn.innerHTML = '<span class="spinner"></span> Generating preview...';
    
    // Show initial loading state in preview
    const preview = document.getElementById('preview');
    showStatus('🤖 AI is analyzing your content and designing slides...', 'info');
    preview.innerHTML = `
        <div id="streamingStatus" style="text-align: center; padding: 2rem;">
            <span class="spinner" style="width: 2rem; height: 2rem; border-width: 3px;"></span>
            <p style="margin-top: 1rem; color: #666; font-size: 1.1rem; font-weight: 600;">AI is designing your slides...</p>
            <p id="slideCount" style="margin-top: 0.5rem; color: #999; font-size: 0.9rem;">Waiting for slides...</p>
        </div>
    `;
    
    // Show view toggle
    document.getElementById('viewToggle').style.display = 'flex';
    
    try {
        const useStreaming = window.currentProvider === 'anthropic';
        
        if (useStreaming) {
            // STREAMING MODE: Handle incremental slide generation
            await handleStreamingPreview(text, apiKey);
        } else {
            // NON-STREAMING MODE: Traditional all-at-once generation
            await handleNonStreamingPreview(text, apiKey);
        }
        
    } catch (error) {
        console.error('Preview Error:', error);
        document.getElementById('preview').innerHTML = '';
        document.getElementById('viewToggle').style.display = 'none';
        document.getElementById('generatePptSection').style.display = 'none';
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            showStatus('❌ Connection error. Make sure the server is running on http://localhost:3000', 'error');
        } else if (error.message.includes('401') || error.message.includes('authentication')) {
            showStatus('❌ Invalid API key. Please check and try again.', 'error');
        } else {
            showStatus('❌ Error: ' + error.message, 'error');
        }
    } finally {
        previewBtn.disabled = false;
        previewBtn.innerHTML = '👁️ Generate Preview';
    }
}

/**
 * Handles streaming preview generation (incremental slides)
 */
async function handleStreamingPreview(text, apiKey) {
    const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, apiKey, provider: window.currentProvider, stream: true })
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
    
    preview.innerHTML = ''; // Clear loading message
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                    const message = JSON.parse(data);
                    
                    if (message.type === 'slide') {
                        // New slide received!
                        receivedSlides.push(message.slide);
                        if (message.theme) themeData = message.theme;
                        if (message.suggestedThemeKey) suggestedThemeKey = message.suggestedThemeKey;
                        
                        // Update theme if first slide
                        if (receivedSlides.length === 1 && themeData) {
                            const theme = window.colorThemes[suggestedThemeKey] || themeData;
                            preview.innerHTML = `
                                <div style="background: #f0f4ff; padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${theme.colorPrimary};">
                                    <strong style="color: ${theme.colorPrimary};">🎨 ${theme.name}</strong>
                                    <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: #666;">${theme.description}</p>
                                </div>
                            `;
                        }
                        
                        // Render the new slide
                        const theme = window.colorThemes[suggestedThemeKey] || themeData || window.colorThemes['vibrant-purple'];
                        const slideHtml = window.renderSlidePreviewCard(message.slide, message.index, theme);
                        
                        const slideDiv = document.createElement('div');
                        slideDiv.style.cssText = 'opacity: 0; transform: translateY(20px); transition: all 0.3s ease;';
                        slideDiv.innerHTML = slideHtml;
                        preview.appendChild(slideDiv);
                        
                        // Animate in
                        setTimeout(() => {
                            slideDiv.style.opacity = '1';
                            slideDiv.style.transform = 'translateY(0)';
                        }, 50);
                        
                        console.log(`✓ Received and rendered slide ${receivedSlides.length}: ${message.slide.title}`);
                        
                    } else if (message.type === 'complete') {
                        // All slides received
                        window.currentSlideData = message.data;
                        
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
                        
                        if (window.templateFile) {
                            showStatus(`✅ ${receivedSlides.length} slides ready! Using ${window.templateFile.name} as template.`, 'success');
                        } else {
                            showStatus(`✅ ${receivedSlides.length} slides ready! You can modify slides or generate PowerPoint.`, 'success');
                        }
                        
                        console.log('✅ Streaming complete:', receivedSlides.length, 'slides');
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }
}

/**
 * Handles non-streaming preview generation (all-at-once)
 */
async function handleNonStreamingPreview(text, apiKey) {
    const response = await fetch('/api/preview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, apiKey, provider: window.currentProvider, stream: false })
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
    
    // Update theme selector to show AI suggestion (if different from user's choice)
    if (window.displayThemeSelector) {
        window.displayThemeSelector(suggestedTheme);
    }
    
    // Render slides progressively with animation
    await renderSlidesProgressively(window.currentSlideData);
    
    // Show modification section and generate button
    document.getElementById('modificationSection').style.display = 'block';
    document.getElementById('generatePptSection').style.display = 'block';
    
    if (window.templateFile) {
        showStatus(`✅ Preview ready! Using ${window.templateFile.name} as template.`, 'success');
    } else {
        showStatus('✅ Preview ready! You can modify slides or generate PowerPoint.', 'success');
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
        showStatus('⚠️ Please enter your API key first!', 'error');
        return;
    }
    
    if (!text) {
        showStatus('⚠️ Please enter some text!', 'error');
        return;
    }
    
    if (!window.currentSlideData) {
        await generatePreview();
        if (!window.currentSlideData) return;
    }
    
    const btn = document.getElementById('generateBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creating PowerPoint...';
    
    showStatus('📊 Generating your professional PowerPoint...', 'info');
    
    console.log('🚀 Starting PowerPoint generation...');
    console.log('  Provider:', window.currentProvider);
    console.log('  Slides:', window.currentSlideData.slides.length);
    console.log('  Template:', window.templateFile ? window.templateFile.name : 'None');
    
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
        
        console.log('  Downloading PowerPoint file...');
        const blob = await response.blob();
        console.log('  File size:', (blob.size / 1024).toFixed(2), 'KB');
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AI-Presentation-Pro.pptx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        console.log('✅ PowerPoint generation complete!');
        showStatus('✅ Professional presentation downloaded successfully!', 'success');
    } catch (error) {
        console.error('❌ PowerPoint generation error:', error);
        
        if (error.message.startsWith('AUTHENTICATION_ERROR:')) {
            const cleanMessage = error.message.replace('AUTHENTICATION_ERROR: ', '');
            showStatus('❌ Authentication Error: ' + cleanMessage, 'error');
        } else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            showStatus('❌ Connection error. Please check your server is running.', 'error');
        } else {
            showStatus('❌ Generation Error: ' + error.message, 'error');
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
        showStatus('⚠️ Please enter modification instructions!', 'error');
        return;
    }
    
    if (!window.currentSlideData || !window.currentSlideData.slides) {
        showStatus('⚠️ No slides to modify! Generate preview first.', 'error');
        return;
    }
    
    if (!apiKey) {
        showStatus('⚠️ Please enter your API key first!', 'error');
        return;
    }
    
    const modifyBtn = document.getElementById('modifyBtn');
    const originalBtnText = modifyBtn.innerHTML;
    modifyBtn.disabled = true;
    modifyBtn.innerHTML = '<span class="spinner"></span> Applying changes...';
    
    showStatus('🔄 AI is modifying your slides...', 'info');
    
    try {
        // Create modification prompt
        const currentSlidesJSON = JSON.stringify(window.currentSlideData.slides, null, 2);
        
        const systemPrompt = `You are a presentation editor AI. You will receive:
1. Current slide data in JSON format
2. User's modification request

Your task: Modify the slides according to the user's request and return the COMPLETE updated slides array in the SAME JSON format.

RULES:
- Maintain the same JSON structure
- If modifying a specific slide, keep all other slides unchanged
- If adding/removing slides, update accordingly
- Always return valid JSON
- Keep all fields (title, subtitle, content, layout, type, etc.)
- Preserve chart data if present

Current slides (${window.currentSlideData.slides.length} total):
${currentSlidesJSON}

User's modification request: "${modificationPrompt}"

Return ONLY the updated slides array in JSON format (same structure as above).`;

        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                text: systemPrompt, 
                apiKey, 
                provider: window.currentProvider,
                stream: false 
            })
        });
        
        if (!response.ok) {
            throw new Error(`Modification failed: ${response.status}`);
        }
        
        const modifiedData = await response.json();
        
        // Update current slide data
        window.currentSlideData.slides = modifiedData.slides;
        
        // Re-render preview
        displayPreview(window.currentSlideData);
        
        // Clear modification prompt
        document.getElementById('modificationPrompt').value = '';
        
        showStatus(`✅ Slides modified successfully! ${modifiedData.slides.length} slides total.`, 'success');
        
    } catch (error) {
        console.error('Modification Error:', error);
        showStatus('❌ Error modifying slides: ' + error.message, 'error');
    } finally {
        modifyBtn.disabled = false;
        modifyBtn.innerHTML = originalBtnText;
    }
}

// Export functions
window.getApiKey = getApiKey;
window.generatePreview = generatePreview;
window.generatePresentation = generatePresentation;
window.modifySlides = modifySlides;

