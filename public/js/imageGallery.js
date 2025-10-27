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
    
    try {
        const response = await fetch('/api/images/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                descriptions: descriptions,
                apiKey: apiKey,
                provider: imageProvider,
                stream: true // Enable streaming!
            })
        });
        
        if (!response.ok) {
            throw new Error(`Image generation failed: ${response.status}`);
        }
        
        // Check if streaming response
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/event-stream')) {
            console.log('📡 Receiving REAL-TIME streaming images...');
            
            // Handle streaming response - images appear ONE BY ONE!
            await handleImageStream(response, descriptions.length);
            
        } else {
            // Fallback: non-streaming response
            console.log('📋 Receiving non-streaming response...');
            const result = await response.json();
            
            handleNonStreamingResult(result);
        }
        
    } catch (error) {
        console.error('Image generation error:', error);
        alert('Image generation failed: ' + error.message);
    } finally {
        // Cleanup is handled in stream handler
    }
}

/**
 * Handle streaming image generation - display images as they arrive!
 */
async function handleImageStream(response, totalCount) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';
    let successCount = 0;
    let failedCount = 0;
    const generatedImages = [];
    const failedImages = [];
    
    // Initialize gallery with loading placeholders
    initializeGalleryWithPlaceholders(totalCount);
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('📡 Image stream closed');
                break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const jsonStr = line.substring(5).trim();
                    
                    if (jsonStr === '[DONE]') {
                        console.log('✅ Received [DONE] marker');
                        continue;
                    }
                    
                    try {
                        const data = JSON.parse(jsonStr);
                        
                        // IMAGE EVENT - Display immediately!
                        if (data.type === 'image') {
                            successCount++;
                            const img = data.image;
                            generatedImages.push(img);
                            
                            console.log(`🖼️  [${data.current}/${data.total}] Image received: ${img.slideTitle}`);
                            
                            // Display this image in gallery RIGHT NOW
                            displayImageInGallery(img, data.current - 1, totalCount);
                            
                            // Insert into slide data RIGHT NOW
                            insertImageIntoSlideData(img);
                            
                            // Update the slide preview RIGHT NOW
                            updateSingleSlidePreview(img);
                            
                            // Update progress counter
                            updateImageGenerationProgress(data.current, data.total, `✅ ${img.slideTitle}`);
                        }
                        
                        // ERROR EVENT
                        else if (data.type === 'error') {
                            failedCount++;
                            failedImages.push(data.error);
                            
                            console.error(`❌ [${data.current}/${data.total}] Failed: ${data.error.error}`);
                            
                            // Display error card in gallery
                            displayErrorInGallery(data.error, data.current - 1, totalCount);
                            
                            // Update progress
                            updateImageGenerationProgress(data.current, data.total, `❌ Failed: ${data.error.error.substring(0, 40)}...`);
                        }
                        
                        // COMPLETE EVENT
                        else if (data.type === 'complete') {
                            console.log(`✅ Stream complete: ${data.success} success, ${data.failed} failed`);
                        }
                        
                    } catch (parseError) {
                        console.warn('⚠️  Failed to parse event:', jsonStr.substring(0, 100));
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }
    
    // Store results
    window.imageGallery.images = generatedImages;
    
    // Show final notification
    if (typeof showNotification === 'function') {
        if (successCount > 0) {
            showNotification(`✅ Generated ${successCount} images and inserted into slides!`, 'success');
        } else {
            showNotification(`❌ All images failed to generate`, 'error');
        }
    }
    
    // Log errors
    if (failedCount > 0) {
        console.group('❌ Image Generation Errors:');
        failedImages.forEach(err => {
            console.error(`  ${err.description.substring(0, 50)}...: ${err.error}`);
        });
        console.groupEnd();
    }
    
    // Don't auto-switch tabs - let user stay where they are
    // User can manually switch to Slides tab to see images
    console.log('✅ Image generation complete - check Slides tab to see images!');
}

/**
 * Handle non-streaming result (fallback)
 */
function handleNonStreamingResult(result) {
    console.log(`✅ Generated ${result.success} images, ${result.failed} failed`);
    
    // Log detailed errors for debugging
    if (result.failed > 0) {
        console.group('❌ Image Generation Errors:');
        result.images.filter(img => img.error).forEach(img => {
            console.error(`  Slide "${img.description.substring(0, 50)}...": ${img.error}`);
        });
        console.groupEnd();
    }
    
    // Store generated images
    window.imageGallery.images = result.images.filter(img => !img.error);
    const failedImages = result.images.filter(img => img.error);
    
    // Insert all images at once
    insertAllImages(window.imageGallery.images);
    
    // Display in gallery
    displayImageGallery(window.imageGallery.images);
    
    // Show notification
    if (typeof showNotification === 'function') {
        if (result.success > 0) {
            showNotification(`✅ Generated ${result.success} images and inserted into slides!`, 'success');
        } else {
            const firstError = failedImages[0]?.error || 'Unknown error';
            showNotification(`❌ All images failed: ${firstError}`, 'error');
        }
    }
    
    // Don't auto-switch tabs - let user stay where they are
    console.log('✅ Image generation complete - check Slides tab to see images!');
}

/**
 * Insert image into slide data immediately
 */
function insertImageIntoSlideData(img) {
    if (img.slideIndex !== undefined && window.currentSlideData && window.currentSlideData.slides[img.slideIndex]) {
        const slide = window.currentSlideData.slides[img.slideIndex];
        
        // Insert image URL and description
        slide.imageUrl = img.url;
        slide.imageDescription = img.description;
        
        console.log(`  ✅ Inserted into slide data: Slide ${img.slideIndex + 1}`);
        console.log(`     URL: ${img.url.substring(0, 50)}...`);
    }
}

/**
 * Insert all images at once (for non-streaming)
 */
function insertAllImages(images) {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('📥 AUTO-INSERTING IMAGES INTO SLIDES');
    console.log('═══════════════════════════════════════════════');
    
    let insertedCount = 0;
    images.forEach(img => {
        if (img.slideIndex !== undefined && window.currentSlideData && window.currentSlideData.slides[img.slideIndex]) {
            const slide = window.currentSlideData.slides[img.slideIndex];
            
            slide.imageUrl = img.url;
            slide.imageDescription = img.description;
            insertedCount++;
            
            console.log(`  ✓ Slide ${img.slideIndex + 1}: "${img.slideTitle}"`);
            console.log(`    - Image URL: ${img.url.substring(0, 50)}...`);
            console.log(`    - Status: ✅ INSERTED INTO SLIDE DATA`);
        }
    });
    
    console.log('');
    console.log(`✅ Total images inserted: ${insertedCount} / ${images.length}`);
    console.log('═══════════════════════════════════════════════');
    console.log('');
    
    // Update all slides with images
    if (insertedCount > 0) {
        updateSlidesWithImages(images);
    }
}

/**
 * Update a single slide preview with its image (as soon as it's generated)
 */
function updateSingleSlidePreview(img) {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) return;
    
    const slideElements = previewContainer.querySelectorAll('.slide-preview');
    const slideElement = slideElements[img.slideIndex];
    
    if (!slideElement) {
        console.warn(`Could not find slide element ${img.slideIndex + 1}`);
        return;
    }
    
    const theme = window.currentSlideData?.designTheme || {};
    
    // Find and replace the image placeholder
    const imagePlaceholderDiv = slideElement.querySelector('[style*="dashed"]');
    
    if (imagePlaceholderDiv) {
        const imageHtml = `
            <div style="margin-top: 1rem; text-align: center;">
                <img src="${img.url}" 
                     alt="${img.description}" 
                     style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeIn 0.5s ease;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <div style="display: none; background: #f0f4ff; border: 2px dashed ${theme.colorAccent || '#667eea'}; padding: 1rem; border-radius: 8px; color: #666;">
                    🖼️ Image failed to load
                </div>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imageHtml;
        const newImageElement = tempDiv.firstElementChild;
        
        imagePlaceholderDiv.replaceWith(newImageElement);
        
        console.log(`  📄 Updated slide ${img.slideIndex + 1} preview with image (REAL-TIME!)`);
        
        // Fade-in animation
        newImageElement.style.opacity = '0';
        setTimeout(() => {
            newImageElement.style.transition = 'opacity 0.5s ease';
            newImageElement.style.opacity = '1';
        }, 50);
    }
}

/**
 * Initialize gallery with loading placeholders for each image
 */
function initializeGalleryWithPlaceholders(count) {
    const galleryGrid = document.getElementById('imageGalleryGrid');
    if (!galleryGrid) {
        console.warn('Gallery grid not found');
        return;
    }
    
    // Clear grid and add placeholder cards
    galleryGrid.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'gallery-image-card loading';
        placeholder.id = `gallery-placeholder-${i}`;
        placeholder.style.cssText = `
            border: 2px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            background: white;
            min-height: 280px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        `;
        
        placeholder.innerHTML = `
            <div class="spinner" style="width: 40px; height: 40px; border: 3px solid #667eea; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite;"></div>
            <div style="margin-top: 1rem; font-size: 0.9rem; color: #999; font-weight: 600;">
                ⏳ Waiting ${i + 1}...
            </div>
        `;
        
        galleryGrid.appendChild(placeholder);
    }
    
    console.log(`🎨 Initialized ${count} placeholder cards in gallery`);
}

/**
 * Display a single image in gallery as it arrives (REAL-TIME!)
 */
function displayImageInGallery(img, index, total) {
    const placeholder = document.getElementById(`gallery-placeholder-${index}`);
    if (!placeholder) {
        console.warn(`Could not find placeholder ${index}`);
        return;
    }
    
    // Replace placeholder with actual image card
    const imageCard = `
        <div style="cursor: pointer; border: 3px solid #2ecc71; border-radius: 8px; overflow: hidden; background: white; animation: slideIn 0.5s ease;">
            <div style="position: relative;">
                <img src="${img.url}" 
                     alt="${img.description}" 
                     style="width: 100%; height: 200px; object-fit: cover;"
                     onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><rect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/><text x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 fill=%22%23999%22>Failed</text></svg>'">
                <div style="position: absolute; top: 5px; right: 5px; background: #2ecc71; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold;">
                    ✓ NEW
                </div>
            </div>
            <div style="padding: 0.75rem;">
                <div style="font-size: 0.8rem; color: #667eea; font-weight: 600; margin-bottom: 0.25rem;">
                    Slide ${img.slideIndex + 1}: ${img.slideTitle || 'Untitled'}
                </div>
                <div style="font-size: 0.75rem; color: #666; line-height: 1.4; max-height: 3em; overflow: hidden; text-overflow: ellipsis;">
                    ${img.description}
                </div>
                <div style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #2ecc71; color: white; border-radius: 4px; text-align: center; font-size: 0.75rem; font-weight: 600;">
                    ✓ GENERATED
                </div>
            </div>
        </div>
    `;
    
    placeholder.outerHTML = imageCard;
    
    console.log(`  🎨 Displayed in gallery: Image ${index + 1}`);
}

/**
 * Display error card in gallery
 */
function displayErrorInGallery(error, index, total) {
    const placeholder = document.getElementById(`gallery-placeholder-${index}`);
    if (!placeholder) return;
    
    const errorCard = `
        <div style="border: 2px solid #e74c3c; border-radius: 8px; overflow: hidden; background: #fff5f5;">
            <div style="padding: 1rem; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">⚠️</div>
                <div style="font-size: 0.8rem; color: #e74c3c; font-weight: 600; margin-bottom: 0.5rem;">
                    Slide ${error.slideIndex + 1}: Failed
                </div>
                <div style="font-size: 0.75rem; color: #666; line-height: 1.4;">
                    ${error.error}
                </div>
            </div>
        </div>
    `;
    
    placeholder.outerHTML = errorCard;
}

/**
 * Show image generation progress header with real-time counter
 */
function showImageGenerationProgress(count) {
    const galleryContainer = document.getElementById('imageGalleryContainer');
    if (!galleryContainer) return;
    
    galleryContainer.innerHTML = `
        <div id="imageGenHeader" style="padding: 1rem; background: linear-gradient(135deg, #FF9900, #232F3E); border-radius: 8px; margin-bottom: 1rem; color: white; text-align: center;">
            <h3 style="margin: 0 0 0.5rem 0; color: white;">🤖 AWS Bedrock Nova Canvas - Auto Image Generation</h3>
            <div style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem;">
                <span id="imageGenCurrent">0</span> / ${count}
            </div>
            <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.3); border-radius: 5px; overflow: hidden; margin-bottom: 0.5rem;">
                <div id="imageGenBar" style="width: 0%; height: 100%; background: #2ecc71; transition: width 0.3s ease;"></div>
            </div>
            <div id="imageGenStatus" style="font-size: 0.9rem; opacity: 0.95;">
                🔄 Preparing AWS Bedrock image generation...
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.85rem; opacity: 0.9;">
                ⚡ Using AWS Bedrock Nova Canvas v1.0 • Images appear below as they're generated
            </div>
        </div>
        <div class="image-gallery-grid" id="imageGalleryGrid">
            <!-- Placeholder cards will be added here -->
        </div>
    `;
    
    // Show notification
    if (typeof showNotification === 'function') {
        showNotification(`🤖 Auto-generating ${count} images with AWS Bedrock Nova Canvas...`, 'info');
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
    
    const selectedImage = images.find(img => img.id === window.imageGallery.selectedImageId);
    
    let html = `
        <div style="padding: 1rem; background: linear-gradient(135deg, #667eea15, #764ba215); border-radius: 8px; margin-bottom: 1rem;">
            <h3 style="margin: 0 0 0.5rem 0; color: #667eea;">🎨 AI Generated Images</h3>
            <p style="margin: 0; font-size: 0.9rem; color: #666;">Click an image to select it for regeneration or editing</p>
        </div>
    `;
    
    // Show regenerate controls if image selected
    if (selectedImage) {
        html += `
            <div style="background: #fff8e1; border: 2px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong style="color: #f57c00;">🔄 Regenerate Selected Image</strong>
                    <button onclick="window.imageGallery.selectedImageId = null; displayImageGallery(window.imageGallery.images);" 
                            style="padding: 0.25rem 0.5rem; background: #999; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                        Cancel
                    </button>
                </div>
                <div style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">
                    Slide ${selectedImage.slideIndex + 1}: ${selectedImage.slideTitle}
                </div>
                <textarea id="regeneratePrompt" 
                          style="width: 100%; height: 80px; padding: 0.5rem; border: 1px solid #ffc107; border-radius: 4px; font-size: 0.9rem; resize: vertical; font-family: inherit;"
                          placeholder="Edit the image description...">${selectedImage.description}</textarea>
                <button onclick="window.regenerateSelectedImage()" 
                        class="btn-primary" 
                        style="width: 100%; margin-top: 0.5rem; padding: 0.75rem; font-size: 1rem;">
                    ✨ Regenerate Image
                </button>
            </div>
        `;
    }
    
    html += `<div class="image-gallery-grid">`;
    
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
                            ✓ SELECTED - Click Regenerate Above
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

/**
 * Update only the slides that have new images (preserves scroll position)
 */
function updateSlidesWithImages(generatedImages) {
    const previewContainer = document.getElementById('preview');
    if (!previewContainer) {
        console.warn('Preview container not found');
        return;
    }
    
    const slideElements = previewContainer.querySelectorAll('.slide-preview');
    if (!slideElements || slideElements.length === 0) {
        console.warn('No slide elements found in preview');
        return;
    }
    
    const theme = window.currentSlideData?.designTheme || {};
    
    generatedImages.forEach(img => {
        const slideIndex = img.slideIndex;
        const slide = window.currentSlideData?.slides[slideIndex];
        const slideElement = slideElements[slideIndex];
        
        if (!slide || !slideElement) {
            console.warn(`Could not find slide ${slideIndex + 1} to update`);
            return;
        }
        
        // Find and replace the image placeholder section
        const imagePlaceholderDiv = slideElement.querySelector('[style*="dashed"]');
        
        if (imagePlaceholderDiv) {
            // Replace placeholder with actual image
            const imageHtml = `
                <div style="margin-top: 1rem; text-align: center;">
                    <img src="${img.url}" 
                         alt="${img.description}" 
                         style="max-width: 100%; max-height: 300px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeIn 0.5s ease;"
                         onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div style="display: none; background: #f0f4ff; border: 2px dashed ${theme.colorAccent || '#667eea'}; padding: 1rem; border-radius: 8px; color: #666;">
                        🖼️ Image failed to load
                    </div>
                </div>
            `;
            
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = imageHtml;
            const newImageElement = tempDiv.firstElementChild;
            
            // Replace the placeholder with actual image
            imagePlaceholderDiv.replaceWith(newImageElement);
            
            console.log(`  ✓ Updated slide ${slideIndex + 1} preview with actual image`);
            
            // Add fade-in animation
            newImageElement.style.opacity = '0';
            setTimeout(() => {
                newImageElement.style.transition = 'opacity 0.5s ease';
                newImageElement.style.opacity = '1';
            }, 50);
        } else {
            console.log(`  ℹ️  Slide ${slideIndex + 1} has no placeholder to replace (may already have image)`);
        }
    });
    
    // Add fadeIn animation if not exists
    if (!document.querySelector('#fadeInAnimation')) {
        const style = document.createElement('style');
        style.id = 'fadeInAnimation';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Verify that images are inserted into slide data (for debugging)
 */
function verifyImagesInSlideData() {
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('🔍 IMAGE INSERTION VERIFICATION');
    console.log('═══════════════════════════════════════════════');
    
    if (!window.currentSlideData) {
        console.log('❌ No slide data available');
        return false;
    }
    
    let hasImages = 0;
    let hasPlaceholders = 0;
    let noImages = 0;
    
    console.log('📊 Checking all slides:');
    console.log('');
    
    window.currentSlideData.slides.forEach((slide, idx) => {
        if (slide.imageUrl) {
            hasImages++;
            console.log(`✅ Slide ${idx + 1}: "${slide.title}"`);
            console.log(`   - Has imageUrl: ${slide.imageUrl.substring(0, 60)}...`);
            console.log(`   - Image type: ${slide.imageUrl.startsWith('data:') ? 'Base64 embedded' : 'External URL'}`);
            console.log(`   - Will be in PowerPoint: YES ✓`);
            console.log('');
        } else if (slide.imageDescription) {
            hasPlaceholders++;
            console.log(`⏳ Slide ${idx + 1}: "${slide.title}"`);
            console.log(`   - Has description only: ${slide.imageDescription.substring(0, 60)}...`);
            console.log(`   - Will show placeholder box in PowerPoint`);
            console.log('');
        } else {
            noImages++;
        }
    });
    
    console.log('═══════════════════════════════════════════════');
    console.log('📈 SUMMARY:');
    console.log(`   • Slides with ACTUAL images: ${hasImages} ✅`);
    console.log(`   • Slides with placeholders: ${hasPlaceholders} ⏳`);
    console.log(`   • Slides without images: ${noImages}`);
    console.log('═══════════════════════════════════════════════');
    console.log('');
    
    if (hasImages > 0) {
        console.log('✅ VERIFIED: Images ARE in slide data and WILL be in PowerPoint!');
        console.log('   When you generate PowerPoint, server will log:');
        console.log('   "✅ Images will be embedded in PowerPoint!"');
    } else {
        console.log('⚠️  No images with URLs found. Generate images first!');
    }
    
    console.log('');
    return hasImages > 0;
}

/**
 * Check if auto image generation is enabled
 */
function isAutoImageGenEnabled() {
    const checkbox = document.getElementById('autoImageGenCheckbox');
    return checkbox ? checkbox.checked : true; // Default to true if checkbox not found
}

/**
 * Toggle auto image generation UI
 */
function toggleAutoImageGen() {
    const checkbox = document.getElementById('autoImageGenCheckbox');
    const manualBtn = document.getElementById('manualGenerateBtn');
    
    if (!checkbox || !manualBtn) {
        console.warn('⚠️ Checkbox or manual button not found');
        return;
    }
    
    if (checkbox.checked) {
        // Auto-gen enabled - hide manual button
        manualBtn.style.display = 'none';
        console.log('✅ Auto image generation enabled - manual button hidden');
    } else {
        // Auto-gen disabled - show manual button
        manualBtn.style.display = 'inline-block';
        console.log('⏸️ Auto image generation disabled - manual button shown');
    }
}

/**
 * Initialize auto image generation UI on page load
 */
function initAutoImageGenUI() {
    // Set initial state based on checkbox
    toggleAutoImageGen();
}

// Initialize on page load
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        initAutoImageGenUI();
    });
}

/**
 * Automatically generate images for slides with image descriptions
 * Uses AWS Bedrock Nova Canvas
 */
async function autoGenerateImagesForSlides() {
    console.log('🖼️  Auto-generating images with AWS Bedrock Nova Canvas...');
    
    const slideData = window.currentSlideData;
    if (!slideData) {
        console.log('No slide data available');
        return;
    }
    
    const descriptions = extractImageDescriptions(slideData);
    if (descriptions.length === 0) {
        console.log('No image descriptions found in slides');
        return;
    }
    
    console.log(`📋 Found ${descriptions.length} image descriptions - auto-generating...`);
    
    // Show progress
    showImageGenerationProgress(descriptions.length);
    
    // DON'T switch to gallery tab - let user stay on slides tab to see images appear
    // const galleryTabBtn = document.getElementById('galleryTabBtn');
    // if (galleryTabBtn && typeof window.showImageGallery === 'function') {
    //     window.showImageGallery();
    // }
    
    try {
        const response = await fetch('/api/images/auto-generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slideData: slideData,
                stream: true // Enable streaming!
            })
        });
        
        if (!response.ok) {
            throw new Error(`Auto-generation failed: ${response.status}`);
        }
        
        // Check if streaming response
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('text/event-stream')) {
            console.log('📡 Receiving REAL-TIME streaming images from AWS Bedrock...');
            
            // Handle streaming response - images appear ONE BY ONE!
            await handleImageStream(response, descriptions.length);
            
        } else {
            // Fallback: non-streaming response
            console.log('📋 Receiving non-streaming response...');
            const result = await response.json();
            
            handleNonStreamingResult(result);
        }
        
    } catch (error) {
        console.error('Auto image generation error:', error);
        if (typeof showNotification === 'function') {
            showNotification('⚠️ Auto image generation failed: ' + error.message, 'warning');
        }
    }
}

/**
 * Regenerate a selected image with edited prompt
 */
async function regenerateSelectedImage() {
    const selectedImage = window.imageGallery.images.find(
        img => img.id === window.imageGallery.selectedImageId
    );
    
    if (!selectedImage) {
        alert('No image selected');
        return;
    }
    
    const promptTextarea = document.getElementById('regeneratePrompt');
    const newPrompt = promptTextarea ? promptTextarea.value.trim() : selectedImage.description;
    
    if (!newPrompt) {
        alert('Please enter a description');
        return;
    }
    
    console.log(`🔄 Regenerating image for slide ${selectedImage.slideIndex + 1}`);
    console.log(`   Old prompt: ${selectedImage.description}`);
    console.log(`   New prompt: ${newPrompt}`);
    
    // Show loading state
    const regenerateBtn = event.target;
    const originalText = regenerateBtn.textContent;
    regenerateBtn.textContent = '🔄 Regenerating...';
    regenerateBtn.disabled = true;
    
    try {
        const response = await fetch('/api/images/auto-generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                slideData: {
                    slides: [{
                        title: selectedImage.slideTitle,
                        imageDescription: newPrompt
                    }]
                },
                stream: false // Single image, no streaming needed
            })
        });
        
        if (!response.ok) {
            throw new Error(`Regeneration failed: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.images && result.images.length > 0) {
            const newImage = result.images[0];
            
            if (newImage.error) {
                throw new Error(newImage.error);
            }
            
            // Update the image in gallery
            const imageIndex = window.imageGallery.images.findIndex(
                img => img.id === selectedImage.id
            );
            
            if (imageIndex !== -1) {
                window.imageGallery.images[imageIndex] = {
                    ...selectedImage,
                    url: newImage.url,
                    description: newPrompt,
                    timestamp: Date.now()
                };
                
                // Update slide data
                if (window.currentSlideData && 
                    window.currentSlideData.slides[selectedImage.slideIndex]) {
                    window.currentSlideData.slides[selectedImage.slideIndex].imageUrl = newImage.url;
                    window.currentSlideData.slides[selectedImage.slideIndex].imageDescription = newPrompt;
                }
                
                // Refresh gallery display
                displayImageGallery(window.imageGallery.images);
                
                // Update slide preview
                updateSingleSlidePreview({
                    ...newImage,
                    slideIndex: selectedImage.slideIndex,
                    slideTitle: selectedImage.slideTitle
                });
                
                if (typeof showNotification === 'function') {
                    showNotification('✅ Image regenerated successfully!', 'success');
                }
                
                console.log('✅ Image regenerated and updated');
            }
        }
        
    } catch (error) {
        console.error('Regeneration error:', error);
        alert('Failed to regenerate image: ' + error.message);
    } finally {
        regenerateBtn.textContent = originalText;
        regenerateBtn.disabled = false;
    }
}

// Export functions
window.generateImagesForSlides = generateImagesForSlides;
window.autoGenerateImagesForSlides = autoGenerateImagesForSlides;
window.regenerateSelectedImage = regenerateSelectedImage;
window.isAutoImageGenEnabled = isAutoImageGenEnabled;
window.toggleAutoImageGen = toggleAutoImageGen;
window.initAutoImageGenUI = initAutoImageGenUI;
window.showImageGallery = showImageGallery;
window.showSlidesPreview = showSlidesPreview;
window.selectGalleryImage = selectGalleryImage;
window.insertImageIntoSlide = insertImageIntoSlide;
window.updateImageGenerationProgress = updateImageGenerationProgress;
window.updateSlidesWithImages = updateSlidesWithImages;
window.verifyImagesInSlideData = verifyImagesInSlideData;

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
        
        .gallery-image-card {
            transition: all 0.3s ease;
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
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.95);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ imageGallery.js loaded');

