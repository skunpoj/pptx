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
                if (provider === 'dalle' || provider === 'openai') {
                    // OpenAI DALL-E 3
                    imageData = await generateWithDALLE(desc.description, apiKey);
                } else if (provider === 'stability') {
                    // Stability AI
                    imageData = await generateWithStability(desc.description, apiKey);
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
 * Generate image using DALL-E 3
 */
async function generateWithDALLE(description, apiKey) {
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
        throw new Error(errorData.error?.message || `DALL-E API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return {
        url: data.data[0].url,
        revised_prompt: data.data[0].revised_prompt
    };
}

/**
 * Generate image using Stability AI
 */
async function generateWithStability(description, apiKey) {
    const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/core', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            prompt: description,
            output_format: 'png',
            aspect_ratio: '16:9'
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Stability API Error: ${response.status}`);
    }
    
    const data = await response.json();
    // Stability returns base64 image
    return {
        url: `data:image/png;base64,${data.image}`,
        seed: data.seed
    };
}

module.exports = router;

