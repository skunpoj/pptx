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
        <div style="text-align: center; padding: 2rem;">
            <span class="spinner" style="width: 2rem; height: 2rem; border-width: 3px;"></span>
            <p style="margin-top: 1rem; color: #666; font-size: 1.1rem; font-weight: 600;">AI is designing your slides...</p>
            <p style="margin-top: 0.5rem; color: #999; font-size: 0.9rem;">Slides will appear below as they're generated</p>
        </div>
        <div id="progressiveSlides"></div>
    `;
    
    // Show view toggle
    document.getElementById('viewToggle').style.display = 'flex';
    
    try {
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, apiKey, provider: window.currentProvider })
        });
        
        if (!response.ok) {
            let errorMessage = 'Preview generation failed';
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }
        
        const slideData = await response.json();
        window.currentSlideData = slideData;
        
        // Handle theme selection - prioritize user's pre-selected theme
        let suggestedTheme = slideData.suggestedThemeKey || 'vibrant-purple';
        let themeToUse = null;
        
        if (window.selectedTheme && window.colorThemes[window.selectedTheme]) {
            // User has already selected a theme - use it
            themeToUse = window.selectedTheme;
            window.currentSlideData.designTheme = {
                ...window.colorThemes[window.selectedTheme],
                name: window.colorThemes[window.selectedTheme].name,
                description: window.colorThemes[window.selectedTheme].description
            };
        } else if (suggestedTheme && window.colorThemes[suggestedTheme]) {
            // No pre-selection, use AI suggested theme
            themeToUse = suggestedTheme;
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
            themeToUse = 'vibrant-purple';
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
        
        if (window.templateFile) {
            showStatus(`✅ Preview ready! Using ${window.templateFile.name} as template. Click "Generate PowerPoint" to create.`, 'success');
        } else {
            showStatus('✅ Preview ready! Choose a color theme above or click "Generate PowerPoint".', 'success');
        }
        
    } catch (error) {
        console.error('Preview Error:', error);
        document.getElementById('preview').innerHTML = '';
        document.getElementById('viewToggle').style.display = 'none';
        
        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            showStatus('❌ Connection error. Make sure the server is running on http://localhost:3000', 'error');
        } else if (error.message.includes('401') || error.message.includes('authentication')) {
            showStatus('❌ Invalid API key. Please check and try again.', 'error');
        } else {
            showStatus('❌ Error: ' + error.message, 'error');
        }
    } finally {
        previewBtn.disabled = false;
        previewBtn.innerHTML = '👁️ Preview Slides';
    }
}

/**
 * Renders slides progressively with animation
 * @param {Object} slideData - Complete slide data
 */
async function renderSlidesProgressively(slideData) {
    const preview = document.getElementById('preview');
    const theme = slideData.designTheme;
    
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
    
    // Render each slide with delay for progressive effect
    for (let i = 0; i < slideData.slides.length; i++) {
        const slide = slideData.slides[i];
        
        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'opacity: 0; transform: translateY(20px); transition: all 0.3s ease;';
        placeholder.innerHTML = window.renderSlidePreviewCard(slide, i, theme);
        preview.appendChild(placeholder);
        
        // Animate in
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between slides
        placeholder.style.opacity = '1';
        placeholder.style.transform = 'translateY(0)';
    }
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
    
    try {
        let response;
        
        if (window.templateFile) {
            const formData = new FormData();
            formData.append('templateFile', window.templateFile);
            formData.append('text', text);
            formData.append('apiKey', apiKey);
            formData.append('provider', window.currentProvider);
            formData.append('slideData', JSON.stringify(window.currentSlideData));
            
            response = await fetch('/api/generate-with-template', {
                method: 'POST',
                body: formData
            });
        } else {
            response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text, apiKey, provider: window.currentProvider, slideData: window.currentSlideData })
            });
        }
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Generation failed');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AI-Presentation-Pro.pptx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showStatus('✅ Professional presentation downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('401') || error.message.includes('authentication')) {
            showStatus('❌ Invalid API key. Please check and try again.', 'error');
        } else {
            showStatus('❌ Error: ' + error.message, 'error');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✨ Generate PowerPoint';
    }
}

// Export functions
window.getApiKey = getApiKey;
window.generatePreview = generatePreview;
window.generatePresentation = generatePresentation;

