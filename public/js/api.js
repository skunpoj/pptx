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
    
    window.showProgress();
    window.updateProgress(10, 'step1');
    
    showStatus('🤖 AI is analyzing your content...', 'info');
    document.getElementById('preview').innerHTML = '<div style="text-align: center; padding: 2rem;"><span class="spinner" style="width: 2rem; height: 2rem; border-width: 3px;"></span><p style="margin-top: 1rem; color: #666;">AI is designing your slides...</p></div>';
    
    try {
        window.updateProgress(25, 'step1');
        
        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, apiKey, provider: window.currentProvider })
        });
        
        window.updateProgress(60, 'step2');
        
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
        
        window.updateProgress(80, 'step3');
        const slideData = await response.json();
        window.currentSlideData = slideData;
        
        // Handle theme selection
        let suggestedTheme = slideData.suggestedThemeKey || 'vibrant-purple';
        
        if (window.selectedTheme === 'extracted-custom' && window.colorThemes['extracted-custom']) {
            suggestedTheme = 'extracted-custom';
            window.currentSlideData.designTheme = {
                ...window.colorThemes['extracted-custom'],
                name: window.colorThemes['extracted-custom'].name,
                description: window.colorThemes['extracted-custom'].description
            };
        } else if (!window.selectedTheme && suggestedTheme && window.colorThemes[suggestedTheme]) {
            window.currentSlideData.designTheme = {
                ...window.colorThemes[suggestedTheme],
                name: window.colorThemes[suggestedTheme].name,
                description: window.colorThemes[suggestedTheme].description
            };
        }
        
        window.currentSlideData.suggestedTheme = suggestedTheme;
        
        window.displayThemeSelector(suggestedTheme);
        window.displayPreview(slideData);
        window.updateProgress(100, 'step4');
        
        setTimeout(() => {
            if (window.templateFile) {
                showStatus(`✅ Preview ready! Using ${window.templateFile.name} as template. Click "Generate PowerPoint" to create.`, 'success');
            } else {
                showStatus('✅ Preview ready! Choose a color theme above or click "Generate PowerPoint".', 'success');
            }
            window.hideProgress();
        }, 500);
        
    } catch (error) {
        console.error('Preview Error:', error);
        document.getElementById('preview').innerHTML = '';
        window.hideProgress();
        
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
    
    window.showProgress();
    window.updateProgress(10, 'step1');
    showStatus('📊 Generating your professional PowerPoint...', 'info');
    
    try {
        window.updateProgress(30, 'step2');
        
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
        
        window.updateProgress(70, 'step3');
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Generation failed');
        }
        
        window.updateProgress(90, 'step4');
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'AI-Presentation-Pro.pptx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        window.updateProgress(100, 'step4');
        
        setTimeout(() => {
            showStatus('✅ Professional presentation downloaded successfully!', 'success');
            window.hideProgress();
        }, 500);
    } catch (error) {
        console.error('Error:', error);
        window.hideProgress();
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

