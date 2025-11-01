// Image Generation API Routes
// Handles AI image generation and gallery management

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// AWS Bedrock SDK for Nova Canvas image generation
const {
    BedrockRuntimeClient,
    InvokeModelCommand,
} = require("@aws-sdk/client-bedrock-runtime");

/**
 * Generate images from slide descriptions
 * POST /api/images/generate
 * Body: { descriptions: [{ id, description }], apiKey, provider }
 */
router.post('/generate', async (req, res) => {
    const { descriptions, apiKey, provider = 'dalle', stream = true } = req.body;
    
    if (!descriptions || !Array.isArray(descriptions)) {
        return res.status(400).json({ error: 'descriptions array is required' });
    }
    
    // If no API key provided, default to Bedrock Nova Canvas (uses AWS credentials from env)
    let effectiveProvider = provider;
    let effectiveApiKey = apiKey;
    
    if (!apiKey) {
        console.log('ℹ️ No API key provided for image generation, using default backend provider: Bedrock Nova Canvas');
        effectiveProvider = 'bedrock';
        effectiveApiKey = ''; // Bedrock uses AWS credentials from environment, not API key
    }
    
    console.log(`🖼️  Image generation request: ${descriptions.length} images (provider: ${effectiveProvider}, streaming: ${stream})`);
    
    // STREAMING MODE: Send images as they're generated!
    if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        let successCount = 0;
        let failedCount = 0;
        
        try {
            for (let i = 0; i < descriptions.length; i++) {
                const desc = descriptions[i];
                console.log(`  [${i + 1}/${descriptions.length}] Generating: ${desc.description.substring(0, 50)}...`);
                
                try {
                    let imageData = null;
                    
                    // Route to different image generation providers
                    if (effectiveProvider === 'bedrock') {
                        // Bedrock Nova Canvas - uses AWS credentials from environment, no API key needed
                        imageData = await generateWithBedrock(desc.description);
                    } else if (effectiveProvider === 'huggingface') {
                        imageData = await generateWithHuggingFace(desc.description, effectiveApiKey);
                    } else if (effectiveProvider === 'dalle' || effectiveProvider === 'openai') {
                        imageData = await generateWithDALLE(desc.description, effectiveApiKey);
                    } else if (effectiveProvider === 'stability') {
                        imageData = await generateWithStability(desc.description, effectiveApiKey);
                    } else if (effectiveProvider === 'gemini') {
                        imageData = await generateWithGemini(desc.description, effectiveApiKey);
                    } else {
                        throw new Error(`Unsupported provider: ${effectiveProvider}`);
                    }
                    
                    successCount++;
                    
                    // Send this image immediately!
                    res.write(`data: ${JSON.stringify({
                        type: 'image',
                        image: {
                            id: desc.id,
                            slideIndex: desc.slideIndex,
                            slideTitle: desc.slideTitle,
                            description: desc.description,
                            url: imageData.url,
                            thumbnail: imageData.thumbnail || imageData.url,
                            provider: effectiveProvider === 'bedrock' ? 'bedrock-nova-canvas' : effectiveProvider,
                            model: imageData.model || null,
                            seed: imageData.seed || null,
                            timestamp: Date.now()
                        },
                        current: i + 1,
                        total: descriptions.length
                    })}\n\n`);
                    
                    console.log(`  ✅ [${i + 1}/${descriptions.length}] Sent to client: ${desc.id}`);
                    
                } catch (error) {
                    failedCount++;
                    console.error(`  ❌ [${i + 1}/${descriptions.length}] Failed: ${desc.id}:`, error.message);
                    
                    // Send error event
                    res.write(`data: ${JSON.stringify({
                        type: 'error',
                        error: {
                            id: desc.id,
                            slideIndex: desc.slideIndex,
                            description: desc.description,
                            error: error.message,
                            timestamp: Date.now()
                        },
                        current: i + 1,
                        total: descriptions.length
                    })}\n\n`);
                }
            }
            
            // Send completion event
            res.write(`data: ${JSON.stringify({
                type: 'complete',
                success: successCount,
                failed: failedCount,
                total: descriptions.length
            })}\n\n`);
            
            res.write('data: [DONE]\n\n');
            res.end();
            
            console.log(`✅ Streaming complete: ${successCount} success, ${failedCount} failed`);
            
        } catch (error) {
            console.error('Streaming error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            }
        }
        
    } else {
        // NON-STREAMING MODE (fallback)
        try {
            const generatedImages = [];
            
            for (const desc of descriptions) {
                console.log(`  Generating image: ${desc.description.substring(0, 50)}...`);
                
                try {
                    let imageData = null;
                    
                    // Route to different image generation providers
                    if (effectiveProvider === 'bedrock') {
                        // Bedrock Nova Canvas - uses AWS credentials from environment, no API key needed
                        imageData = await generateWithBedrock(desc.description);
                    } else if (effectiveProvider === 'huggingface') {
                        imageData = await generateWithHuggingFace(desc.description, effectiveApiKey);
                    } else if (effectiveProvider === 'dalle' || effectiveProvider === 'openai') {
                        imageData = await generateWithDALLE(desc.description, effectiveApiKey);
                    } else if (effectiveProvider === 'stability') {
                        imageData = await generateWithStability(desc.description, effectiveApiKey);
                    } else if (effectiveProvider === 'gemini') {
                        imageData = await generateWithGemini(desc.description, effectiveApiKey);
                    } else {
                        throw new Error(`Unsupported provider: ${effectiveProvider}`);
                    }
                    
                    generatedImages.push({
                        id: desc.id,
                        description: desc.description,
                        url: imageData.url,
                        thumbnail: imageData.thumbnail || imageData.url,
                        provider: effectiveProvider === 'bedrock' ? 'bedrock-nova-canvas' : effectiveProvider,
                        model: imageData.model || null,
                        seed: imageData.seed || null,
                        timestamp: Date.now()
                    });
                    
                    console.log(`  ✅ Image generated for: ${desc.id}`);
                    
                } catch (error) {
                    console.error(`  ❌ Failed to generate image for ${desc.id}:`, error.message);
                    generatedImages.push({
                        id: desc.id,
                        description: desc.description,
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }
            
            res.json({ 
                images: generatedImages,
                success: generatedImages.filter(img => !img.error).length,
                failed: generatedImages.filter(img => img.error).length
            });
            
        } catch (error) {
            console.error('Image generation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
});

/**
 * Generate image using Hugging Face Inference API
 * FREE API - Uses Stable Diffusion XL or FLUX.1
 */
async function generateWithHuggingFace(description, apiKey) {
    try {
        // Using FLUX.1-schnell (fast, free model) or Stable Diffusion XL
        const model = 'black-forest-labs/FLUX.1-schnell'; // Fast, high-quality, free
        // Alternative: 'stabilityai/stable-diffusion-xl-base-1.0'
        
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: description,
                parameters: {
                    num_inference_steps: 4, // Fast generation
                    guidance_scale: 0, // For FLUX.1-schnell
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Hugging Face API Error: ${response.status}`;
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = errorText.substring(0, 200) || errorMessage;
            }
            
            // Provide helpful error messages
            if (response.status === 401) {
                throw new Error('Invalid Hugging Face API token. Please check your token at huggingface.co/settings/tokens');
            } else if (response.status === 503) {
                throw new Error('Model is loading. Please wait 20 seconds and try again.');
            } else if (response.status === 429) {
                throw new Error('Hugging Face rate limit reached. Please wait a moment and try again.');
            }
            
            throw new Error(errorMessage);
        }
        
        // Hugging Face returns image as binary blob
        const imageBlob = await response.blob();
        
        // Convert blob to base64
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        
        return {
            url: `data:image/png;base64,${base64}`,
            model: model
        };
    } catch (error) {
        if (error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to Hugging Face API. Check your internet connection.');
        }
        throw error;
    }
}

/**
 * Generate image using DALL-E 3
 */
async function generateWithDALLE(description, apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: 'dall-e-3',
                prompt: description,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                style: 'natural'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `DALL-E API Error: ${response.status}`;
            
            // Provide helpful error messages
            if (response.status === 401) {
                throw new Error('Invalid OpenAI API key. Please check your API key in Advanced Configuration.');
            } else if (response.status === 429) {
                throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
            } else if (response.status === 402) {
                throw new Error('OpenAI API quota exceeded. Please check your billing at platform.openai.com.');
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        return {
            url: data.data[0].url,
            revised_prompt: data.data[0].revised_prompt
        };
    } catch (error) {
        // Re-throw with more context
        if (error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to OpenAI API. Check your internet connection.');
        }
        throw error;
    }
}

/**
 * Generate image using Stability AI
 */
async function generateWithStability(description, apiKey) {
    try {
        const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: description,
                output_format: 'png',
                aspect_ratio: '16:9'
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.message || `Stability API Error: ${response.status}`;
            
            // Provide helpful error messages
            if (response.status === 401) {
                throw new Error('Invalid Stability AI API key. Please check your API key in Advanced Configuration.');
            } else if (response.status === 429) {
                throw new Error('Stability AI rate limit exceeded. Please wait and try again.');
            } else if (response.status === 402 || response.status === 403) {
                throw new Error('Stability AI quota exceeded or insufficient credits. Check your account at platform.stability.ai.');
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        // Stability returns base64 image
        if (data.image) {
            return {
                url: `data:image/png;base64,${data.image}`,
                seed: data.seed
            };
        }
        
        throw new Error('No image data returned from Stability AI');
    } catch (error) {
        if (error.message.includes('fetch')) {
            throw new Error('Network error: Unable to connect to Stability AI API. Check your internet connection.');
        }
        throw error;
    }
}

/**
 * Generate image using Google Gemini (Imagen 3)
 * Note: As of 2024, Gemini doesn't have a public image generation API yet
 * This is a placeholder for future implementation
 */
async function generateWithGemini(description, apiKey) {
    // Note: Gemini image generation (Imagen) is not publicly available yet
    // This function is prepared for when Google releases the API
    
    throw new Error('Gemini image generation is not yet available. Google has not released a public API for Imagen. Please use DALL-E 3 or Stability AI instead.');
    
    // Future implementation when API is available:
    /*
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/imagen:generate?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: description,
            numberOfImages: 1,
            aspectRatio: '16:9'
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gemini API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
        url: data.images[0].url || `data:image/png;base64,${data.images[0].base64}`,
        mimeType: 'image/png'
    };
    */
}

/**
 * Generate image using AWS Bedrock Nova Canvas
 * Uses environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
 */
async function generateWithBedrock(description) {
    try {
        console.log('🎨 Generating image with AWS Bedrock Nova Canvas...');
        
        // Create Bedrock client - credentials loaded from environment automatically
        const client = new BedrockRuntimeClient({ region: "us-east-1" });
        
        // Model ID for Nova Canvas
        const modelId = "amazon.nova-canvas-v1:0";
        
        // Random seed for reproducible generation
        const seed = Math.floor(Math.random() * 858993460);
        
        // Prepare payload
        const payload = {
            taskType: "TEXT_IMAGE",
            textToImageParams: {
                text: description,
            },
            imageGenerationConfig: {
                seed,
                quality: "standard",
            },
        };
        
        // Send request
        const request = {
            modelId,
            body: JSON.stringify(payload),
        };
        
        const response = await client.send(new InvokeModelCommand(request));
        
        // Decode response
        const decodedResponseBody = new TextDecoder().decode(response.body);
        const responseBody = JSON.parse(decodedResponseBody);
        
        // Return base64 image data
        const base64Image = responseBody.images[0];
        
        console.log('✅ Image generated successfully with Nova Canvas');
        
        return {
            url: `data:image/png;base64,${base64Image}`,
            model: modelId,
            seed: seed
        };
        
    } catch (error) {
        console.error('❌ Bedrock image generation error:', error.message);
        
        // Provide helpful error messages
        if (error.message.includes('credentials')) {
            throw new Error('AWS credentials not found. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
        } else if (error.message.includes('region')) {
            throw new Error('AWS region error. Bedrock is configured for us-east-1.');
        } else if (error.message.includes('AccessDenied')) {
            throw new Error('AWS access denied. Please check your IAM permissions for Bedrock.');
        }
        
        throw error;
    }
}

/**
 * Automatic image generation endpoint
 * POST /api/images/auto-generate
 * Body: { slideData }
 * Automatically generates images for all slides with imageDescription
 */
router.post('/auto-generate', async (req, res) => {
    const { slideData, stream = true } = req.body;
    
    if (!slideData || !slideData.slides) {
        return res.status(400).json({ error: 'slideData is required' });
    }
    
    // Extract descriptions from slides
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
    
    if (descriptions.length === 0) {
        return res.json({ 
            images: [],
            message: 'No image descriptions found in slides'
        });
    }
    
    console.log(`🖼️  Auto-generating ${descriptions.length} images with AWS Bedrock Nova Canvas`);
    
    // STREAMING MODE: Send images as they're generated!
    if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        let successCount = 0;
        let failedCount = 0;
        
        try {
            for (let i = 0; i < descriptions.length; i++) {
                const desc = descriptions[i];
                console.log(`  [${i + 1}/${descriptions.length}] Generating: ${desc.description.substring(0, 50)}...`);
                
                try {
                    // Generate with AWS Bedrock Nova Canvas
                    const imageData = await generateWithBedrock(desc.description);
                    
                    successCount++;
                    
                    // Send this image immediately!
                    res.write(`data: ${JSON.stringify({
                        type: 'image',
                        image: {
                            id: desc.id,
                            slideIndex: desc.slideIndex,
                            slideTitle: desc.slideTitle,
                            description: desc.description,
                            url: imageData.url,
                            thumbnail: imageData.url,
                            provider: 'bedrock-nova-canvas',
                            model: imageData.model,
                            seed: imageData.seed,
                            timestamp: Date.now()
                        },
                        current: i + 1,
                        total: descriptions.length
                    })}\n\n`);
                    
                    console.log(`  ✅ [${i + 1}/${descriptions.length}] Sent to client: ${desc.id}`);
                    
                } catch (error) {
                    failedCount++;
                    console.error(`  ❌ [${i + 1}/${descriptions.length}] Failed: ${desc.id}:`, error.message);
                    
                    // Send error event
                    res.write(`data: ${JSON.stringify({
                        type: 'error',
                        error: {
                            id: desc.id,
                            slideIndex: desc.slideIndex,
                            description: desc.description,
                            error: error.message,
                            timestamp: Date.now()
                        },
                        current: i + 1,
                        total: descriptions.length
                    })}\n\n`);
                }
            }
            
            // Send completion event
            res.write(`data: ${JSON.stringify({
                type: 'complete',
                success: successCount,
                failed: failedCount,
                total: descriptions.length
            })}\n\n`);
            
            res.write('data: [DONE]\n\n');
            res.end();
            
            console.log(`✅ Auto-generation complete: ${successCount} success, ${failedCount} failed`);
            
        } catch (error) {
            console.error('Streaming error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: error.message });
            }
        }
    } else {
        // NON-STREAMING MODE
        try {
            const generatedImages = [];
            
            for (let i = 0; i < descriptions.length; i++) {
                const desc = descriptions[i];
                console.log(`  [${i + 1}/${descriptions.length}] Generating: ${desc.description.substring(0, 50)}...`);
                
                try {
                    const imageData = await generateWithBedrock(desc.description);
                    
                    generatedImages.push({
                        id: desc.id,
                        slideIndex: desc.slideIndex,
                        description: desc.description,
                        url: imageData.url,
                        thumbnail: imageData.url,
                        provider: 'bedrock-nova-canvas',
                        model: imageData.model,
                        seed: imageData.seed,
                        timestamp: Date.now()
                    });
                    
                    console.log(`  ✅ [${i + 1}/${descriptions.length}] Generated: ${desc.id}`);
                    
                } catch (error) {
                    console.error(`  ❌ [${i + 1}/${descriptions.length}] Failed: ${desc.id}:`, error.message);
                    generatedImages.push({
                        id: desc.id,
                        slideIndex: desc.slideIndex,
                        description: desc.description,
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
            }
            
            res.json({ 
                images: generatedImages,
                success: generatedImages.filter(img => !img.error).length,
                failed: generatedImages.filter(img => img.error).length
            });
            
        } catch (error) {
            console.error('Auto-generation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
});

module.exports = router;

