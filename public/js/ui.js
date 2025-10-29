/**
 * UI State and Progress Management Module
 * Handles all UI state, status messages, and progress tracking
 */

// ========================================
// STATUS MESSAGES
// ========================================

/**
 * Displays a status message to the user
 * @param {string} message - Message to display
 * @param {string} type - Message type: 'info', 'success', or 'error'
 */
function showStatus(message, type) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status ${type}`;
}

// ========================================
// PROGRESS BAR MANAGEMENT
// ========================================

/**
 * Shows the progress bar container
 */
function showProgress() {
    document.getElementById('progressContainer').style.display = 'block';
    resetProgress();
}

/**
 * Hides the progress bar container
 */
function hideProgress() {
    document.getElementById('progressContainer').style.display = 'none';
}

/**
 * Resets progress bar to 0%
 */
function resetProgress() {
    updateProgress(0, '');
    document.querySelectorAll('.progress-step').forEach(step => {
        step.classList.remove('active', 'completed');
    });
}

/**
 * Updates progress bar percentage and active step
 * @param {number} percent - Progress percentage (0-100)
 * @param {string} stepId - ID of current step ('step1', 'step2', etc.)
 */
function updateProgress(percent, stepId) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    progressBar.style.width = percent + '%';
    progressText.textContent = Math.round(percent) + '%';
    
    if (stepId) {
        // Mark previous steps as completed, current as active
        const steps = ['step1', 'step2', 'step3', 'step4'];
        const currentIndex = steps.indexOf(stepId);
        
        steps.forEach((step, index) => {
            const element = document.getElementById(step);
            element.classList.remove('active', 'completed');
            
            if (index < currentIndex) {
                element.classList.add('completed');
            } else if (index === currentIndex) {
                element.classList.add('active');
            }
        });
    }
}

// ========================================
// VIEW MODE MANAGEMENT
// ========================================

/**
 * Switches to list view (legacy function kept for compatibility)
 * @param {string} view - View mode (always 'list' now)
 */
function switchView(view) {
    // Only list view is supported now
    window.currentView = 'list';
    
    // Re-render preview with current slide data if available
    // BUT: Skip if slides are already rendered (streaming or batch) - prevents double-render bug
    if (window.currentSlideData && window.displayPreview) {
        // Check if slidesContainer with rendered slides exists (both streaming and batch use this)
        const slidesContainer = document.getElementById('slidesContainer');
        const statusBar = document.getElementById('statusBar');
        
        if (slidesContainer && statusBar) {
            const slideElements = slidesContainer.querySelectorAll('.slide-preview');
            if (slideElements && slideElements.length > 0) {
                console.log('⚠️ switchView: Slides already rendered - skipping re-render to preserve content');
                console.log(`   Found ${slideElements.length} rendered slides`);
                return;
            }
        }
        
        window.displayPreview(window.currentSlideData);
    }
}

/**
 * Scrolls to a specific slide in list view
 * @param {number} index - Slide index to scroll to
 */
function scrollToSlide(index) {
    // Always use list view
    window.currentView = 'list';
    
    // Wait for render, then scroll
    setTimeout(() => {
        const slides = document.querySelectorAll('.slide-preview');
        if (slides[index]) {
            slides[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight temporarily
            slides[index].style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
            setTimeout(() => {
                slides[index].style.boxShadow = '';
            }, 2000);
        }
    }, 100);
}

// ========================================
// SETTINGS TAB MANAGEMENT
// ========================================

/**
 * Switches between API and Prompts settings tabs
 * @param {string} tab - Tab name: 'api' or 'prompts'
 */
function switchSettingsTab(tab) {
    // Update tab button styles
    document.querySelectorAll('.settings-tab').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = '#e0e7ff';
        btn.style.color = '#667eea';
    });
    
    const activeTab = document.getElementById(`tab-${tab}`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.style.background = '#667eea';
        activeTab.style.color = 'white';
    }
    
    // Show/hide content
    const apiContent = document.getElementById('apiSettingsContent');
    const promptsContent = document.getElementById('promptsSettingsContent');
    
    if (apiContent) apiContent.style.display = tab === 'api' ? 'block' : 'none';
    if (promptsContent) promptsContent.style.display = tab === 'prompts' ? 'block' : 'none';
    
    // Auto-load prompts when switching to prompts tab
    if (tab === 'prompts' && window.showPromptEditor) {
        window.showPromptEditor();
    }
}

// ========================================
// EXPORTS
// ========================================

window.showStatus = showStatus;
window.showProgress = showProgress;
window.hideProgress = hideProgress;
window.updateProgress = updateProgress;
// ========================================
// CHARACTER/WORD COUNT
// ========================================

/**
 * Updates character and word count for a textarea
 * @param {string} textareaId - ID of the textarea element
 * @param {string} counterId - ID of the counter display element
 */
function updateCharCount(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    
    if (textarea && counter) {
        const text = textarea.value;
        const charCount = text.length;
        const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        counter.textContent = `${charCount} characters / ${wordCount} words`;
    }
}

// Export functions
window.switchView = switchView;
window.scrollToSlide = scrollToSlide;
window.switchSettingsTab = switchSettingsTab;
window.updateCharCount = updateCharCount;

// Immediate diagnostic
console.log('✅ ui.js loaded - window.showStatus:', typeof window.showStatus);

