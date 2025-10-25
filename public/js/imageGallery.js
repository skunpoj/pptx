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
    
    console.log(`📋 Found ${descriptions.length} image descriptions`);
    
    // Get the selected image generation provider
    const imageProvider = (typeof window.getImageProvider === 'function') 
        ? window.getImageProvider() 
        : 'huggingface';
    
    console.log(`🎨 Using image provider: ${imageProvider}`);
    
    // Get the appropriate API key based on the image provider
    let apiKey = null;
    if (imageProvider === 'huggingface') {
        // Hugging Face uses its own token
        apiKey = localStorage.getItem('huggingface_api_key');
        if (!apiKey) {
            alert('❌ Please enter your Hugging Face API token in Advanced Configuration section\n\n🎁 FREE API - Get yours now!\n\nSteps:\n1. Go to huggingface.co/join (create free account)\n2. Navigate to Settings → Access Tokens\n3. Create a new token with "Read" access\n4. Click "Advanced Configuration" here\n5. Scroll to "🤗 Hugging Face API" section\n6. Paste your token and click "Save Key"\n\nHugging Face offers FREE unlimited image generation!');
            return;
        }
        console.log(`✅ Hugging Face API token found (length: ${apiKey.length})`);
    } else if (imageProvider === 'dalle' || imageProvider === 'openai') {
        // DALL-E uses OpenAI key
        apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
            alert('❌ Please enter your OpenAI API key in Advanced Configuration section to use DALL-E 3\n\nSteps:\n1. Click "Advanced Configuration"\n2. Select "OpenAI" provider\n3. Enter your API key\n4. Click "Save Key"');
            return;
        }
        console.log(`✅ OpenAI API key found (length: ${apiKey.length})`);
    } else if (imageProvider === 'stability') {
        // Stability AI uses its own key
        apiKey = localStorage.getItem('stability_api_key');
        if (!apiKey) {
            alert('❌ Please enter your Stability AI API key in Advanced Configuration section\n\nSteps:\n1. Click "Advanced Configuration"\n2. Scroll down to "Stability AI API" section\n3. Enter your API key\n4. Click "Save Key"');
            return;
        }
        console.log(`✅ Stability AI API key found (length: ${apiKey.length})`);
    } else if (imageProvider === 'gemini') {
        // Gemini uses Google API key
        apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert('❌ Please enter your Google Gemini API key in Advanced Configuration section to use Imagen\n\nSteps:\n1. Click "Advanced Configuration"\n2. Select "Gemini" provider\n3. Enter your API key\n4. Click "Save Key"');
            return;
        }
        console.log(`✅ Gemini API key found (length: ${apiKey.length})`);
    }
    
    // Validate API key format
    if (apiKey) {
        if (imageProvider === 'huggingface' && !apiKey.startsWith('hf_')) {
            console.warn('⚠️  Hugging Face API token should start with "hf_"');
        } else if (imageProvider === 'dalle' && !apiKey.startsWith('sk-')) {
            console.warn('⚠️  OpenAI API key should start with "sk-"');
        } else if (imageProvider === 'gemini' && !apiKey.startsWith('AIza')) {
            console.warn('⚠️  Gemini API key should start with "AIza"');
        }
    }
    
    // Show progress
    showImageGenerationProgress(descriptions.length);
    
    // Switch to gallery tab to show progress
    const galleryTabBtn = document.getElementById('galleryTabBtn');
    if (galleryTabBtn && typeof window.showImageGallery === 'function') {
        window.showImageGallery();
    }
    
    // Simulate progress updates while waiting for API
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
        if (simulatedProgress < descriptions.length) {
            simulatedProgress++;
            const fakeDesc = descriptions[simulatedProgress - 1]?.description || 'Generating image...';
            updateImageGenerationProgress(simulatedProgress, descriptions.length, fakeDesc);
        }
    }, 15000); // Update every 15 seconds (approximate time per image)
    
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
        
        // Clear simulated progress
        clearInterval(progressInterval);
        
        // Update progress one final time with actual count
        updateImageGenerationProgress(result.success, descriptions.length, '✨ Complete!');
        
        // Log detailed errors for debugging
        if (result.failed > 0) {
            console.group('❌ Image Generation Errors:');
            result.images.filter(img => img.error).forEach(img => {
                console.error(`  Slide "${img.description.substring(0, 50)}...": ${img.error}`);
            });
            console.groupEnd();
        }
        
        // Store generated images (including errors for display)
        window.imageGallery.images = result.images.filter(img => !img.error);
        const failedImages = result.images.filter(img => img.error);
        
        // AUTO-INSERT IMAGES INTO SLIDES
        console.log('📥 Auto-inserting images into slides...');
        let insertedCount = 0;
        window.imageGallery.images.forEach(img => {
            if (img.slideIndex !== undefined && window.currentSlideData && window.currentSlideData.slides[img.slideIndex]) {
                window.currentSlideData.slides[img.slideIndex].imageUrl = img.url;
                window.currentSlideData.slides[img.slideIndex].imageDescription = img.description;
                insertedCount++;
                console.log(`  ✓ Inserted image into slide ${img.slideIndex + 1}: ${img.slideTitle}`);
            }
        });
        
        // Refresh preview to show images
        if (insertedCount > 0 && typeof displayPreview === 'function') {
            displayPreview(window.currentSlideData);
            console.log(`✅ Auto-inserted ${insertedCount} images into slides`);
        }
        
        // Display in gallery
        displayImageGallery(window.imageGallery.images);
        
        // Show notification with details
        if (typeof showNotification === 'function') {
            if (result.success > 0) {
                showNotification(`✅ Generated ${result.success} images and inserted into slides!`, 'success');
            } else {
                // All failed - show detailed error
                const firstError = failedImages[0]?.error || 'Unknown error';
                showNotification(`❌ All images failed: ${firstError}`, 'error');
            }
        }
        
        // Show detailed error summary if some/all failed
        if (result.failed > 0) {
            const errorSummary = failedImages.map(img => `• ${img.error}`).join('\n');
            console.error('Image generation errors:\n', errorSummary);
            
            // If all failed, show alert with first error
            if (result.success === 0) {
                setTimeout(() => {
                    alert(`Image generation failed for all ${result.failed} images.\n\nFirst error: ${failedImages[0]?.error}\n\nCheck console for full details.`);
                }, 500);
            }
        }
        
    } catch (error) {
        console.error('Image generation error:', error);
        
        // Clear progress interval on error
        clearInterval(progressInterval);
        
        alert('Image generation failed: ' + error.message);
    } finally {
        hideImageGenerationProgress();
    }
}

/**
 * Show image generation progress with real-time updates
 */
function showImageGenerationProgress(count) {
    const galleryContainer = document.getElementById('imageGalleryContainer');
    if (!galleryContainer) return;
    
    galleryContainer.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <div class="spinner" style="width: 60px; height: 60px; border: 4px solid #667eea; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite;"></div>
            <h3 style="margin-top: 1rem; color: #667eea;">🎨 Generating ${count} Images...</h3>
            <div id="imageGenProgress" style="margin-top: 1rem; padding: 1rem; background: #f0f4ff; border-radius: 8px; max-width: 400px; margin-left: auto; margin-right: auto;">
                <div style="font-size: 1.2rem; font-weight: bold; color: #667eea; margin-bottom: 0.5rem;">
                    <span id="imageGenCurrent">0</span> / ${count}
                </div>
                <div style="width: 100%; height: 8px; background: #e0e7ff; border-radius: 4px; overflow: hidden;">
                    <div id="imageGenBar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s ease;"></div>
                </div>
                <div id="imageGenStatus" style="margin-top: 0.75rem; font-size: 0.9rem; color: #666;">
                    🔄 Starting image generation...
                </div>
            </div>
            <p style="color: #999; margin-top: 1rem; font-size: 0.85rem;">
                💡 Using ${window.currentImageProvider || 'Hugging Face'} • Each image takes 10-30 seconds
            </p>
        </div>
    `;
    
    // Show notification
    if (typeof showNotification === 'function') {
        showNotification(`🎨 Generating ${count} images...`, 'info');
    }
}

/**
 * Update progress during generation
 */
function updateImageGenerationProgress(current, total, description) {
    const currentEl = document.getElementById('imageGenCurrent');
    const barEl = document.getElementById('imageGenBar');
    const statusEl = document.getElementById('imageGenStatus');
    
    if (currentEl) currentEl.textContent = current;
    if (barEl) barEl.style.width = `${(current / total) * 100}%`;
    if (statusEl && description) {
        statusEl.innerHTML = `✨ ${description.substring(0, 60)}...`;
    }
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
window.updateImageGenerationProgress = updateImageGenerationProgress;

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

