/**
 * File Upload and Processing Module
 * Handles file uploads, color extraction, and template management
 */

// ========================================
// FILE READING
// ========================================

/**
 * Reads a file as text
 * @param {File} file - File object from input
 * @returns {Promise<string>} - File content as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Reads an image file as Data URL
 * @param {File} file - Image file object
 * @returns {Promise<string>} - Data URL of the image
 */
function readImageAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error('Failed to read image'));
        reader.readAsDataURL(file);
    });
}

/**
 * Checks if a file is an image
 * @param {File} file - File to check
 * @returns {boolean} - True if file is an image
 */
function isImageFile(file) {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    return imageTypes.includes(file.type) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name);
}

/**
 * Generates a text description for an uploaded image
 * @param {File} file - Image file
 * @returns {string} - Description text for content generation
 */
function generateImageDescription(file) {
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const cleanName = fileName.replace(/[-_]/g, ' '); // Replace dashes/underscores with spaces
    
    return `[IMAGE: ${cleanName}]\nDescription: A visual representation related to "${cleanName}". This image should be placed on an appropriate slide based on the content context.`;
}

// Global storage for uploaded images
window.uploadedImages = [];

/**
 * Matches uploaded images to slides based on content similarity
 * @param {Array} slides - Array of slide objects
 * @param {Array} images - Array of uploaded image objects
 * @returns {Array} - Slides with matched images
 */
function matchImagesToSlides(slides, images) {
    if (!images || images.length === 0) return slides;
    
    const updatedSlides = slides.map(slide => ({ ...slide }));
    const usedImageIndices = new Set();
    
    // First pass: Try to match images based on filename keywords
    images.forEach((image, imageIndex) => {
        if (usedImageIndices.has(imageIndex)) return;
        
        // Extract keywords from image filename
        const imageKeywords = image.filename
            .toLowerCase()
            .replace(/\.[^/.]+$/, "") // Remove extension
            .replace(/[-_]/g, ' ') // Replace dashes/underscores
            .split(' ')
            .filter(word => word.length > 2); // Only meaningful words
        
        // Find best matching slide
        let bestMatch = { slideIndex: -1, score: 0 };
        
        updatedSlides.forEach((slide, slideIndex) => {
            if (slide.imageUrl || slide.type === 'title') return; // Skip if already has image or is title
            
            const slideText = (slide.title + ' ' + (slide.content?.join(' ') || '')).toLowerCase();
            let matchScore = 0;
            
            imageKeywords.forEach(keyword => {
                if (slideText.includes(keyword)) {
                    matchScore += 2; // Strong match
                } else if (slideText.split(' ').some(word => word.includes(keyword) || keyword.includes(word))) {
                    matchScore += 1; // Partial match
                }
            });
            
            if (matchScore > bestMatch.score) {
                bestMatch = { slideIndex, score: matchScore };
            }
        });
        
        // If found a good match, assign image to slide
        if (bestMatch.score > 0 && bestMatch.slideIndex >= 0) {
            updatedSlides[bestMatch.slideIndex].imageUrl = image.dataURL;
            updatedSlides[bestMatch.slideIndex].imageFilename = image.filename;
            usedImageIndices.add(imageIndex);
        }
    });
    
    // Second pass: Distribute remaining images to slides without images
    const remainingImages = images.filter((_, index) => !usedImageIndices.has(index));
    if (remainingImages.length > 0) {
        const slidesWithoutImages = updatedSlides
            .map((slide, index) => ({ slide, index }))
            .filter(({ slide }) => !slide.imageUrl && slide.type !== 'title');
        
        remainingImages.forEach((image, i) => {
            if (i < slidesWithoutImages.length) {
                const slideIndex = slidesWithoutImages[i].index;
                updatedSlides[slideIndex].imageUrl = image.dataURL;
                updatedSlides[slideIndex].imageFilename = image.filename;
            }
        });
    }
    
    return updatedSlides;
}

window.matchImagesToSlides = matchImagesToSlides;

// ========================================
// COLOR EXTRACTION
// ========================================

/**
 * Extracts color theme from uploaded files
 * @param {FileList} files - Files from file input
 * @returns {Promise<Object|null>} - Extracted theme or null
 */
async function extractColorsFromFiles(files) {
    try {
        // Send files to backend for color extraction
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }
        
        const response = await fetch('/api/extract-colors', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            console.warn('Color extraction failed, using default theme');
            return null;
        }
        
        let result;
        try {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Expected JSON from color extraction but got:', text.substring(0, 500));
                return null;
            }
            result = await response.json();
        } catch (e) {
            console.error('Failed to parse color extraction response:', e);
            return null;
        }
        
        if (result.theme) {
            // Add extracted theme to global colorThemes
            window.colorThemes['extracted-custom'] = {
                name: result.theme.name || 'Custom from Files',
                description: result.theme.description || 'Extracted from your uploaded files',
                colorPrimary: result.theme.colorPrimary,
                colorSecondary: result.theme.colorSecondary,
                colorAccent: result.theme.colorAccent,
                colorBackground: result.theme.colorBackground || '#FFFFFF',
                colorText: result.theme.colorText || '#1d1d1d',
                category: ['custom', 'extracted'],
                isExtracted: true
            };
            
            // Set as selected theme
            window.selectedTheme = 'extracted-custom';
            
            return window.colorThemes['extracted-custom'];
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting colors:', error);
        return null;
    }
}

// ========================================
// CONTENT GENERATION FROM FILES
// ========================================

/**
 * Generates presentation content from prompt and/or uploaded files
 * Main orchestrator function for content expansion
 * 
 * Parameters sent to backend:
 * - numSlides: Controls how many slides the AI generates
 * - numImagesToGenerate: Controls how many image placeholders AI adds to content
 * - generateImages: Whether to include image descriptions at all
 */
async function generateFromPrompt() {
    const prompt = document.getElementById('ideaInput').value.trim();
    const numSlides = parseInt(document.getElementById('numSlides').value) || 6;
    const generateImages = document.getElementById('generateImages').checked;
    const numImagesToGenerate = parseInt(document.getElementById('numImagesToGenerate')?.value) || 3;
    const extractColors = document.getElementById('extractColors').checked;
    const useAsTemplate = document.getElementById('useAsTemplate').checked;
    const apiKey = window.getApiKey();
    const fileInput = document.getElementById('fileUpload');
    const files = fileInput.files;
    
    console.log(`📊 Generation parameters: ${numSlides} slides, ${numImagesToGenerate} images, generateImages: ${generateImages}`);
    
    // Validation
    if (!apiKey) {
        console.log('ℹ️ No API key configured, using default backend provider');
    }
    
    if (!prompt && files.length === 0) {
        window.showStatus('⚠️ Please enter an idea or attach files!', 'error');
        return;
    }
    
    // UI state
    const promptBtn = document.getElementById('promptBtn');
    promptBtn.disabled = true;
    promptBtn.innerHTML = '<span class="spinner"></span> Expanding idea...';
    window.showStatus('🤖 AI is expanding your idea into detailed content...', 'info');
    
    const textInput = document.getElementById('textInput');
    
    try {
        let finalPrompt = prompt;
        let extractedColors = null;
        let fileContentForTextarea = ''; // Content to show in textarea
        
        // Process uploaded files
        if (files.length > 0) {
            // Handle template mode
            if (useAsTemplate) {
                const pptxFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pptx'));
                if (pptxFiles.length > 0) {
                    window.templateFile = pptxFiles[0];
                    window.showStatus(`📄 Using ${window.templateFile.name} as template...`, 'info');
                } else {
                    window.showStatus('⚠️ No PPTX file found. Please upload a PowerPoint file to use as template.', 'error');
                    promptBtn.disabled = false;
                    promptBtn.innerHTML = '🚀 Expand Idea into Full Content';
                    return;
                }
            }
            
            // Extract colors if requested
            if (extractColors) {
                window.showStatus('🎨 Extracting color theme from files...', 'info');
                extractedColors = await extractColorsFromFiles(files);
                if (extractedColors) {
                    // Display and auto-select the extracted theme
                    if (window.displayThemeSelector) {
                        window.displayThemeSelector('extracted-custom');
                    }
                    if (window.selectTheme) {
                        window.selectTheme('extracted-custom');
                    }
                    window.showStatus(`✅ Color theme extracted and auto-selected: ${extractedColors.name}`, 'success');
                }
            }
            
            // Read file contents - separate images from text files
            const fileContents = [];
            const imageFiles = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                if (isImageFile(file)) {
                    // Handle image files - store them and generate description
                    const imageDataURL = await readImageAsDataURL(file);
                    const imageDescription = generateImageDescription(file);
                    
                    imageFiles.push({
                        filename: file.name,
                        dataURL: imageDataURL,
                        description: imageDescription
                    });
                    
                    fileContents.push({
                        filename: file.name,
                        content: imageDescription,
                        isImage: true
                    });
                } else {
                    // Handle text files normally
                    const text = await readFileAsText(file);
                    fileContents.push({
                        filename: file.name,
                        content: text,
                        isImage: false
                    });
                }
            }
            
            // Store uploaded images globally for slide generation
            window.uploadedImages = imageFiles;
            
            // Combine file contents with prompt - this goes to AI
            let combinedFilesForAI = '';
            fileContents.forEach(file => {
                if (file.isImage) {
                    combinedFilesForAI += `\n\n=== Image File: ${file.filename} ===\n\n${file.content}`;
                } else {
                    combinedFilesForAI += `\n\n=== File: ${file.filename} ===\n\n${file.content}`;
                }
            });
            
            // Also prepare file content to show in textarea (for user visibility)
            fileContents.forEach(file => {
                fileContentForTextarea += `\n\n=== Content from: ${file.filename} ===\n\n${file.content}`;
            });
            
            // Build the prompt for AI (includes file content)
            finalPrompt = prompt 
                ? `${prompt}\n\nUse the following file content as the base for generating detailed presentation content:\n${combinedFilesForAI}`
                : `Analyze and convert the following files into detailed, well-structured presentation content with ${numSlides} slides:\n${combinedFilesForAI}`;
            
            // Show file content in the presentation content textarea immediately
            // This ensures users see what content is being used
            if (fileContentForTextarea) {
                textInput.value = `📎 Uploaded File Content:\n${fileContentForTextarea}\n\n⏳ AI is now expanding this into detailed presentation content...`;
            }
        } else {
            // No files - clear the textarea
            textInput.value = '';
        }
        
        // Call API with streaming or non-streaming based on provider
        // Pass ALL checkbox selections to the function
        const apiCallParams = {
            finalPrompt,
            apiKey,
            numSlides,
            generateImages,
            numImagesToGenerate,
            extractColors,
            useAsTemplate,
            files: Array.from(files),
            textInput
        };
        
        console.log('═══════════════════════════════════════════════════');
        console.log('🔍 PROVIDER SELECTION CHECK');
        console.log('  window.currentProvider:', window.currentProvider);
        console.log('  Is Anthropic?', window.currentProvider === 'anthropic');
        console.log('  Is Bedrock?', window.currentProvider === 'bedrock');
        console.log('  Files count:', files.length);
        console.log('  Will use streaming?', true); // All providers now support streaming
        console.log('═══════════════════════════════════════════════════');
        
        if (true) { // All providers now support streaming
            console.log(`📡 Using streaming content generation (${window.currentProvider})`);
            console.log('  Options:', {
                numSlides, 
                generateImages, 
                extractColors, 
                useAsTemplate, 
                filesCount: files.length
            });
            await streamContentGeneration(apiCallParams);
        } else {
            console.log('📋 Using non-streaming content generation');
            console.log('  Provider:', window.currentProvider);
            console.log('  Reason: Provider does not support streaming');
            await nonStreamingContentGeneration(apiCallParams);
        }
        
        window.showStatus('✅ Content expanded successfully! Review it below, then click "Preview Slides" to see the design.', 'success');
        textInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
    } catch (error) {
        console.error('Error:', error);
        if (error.message.includes('401') || error.message.includes('authentication')) {
            window.showStatus('❌ Invalid API key. Please check and try again.', 'error');
        } else {
            window.showStatus('❌ Error: ' + error.message, 'error');
        }
    } finally {
        promptBtn.disabled = false;
        promptBtn.innerHTML = '🚀 Expand Idea into Full Content';
    }
}

/**
 * Streaming content generation (Anthropic only)
 * @param {object} params - All parameters including prompt, apiKey, numSlides, etc.
 */
async function streamContentGeneration({ finalPrompt, apiKey, numSlides, generateImages, numImagesToGenerate, extractColors, useAsTemplate, files, textInput }) {
    console.log('═══════════════════════════════════════════════════');
    console.log('🚀 CLIENT: Starting streaming content generation');
    console.log('  Provider:', window.currentProvider);
    console.log('  Stream enabled:', true);
    console.log('  Options:', { 
        numSlides, 
        generateImages, 
        extractColors, 
        useAsTemplate, 
        numImagesToGenerate,
        filesCount: files?.length || 0 
    });
    console.log('  Prompt length:', finalPrompt?.length || 0, 'characters');
    console.log('  API Key present:', !!apiKey);
    console.log('  Textarea element:', textInput?.id || 'NOT FOUND');
    console.log('  Textarea exists:', !!textInput);
    console.log('  Textarea type:', typeof textInput);
    console.log('═══════════════════════════════════════════════════');
    
    // Build request body with ALL parameters
    const requestBody = { 
        prompt: finalPrompt,
        apiKey, 
        provider: window.currentProvider,
        numSlides,
        generateImages,
        numImagesToGenerate,
        extractColors,
        useAsTemplate,
        stream: true
    };
    
    // Handle file uploads if present
    let formData = null;
    if (files && files.length > 0) {
        formData = new FormData();
        formData.append('prompt', finalPrompt);
        formData.append('apiKey', apiKey);
        formData.append('provider', window.currentProvider);
        formData.append('numSlides', numSlides);
        formData.append('generateImages', generateImages);
        formData.append('numImagesToGenerate', numImagesToGenerate);
        formData.append('extractColors', extractColors);
        formData.append('useAsTemplate', useAsTemplate);
        formData.append('stream', 'true');
        
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
    }
    
    console.log('📤 CLIENT: Sending request to /api/generate-content');
    console.log('  Method: POST');
    console.log('  Has files:', !!files && files.length > 0);
    console.log('  Request body type:', formData ? 'FormData' : 'JSON');
    console.log('  textInput element passed:', !!textInput, 'type:', typeof textInput);
    
    const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: files && files.length > 0 ? {} : { 'Content-Type': 'application/json' },
        body: formData || JSON.stringify(requestBody)
    });
    
    const contentType = response.headers.get('content-type');
    console.log('📨 CLIENT: Response received');
    console.log('  Status:', response.status, response.statusText);
    console.log('  Content-Type:', contentType);
    console.log('  Headers:', {
        'content-type': contentType,
        'cache-control': response.headers.get('cache-control'),
        'connection': response.headers.get('connection')
    });
    
    if (!response.ok) {
        let errorMessage = 'Content generation failed';
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } else {
                const text = await response.text();
                console.error('Non-JSON streaming error response:', text.substring(0, 500));
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
        } catch (e) {
            errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    
    if (!response.body) {
        console.error('❌ CLIENT: Response.body is null! Cannot read stream.');
        throw new Error('Response body is null - server did not send streaming response');
    }
    
    console.log('📖 CLIENT: Response body found, getting reader...');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let chunkCount = 0;
    let lineCount = 0;
    let dataEventCount = 0;
    let buffer = ''; // Buffer for incomplete lines
    
    console.log('📖 CLIENT: Starting to read stream chunks...');
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                console.log('═══════════════════════════════════════════════════');
                console.log('✅ CLIENT: Stream complete!');
                console.log('  Total chunks received:', chunkCount);
                console.log('  Total data events:', dataEventCount);
                console.log('  Final content length:', content.length, 'characters');
                console.log('  Lines processed:', lineCount);
                console.log('═══════════════════════════════════════════════════');
                break;
            }
            
            chunkCount++;
            const chunk = decoder.decode(value, { stream: true });
            console.log(`📦 CLIENT: Chunk ${chunkCount}: ${chunk.length} bytes`);
            
            // Add chunk to buffer and process complete lines
            buffer += chunk;
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer
            
            lineCount += lines.length;
            
            for (const line of lines) {
                // Skip empty lines
                if (!line.trim()) continue;
                
                console.log(`  🔍 CLIENT: Processing line (${line.length} chars): "${line.substring(0, 60)}${line.length > 60 ? '...' : ''}"`);
                
                // Handle both 'data:' and 'data: ' formats
                if (line.startsWith('data:')) {
                    const jsonStr = line.substring(5).trim();
                    console.log(`  📝 CLIENT: Extracted JSON string: "${jsonStr.substring(0, 60)}${jsonStr.length > 60 ? '...' : ''}"`);
                    
                    if (jsonStr === '[DONE]') {
                        console.log('✅ CLIENT: Received [DONE] marker');
                        continue;
                    }
                    
                    dataEventCount++;
                    console.log(`  📥 CLIENT: Data event ${dataEventCount}: "${jsonStr.substring(0, 50)}${jsonStr.length > 50 ? '...' : ''}"`);
                    
                    try {
                        const parsed = JSON.parse(jsonStr);
                        console.log(`  📊 CLIENT: Parsed JSON, keys:`, Object.keys(parsed));
                        
                        if (parsed.text) {
                            content += parsed.text;
                            console.log(`  📝 CLIENT: Content updated, total length now: ${content.length}`);
                            console.log(`  🔍 CLIENT: textInput check - exists: ${!!textInput}, type: ${typeof textInput}`);
                            
                            if (textInput && typeof textInput.value !== 'undefined') {
                                textInput.value = content;
                                textInput.scrollTop = textInput.scrollHeight;
                                console.log(`  ✍️ CLIENT: Updated textarea! Total chars: ${content.length}, last text: "${parsed.text.substring(0, 30)}..."`);
                                console.log(`  ✅ CLIENT: textarea.value.length after update: ${textInput.value.length}`);
                            } else {
                                console.error('  ❌ CLIENT: textInput element is null or invalid!', {
                                    textInput,
                                    hasValue: typeof textInput?.value !== 'undefined'
                                });
                            }
                        } else {
                            console.warn(`  ⚠️ CLIENT: No 'text' field in parsed data. Fields:`, Object.keys(parsed));
                        }
                    } catch (e) {
                        console.error('  ❌ CLIENT: Failed to parse SSE JSON:', e.message);
                        console.error('  Data:', line.substring(0, 200));
                    }
                }
            }
        }
    } catch (streamError) {
        console.error('❌ CLIENT: Stream reading error:', streamError);
        throw streamError;
    }
    
    console.log('✅ CLIENT: Streaming content generation complete');
}

/**
 * Non-streaming content generation (all providers)
 * @param {object} params - All parameters including prompt, apiKey, numSlides, etc.
 */
async function nonStreamingContentGeneration({ finalPrompt, apiKey, numSlides, generateImages, numImagesToGenerate, extractColors, useAsTemplate, files, textInput }) {
    console.log('📋 Non-streaming content generation');
    console.log('  Options:', { numSlides, generateImages, extractColors, useAsTemplate, filesCount: files?.length || 0 });
    
    // Build request body with ALL parameters
    const requestBody = { 
        prompt: finalPrompt,
        apiKey, 
        provider: window.currentProvider,
        numSlides,
        generateImages,
        numImagesToGenerate,
        extractColors,
        useAsTemplate,
        stream: false
    };
    
    // Handle file uploads if present
    let formData = null;
    if (files && files.length > 0) {
        formData = new FormData();
        formData.append('prompt', finalPrompt);
        formData.append('apiKey', apiKey);
        formData.append('provider', window.currentProvider);
        formData.append('numSlides', numSlides);
        formData.append('generateImages', generateImages);
        formData.append('numImagesToGenerate', numImagesToGenerate);
        formData.append('extractColors', extractColors);
        formData.append('useAsTemplate', useAsTemplate);
        formData.append('stream', 'false');
        
        Array.from(files).forEach(file => {
            formData.append('files', file);
        });
    }
    
    const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: files && files.length > 0 ? {} : { 'Content-Type': 'application/json' },
        body: formData || JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
        let errorMessage = 'Content generation failed';
        try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } else {
                const text = await response.text();
                console.error('Non-JSON error response:', text.substring(0, 500));
                errorMessage = `Server error: ${response.status} ${response.statusText}`;
            }
        } catch (e) {
            errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
    }
    
    let result;
    try {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Expected JSON but got:', text.substring(0, 500));
            throw new Error('Server returned invalid response (not JSON)');
        }
        result = await response.json();
    } catch (e) {
        if (e.message.includes('not JSON')) throw e;
        throw new Error('Failed to parse response: ' + e.message);
    }
    textInput.value = result.content;
}

// ========================================
// FILE UPLOAD EVENT HANDLING
// ========================================

/**
 * Handles file upload - processes files immediately
 */
function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    
    const extractColors = document.getElementById('extractColors').checked;
    
    // Show file upload status
    window.showStatus(`📎 ${files.length} file(s) uploaded. Processing...`, 'info');
    
    // Auto-extract colors if checkbox is checked
    if (extractColors) {
        extractColorsFromFiles(files).then(extractedTheme => {
            if (extractedTheme) {
                // Display theme selector with extracted theme
                if (window.displayThemeSelector) {
                    window.displayThemeSelector('extracted-custom');
                }
                
                // Auto-select the extracted theme
                if (window.selectTheme) {
                    window.selectTheme('extracted-custom');
                }
                
                window.showStatus(`✅ Colors extracted! "${extractedTheme.name}" theme auto-selected.`, 'success');
            }
        });
    }
}

/**
 * Initialize file upload handler on page load
 */
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const fileInput = document.getElementById('fileUpload');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }
    });
}

// ========================================
// EXPORTS
// ========================================

window.readFileAsText = readFileAsText;
window.extractColorsFromFiles = extractColorsFromFiles;
window.generateFromPrompt = generateFromPrompt;
window.handleFileUpload = handleFileUpload;

// Immediate diagnostic
console.log('✅ fileHandler.js loaded - window.generateFromPrompt:', typeof window.generateFromPrompt);

