/**
 * Image Gallery Module
 * Handles AI image generation and gallery display
 */

// Global gallery state
window.imageGallery = {
    images: [],
    selectedImageId: null
};

/**
 * Extract image descriptions from slides
 */
function extractImageDescriptions(slideData) {
    if (!slideData || !slideData.slides) return [];
    
    const descriptions = [];
    slideData.slides.forEach((slide, index) => {
        if (slide.imageDescription) {
            descriptions.push({
                id: `slide-${index}`,
                slideIndex: index,
                description: slide.imageDescription,
                slideTitle: slide.title
            });
        }
    });
    
    return descriptions;
}

/**
 * Generate images for all slides with imageDescription
 */
async function generateImagesForSlides() {
    console.log('🖼️  Starting image generation...');
    
    const slideData = window.currentSlideData;
    if (!slideData) {
        alert('Please generate a slide preview first');
        return;
    }
    
    const descriptions = extractImageDescriptions(slideData);
    if (descriptions.length === 0) {
        alert('No image descriptions found in slides. Generate slides with images enabled first.');
        return;
    }
    
    console.log(`Found ${descriptions.length} image descriptions`);
    
    // Get the selected image generation provider
    const imageProvider = (typeof window.getImageProvider === 'function') 
        ? window.getImageProvider() 
        : 'dalle';
    
    console.log(`Using image provider: ${imageProvider}`);
    
    // Get the appropriate API key based on the image provider
    let apiKey = null;
    if (imageProvider === 'dalle' || imageProvider === 'openai') {
        // DALL-E uses OpenAI key
        apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('Please enter your OpenAI API key in Advanced Configuration section to use DALL-E 3');
            return;
        }
    } else if (imageProvider === 'stability') {
        // Stability AI uses its own key (check if we have a separate field, otherwise use openai)
        apiKey = localStorage.getItem('stability_api_key') || localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('Please enter your Stability AI API key in Advanced Configuration section');
            return;
        }
    } else if (imageProvider === 'gemini') {
        // Gemini uses Google API key
        apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert('Please enter your Google Gemini API key in Advanced Configuration section to use Imagen');
            return;
        }
    }
    
    // Show progress
    showImageGenerationProgress(descriptions.length);
    
    try {
        const response = await fetch('/api/images/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                descriptions: descriptions,
                apiKey: apiKey,
                provider: imageProvider // Uses selected provider (dalle/stability/gemini)
            })
        });
        
        if (!response.ok) {
            throw new Error(`Image generation failed: ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`✅ Generated ${result.success} images, ${result.failed} failed`);
        
        // Store generated images
        window.imageGallery.images = result.images.filter(img => !img.error);
        
        // Display in gallery
        displayImageGallery(window.imageGallery.images);
        
        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification(`✅ Generated ${result.success} images!`, 'success');
        }
        
    } catch (error) {
        console.error('Image generation error:', error);
        alert('Image generation failed: ' + error.message);
    } finally {
        hideImageGenerationProgress();
    }
}

/**
 * Show image generation progress
 */
function showImageGenerationProgress(count) {
    const galleryContainer = document.getElementById('imageGalleryContainer');
    if (!galleryContainer) return;
    
    galleryContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner" style="width: 60px; height: 60px; border: 4px solid #667eea; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite;"></div>
            <h3 style="margin-top: 1rem; color: #667eea;">Generating ${count} Images...</h3>
            <p style="color: #666; margin-top: 0.5rem;">This may take a few minutes</p>
        </div>
    `;
}

/**
 * Hide image generation progress
 */
function hideImageGenerationProgress() {
    // Gallery will be replaced with actual images
}

/**
 * Display images in gallery
 */
function displayImageGallery(images) {
    const galleryContainer = document.getElementById('imageGalleryContainer');
    if (!galleryContainer) {
        console.error('Gallery container not found');
        return;
    }
    
    if (!images || images.length === 0) {
        galleryContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🖼️</div>
                <h3>No Images Generated Yet</h3>
                <p style="margin-top: 0.5rem;">Generate slides with image descriptions, then click "Generate Images" to create them.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div style="padding: 1rem; background: linear-gradient(135deg, #667eea15, #764ba215); border-radius: 8px; margin-bottom: 1rem;">
            <h3 style="margin: 0 0 0.5rem 0; color: #667eea;">🎨 AI Generated Images</h3>
            <p style="margin: 0; font-size: 0.9rem; color: #666;">Click an image to select it for inserting into slides</p>
        </div>
        <div class="image-gallery-grid">
    `;
    
    images.forEach((image, index) => {
        const isSelected = window.imageGallery.selectedImageId === image.id;
        html += `
            <div class="gallery-image-card ${isSelected ? 'selected' : ''}" 
                 onclick="selectGalleryImage('${image.id}')"
                 style="cursor: pointer; border: 3px solid ${isSelected ? '#667eea' : '#ddd'}; border-radius: 8px; overflow: hidden; background: white; transition: all 0.3s ease;">
                <img src="${image.url}" 
                     alt="${image.description}" 
                     style="width: 100%; height: 200px; object-fit: cover;"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23999%22>Failed</text></svg>'">
                <div style="padding: 0.75rem;">
                    <div style="font-size: 0.8rem; color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">
                        Slide ${image.slideIndex + 1}: ${image.slideTitle || 'Untitled'}
                    </div>
                    <div style="font-size: 0.75rem; color: #666; line-height: 1.4; max-height: 3em; overflow: hidden; text-overflow: ellipsis;">
                        ${image.description}
                    </div>
                    ${isSelected ? `
                        <div style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #667eea; color: white; border-radius: 4px; text-align: center; font-size: 0.75rem; font-weight: 600;">
                            ✓ SELECTED
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    galleryContainer.innerHTML = html;
}

/**
 * Select an image from gallery
 */
function selectGalleryImage(imageId) {
    if (window.imageGallery.selectedImageId === imageId) {
        // Deselect if clicking the same image
        window.imageGallery.selectedImageId = null;
    } else {
        window.imageGallery.selectedImageId = imageId;
    }
    
    // Refresh gallery display
    displayImageGallery(window.imageGallery.images);
    
    console.log('Selected image:', imageId);
}

/**
 * Insert selected image into a slide
 */
function insertImageIntoSlide(slideIndex) {
    if (!window.imageGallery.selectedImageId) {
        alert('Please select an image from the gallery first');
        return;
    }
    
    const selectedImage = window.imageGallery.images.find(
        img => img.id === window.imageGallery.selectedImageId
    );
    
    if (!selectedImage) {
        alert('Selected image not found');
        return;
    }
    
    // Update the slide data with the image URL
    if (window.currentSlideData && window.currentSlideData.slides[slideIndex]) {
        window.currentSlideData.slides[slideIndex].imageUrl = selectedImage.url;
        window.currentSlideData.slides[slideIndex].imageDescription = selectedImage.description;
        
        // Refresh preview
        if (typeof displayPreview === 'function') {
            displayPreview(window.currentSlideData);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('✅ Image inserted into slide!', 'success');
        }
        
        console.log(`Image inserted into slide ${slideIndex}`);
    }
}

/**
 * Switch to gallery tab
 */
function showImageGallery() {
    // Switch tab view
    const previewContainer = document.getElementById('preview');
    const galleryContainer = document.getElementById('imageGalleryContainer');
    
    if (previewContainer) previewContainer.style.display = 'none';
    if (galleryContainer) {
        galleryContainer.style.display = 'block';
        
        // Display current images or empty state
        displayImageGallery(window.imageGallery.images);
    }
    
    // Update tab buttons
    document.querySelectorAll('.gallery-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('galleryTabBtn')?.classList.add('active');
}

/**
 * Switch to slides tab
 */
function showSlidesPreview() {
    const previewContainer = document.getElementById('preview');
    const galleryContainer = document.getElementById('imageGalleryContainer');
    
    if (previewContainer) previewContainer.style.display = 'block';
    if (galleryContainer) galleryContainer.style.display = 'none';
    
    // Update tab buttons
    document.querySelectorAll('.gallery-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById('slidesTabBtn')?.classList.add('active');
}

// Export functions
window.generateImagesForSlides = generateImagesForSlides;
window.showImageGallery = showImageGallery;
window.showSlidesPreview = showSlidesPreview;
window.selectGalleryImage = selectGalleryImage;
window.insertImageIntoSlide = insertImageIntoSlide;

// Add CSS for image gallery grid
if (!document.querySelector('#imageGalleryStyles')) {
    const style = document.createElement('style');
    style.id = 'imageGalleryStyles';
    style.textContent = `
        .image-gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
            padding: 0.5rem;
        }
        
        .gallery-image-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        }
        
        .gallery-image-card.selected {
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
        }
        
        .gallery-tab-btn {
            padding: 0.5rem 1rem;
            border: 2px solid #ddd;
            background: white;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .gallery-tab-btn:hover {
            background: #f0f4ff;
            border-color: #667eea;
        }
        
        .gallery-tab-btn.active {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border-color: #667eea;
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ imageGallery.js loaded');

