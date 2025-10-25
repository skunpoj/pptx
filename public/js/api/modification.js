// Slide modification functionality

/**
 * Modify current slide
 */
function modifyCurrentSlide() {
    if (!window.currentSlideData || !window.currentSlideData.slides) {
        alert('Please generate a preview first');
        return;
    }
    
    // Show modification modal for first slide (can be extended)
    showSlideModificationModal(window.currentSlideData.slides[0], 0);
}

/**
 * Show slide modification modal
 */
function showSlideModificationModal(slide, index) {
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'modificationModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.zIndex = '10000';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '8px';
    modalContent.style.padding = '2rem';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '800px';
    modalContent.style.maxHeight = '90%';
    modalContent.style.overflow = 'auto';
    modalContent.style.position = 'relative';
    
    // Create header
    const header = document.createElement('div');
    header.style.marginBottom = '1rem';
    
    const title = document.createElement('h3');
    title.textContent = `✏️ Modify Slide ${index + 1}`;
    title.style.margin = '0 0 0.5rem 0';
    title.style.color = '#333';
    header.appendChild(title);
    
    const description = document.createElement('p');
    description.textContent = 'Edit the slide content below:';
    description.style.margin = '0';
    description.style.color = '#666';
    header.appendChild(description);
    
    // Create form
    const form = document.createElement('form');
    form.id = 'slideModificationForm';
    
    // Title input
    const titleGroup = document.createElement('div');
    titleGroup.style.marginBottom = '1rem';
    
    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Slide Title:';
    titleLabel.style.display = 'block';
    titleLabel.style.marginBottom = '0.5rem';
    titleLabel.style.fontWeight = 'bold';
    titleLabel.style.color = '#333';
    titleGroup.appendChild(titleLabel);
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.id = 'slideTitle';
    titleInput.value = slide.title || '';
    titleInput.style.width = '100%';
    titleInput.style.padding = '0.75rem';
    titleInput.style.border = '1px solid #ddd';
    titleInput.style.borderRadius = '4px';
    titleInput.style.fontSize = '1rem';
    titleGroup.appendChild(titleInput);
    
    // Content textarea
    const contentGroup = document.createElement('div');
    contentGroup.style.marginBottom = '1rem';
    
    const contentLabel = document.createElement('label');
    contentLabel.textContent = 'Slide Content:';
    contentLabel.style.display = 'block';
    contentLabel.style.marginBottom = '0.5rem';
    contentLabel.style.fontWeight = 'bold';
    contentLabel.style.color = '#333';
    contentGroup.appendChild(contentLabel);
    
    const contentTextarea = document.createElement('textarea');
    contentTextarea.id = 'slideContent';
    contentTextarea.value = slide.content || '';
    contentTextarea.rows = 10;
    contentTextarea.style.width = '100%';
    contentTextarea.style.padding = '0.75rem';
    contentTextarea.style.border = '1px solid #ddd';
    contentTextarea.style.borderRadius = '4px';
    contentTextarea.style.fontSize = '1rem';
    contentTextarea.style.fontFamily = 'inherit';
    contentTextarea.style.resize = 'vertical';
    contentGroup.appendChild(contentTextarea);
    
    // Content points section
    const pointsGroup = document.createElement('div');
    pointsGroup.style.marginBottom = '1rem';
    
    const pointsLabel = document.createElement('label');
    pointsLabel.textContent = 'Content Points:';
    pointsLabel.style.display = 'block';
    pointsLabel.style.marginBottom = '0.5rem';
    pointsLabel.style.fontWeight = 'bold';
    pointsLabel.style.color = '#333';
    pointsGroup.appendChild(pointsLabel);
    
    const pointsContainer = document.createElement('div');
    pointsContainer.id = 'contentPoints';
    pointsContainer.style.border = '1px solid #ddd';
    pointsContainer.style.borderRadius = '4px';
    pointsContainer.style.padding = '0.75rem';
    pointsContainer.style.minHeight = '100px';
    pointsContainer.style.backgroundColor = '#f8f9fa';
    
    // Add existing points
    if (slide.points && slide.points.length > 0) {
        slide.points.forEach((point, i) => {
            addContentPoint(point, i);
        });
    } else {
        addContentPoint('', 0);
    }
    
    pointsGroup.appendChild(pointsContainer);
    
    const addPointBtn = document.createElement('button');
    addPointBtn.type = 'button';
    addPointBtn.textContent = '+ Add Point';
    addPointBtn.className = 'btn btn-secondary';
    addPointBtn.style.marginTop = '0.5rem';
    addPointBtn.onclick = addContentPoint;
    pointsGroup.appendChild(addPointBtn);
    
    // Buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = '0.5rem';
    buttonGroup.style.justifyContent = 'flex-end';
    buttonGroup.style.marginTop = '1rem';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.onclick = () => modal.remove();
    buttonGroup.appendChild(cancelBtn);
    
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save Changes';
    saveBtn.className = 'btn btn-primary';
    saveBtn.onclick = () => saveSlideModification(index);
    buttonGroup.appendChild(saveBtn);
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '1rem';
    closeBtn.style.right = '1rem';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '1.5rem';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.color = '#666';
    closeBtn.onclick = () => modal.remove();
    
    // Assemble form
    form.appendChild(titleGroup);
    form.appendChild(contentGroup);
    form.appendChild(pointsGroup);
    form.appendChild(buttonGroup);
    
    // Assemble modal
    modalContent.appendChild(closeBtn);
    modalContent.appendChild(header);
    modalContent.appendChild(form);
    modal.appendChild(modalContent);
    
    // Add to page
    document.body.appendChild(modal);
    
    // Store slide index
    window.currentModificationIndex = index;
}

/**
 * Add content point
 */
function addContentPoint(text = '', index = null) {
    const container = document.getElementById('contentPoints');
    if (!container) return;
    
    const pointDiv = document.createElement('div');
    pointDiv.className = 'content-point';
    pointDiv.style.display = 'flex';
    pointDiv.style.gap = '0.5rem';
    pointDiv.style.marginBottom = '0.5rem';
    pointDiv.style.alignItems = 'center';
    
    const pointInput = document.createElement('input');
    pointInput.type = 'text';
    pointInput.value = text;
    pointInput.placeholder = 'Enter content point...';
    pointInput.style.flex = '1';
    pointInput.style.padding = '0.5rem';
    pointInput.style.border = '1px solid #ddd';
    pointInput.style.borderRadius = '4px';
    pointInput.style.fontSize = '0.9rem';
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '✕';
    removeBtn.className = 'btn btn-danger';
    removeBtn.style.padding = '0.25rem 0.5rem';
    removeBtn.style.fontSize = '0.8rem';
    removeBtn.onclick = () => pointDiv.remove();
    
    pointDiv.appendChild(pointInput);
    pointDiv.appendChild(removeBtn);
    
    if (index !== null) {
        container.insertBefore(pointDiv, container.children[index]);
    } else {
        container.appendChild(pointDiv);
    }
}

/**
 * Save slide modification
 */
function saveSlideModification(slideIndex) {
    const title = document.getElementById('slideTitle').value;
    const content = document.getElementById('slideContent').value;
    
    // Collect content points
    const points = [];
    const pointInputs = document.querySelectorAll('#contentPoints .content-point input');
    pointInputs.forEach(input => {
        if (input.value.trim()) {
            points.push(input.value.trim());
        }
    });
    
    // Update slide data
    if (window.currentSlideData && window.currentSlideData.slides[slideIndex]) {
        window.currentSlideData.slides[slideIndex] = {
            ...window.currentSlideData.slides[slideIndex],
            title: title,
            content: content,
            points: points
        };
        
        // Close modal
        const modal = document.getElementById('modificationModal');
        if (modal) {
            modal.remove();
        }
        
        // Show success message
        showNotification('✅ Slide modified successfully!', 'success');
        
        // Refresh preview if visible
        if (document.getElementById('previewContainer')) {
            renderSlidesProgressively(window.currentSlideData);
        }
    }
}

/**
 * Escape HTML attributes
 */
function escapeHtmlAttribute(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Export functions for use in other modules
window.modifyCurrentSlide = modifyCurrentSlide;
window.showSlideModificationModal = showSlideModificationModal;
window.addContentPoint = addContentPoint;
window.saveSlideModification = saveSlideModification;
