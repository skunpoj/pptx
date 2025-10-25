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
 * Switches between list and gallery view modes
 * @param {string} view - View mode: 'list' or 'gallery'
 */
function switchView(view) {
    window.currentView = view;
    
    // Update button states
    const listBtn = document.getElementById('listViewBtn');
    const galleryBtn = document.getElementById('galleryViewBtn');
    
    if (view === 'list') {
        listBtn.classList.add('active');
        galleryBtn.classList.remove('active');
    } else {
        listBtn.classList.remove('active');
        galleryBtn.classList.add('active');
    }
    
    // Re-render preview with current slide data
    if (window.currentSlideData && window.displayPreview) {
        window.displayPreview(window.currentSlideData);
    }
}

/**
 * Scrolls to a specific slide in list view
 * @param {number} index - Slide index to scroll to
 */
function scrollToSlide(index) {
    // Switch to list view
    window.currentView = 'list';
    switchView('list');
    
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
// EXPORTS
// ========================================

window.showStatus = showStatus;
window.showProgress = showProgress;
window.hideProgress = hideProgress;
window.updateProgress = updateProgress;
window.switchView = switchView;
window.scrollToSlide = scrollToSlide;

