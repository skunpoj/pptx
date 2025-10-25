// Image Generation API Routes
// Handles AI image generation and gallery management

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate images from slide descriptions
 * POST /api/images/generate
 * Body: { descriptions: [{ id, description }], apiKey, provider }
 */
router.post('/generate', async (req, res) => {
    const { descriptions, apiKey, provider = 'dalle' } = req.body;
    
    if (!descriptions || !Array.isArray(descriptions)) {
        return res.status(400).json({ error: 'descriptions array is required' });
    }
    
    if (!apiKey) {
        return res.status(400).json({ error: 'API key is required' });
    }
    
    console.log(`🖼️  Image generation request: ${descriptions.length} images`);
    
    try {
        const generatedImages = [];
        
        for (const desc of descriptions) {
            console.log(`  Generating image: ${desc.description.substring(0, 50)}...`);
            
            try {
                let imageUrl = null;
                let imageData = null;
                
                // Route to different image generation providers
                if (provider === 'huggingface') {
                    // Hugging Face (FREE - Default)
                    imageData = await generateWithHuggingFace(desc.description, apiKey);
                } else if (provider === 'dalle' || provider === 'openai') {
                    // OpenAI DALL-E 3
                    imageData = await generateWithDALLE(desc.description, apiKey);
                } else if (provider === 'stability') {
                    // Stability AI
                    imageData = await generateWithStability(desc.description, apiKey);
                } else if (provider === 'gemini') {
                    // Google Gemini (Imagen)
                    imageData = await generateWithGemini(desc.description, apiKey);
                } else {
                    throw new Error(`Unsupported provider: ${provider}`);
                }
                
                generatedImages.push({
                    id: desc.id,
                    description: desc.description,
                    url: imageData.url,
                    thumbnail: imageData.thumbnail || imageData.url,
                    provider: provider,
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

module.exports = router;

