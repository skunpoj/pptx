// AI API utility functions

async function callAI(provider, apiKey, userPrompt) {
    if (provider === 'bedrock') {
        // Use environment variable for Bedrock authentication
        const bedrockApiKey = process.env.bedrock || apiKey;
        
        if (!bedrockApiKey) {
            throw new Error('Bedrock API key not found in environment variable "bedrock"');
        }
        
        // Try global prefix first, then us. prefix as fallback
        const modelIds = [
            'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
            'us.anthropic.claude-sonnet-4-5-20250929-v1:0'
        ];
        
        let lastError = null;
        
        for (const modelId of modelIds) {
            try {
                console.log(`🔄 Calling Bedrock model: ${modelId}`);
                
                const response = await fetch(`https://bedrock-runtime.us-east-1.amazonaws.com/model/${modelId}/converse`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${bedrockApiKey.trim()}`
                    },
                    body: JSON.stringify({
                        messages: [{
                            role: "user",
                            content: [{ text: userPrompt }]
                        }]
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
                    console.log(`❌ Model ${modelId} failed: ${errorMsg}`);
                    lastError = new Error(errorMsg);
                    continue; // Try next model
                }

                const data = await response.json();
                
                // Parse Bedrock response format
                if (data.output && data.output.message && data.output.message.content) {
                    const content = data.output.message.content;
                    if (Array.isArray(content) && content.length > 0 && content[0].text) {
                        console.log(`✅ Success with model: ${modelId}`);
                        return content[0].text.trim();
                    }
                }
                
                throw new Error('Unexpected Bedrock response format');
                
            } catch (error) {
                console.log(`❌ Error with ${modelId}: ${error.message}`);
                lastError = error;
                continue; // Try next model
            }
        }
        
        // All models failed
        throw new Error(`Bedrock API error: ${lastError?.message || 'All model prefixes failed'}`);
    }
    else if (provider === 'anthropic') {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey.trim(),
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 8192,
                messages: [{
                    role: "user",
                    content: userPrompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.content[0].text.trim();
    } 
    else if (provider === 'openai') {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{
                    role: "user",
                    content: userPrompt
                }],
                max_tokens: 16384
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
    else if (provider === 'gemini') {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey.trim()}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: userPrompt
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 8192
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();
    }
    else if (provider === 'openrouter') {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "AI Text2PPT Pro"
            },
            body: JSON.stringify({
                model: "anthropic/claude-3.5-sonnet",
                max_tokens: 8192,
                messages: [{
                    role: "user",
                    content: userPrompt
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
    
    throw new Error('Unsupported AI provider');
}

module.exports = { callAI };

