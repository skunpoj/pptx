// Skills API routes - Handle different output formats (DOCX, PDF, XLSX)
const express = require('express');
const router = express.Router();
const SkillManager = require('../utils/skillManager');
const { callAI } = require('../utils/ai');
const { getApiKey } = require('../utils/helpers');

// Initialize skill manager
const skillManager = new SkillManager();

/**
 * Get available skills and their capabilities
 */
router.get('/skills', async (req, res) => {
    try {
        const skills = await skillManager.getAvailableSkills();
        res.json({
            success: true,
            skills: skills,
            message: 'Available skills retrieved successfully'
        });
    } catch (error) {
        console.error('Error getting skills:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve skills information',
            details: error.message
        });
    }
});

/**
 * Generate content for specific skill/format
 */
router.post('/generate/:format', async (req, res) => {
    try {
        const { format } = req.params;
        const { content, apiKey, provider = 'anthropic', options = {} } = req.body;
        
        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'Content is required'
            });
        }
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                error: 'API key is required'
            });
        }
        
        // Validate format
        const supportedFormats = ['pptx', 'docx', 'pdf', 'xlsx'];
        if (!supportedFormats.includes(format)) {
            return res.status(400).json({
                success: false,
                error: `Unsupported format: ${format}. Supported formats: ${supportedFormats.join(', ')}`
            });
        }
        
        // Generate content using AI if needed
        let processedContent = content;
        if (options.generateContent) {
            try {
                const aiPrompt = getSkillPrompt(format, content, options);
                const aiResponse = await callAI(provider, apiKey, aiPrompt);
                processedContent = aiResponse.content || content;
            } catch (aiError) {
                console.warn('AI content generation failed, using original content:', aiError.message);
            }
        }
        
        // Process content for the specific format
        const result = await skillManager.processContent(processedContent, format, options);
        
        res.json({
            success: true,
            format: format,
            result: result,
            message: `${format.toUpperCase()} document generated successfully`
        });
        
    } catch (error) {
        console.error(`Error generating ${req.params.format}:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to generate ${req.params.format} document`,
            details: error.message
        });
    }
});

/**
 * Get skill-specific prompt for AI content generation
 */
function getSkillPrompt(format, content, options) {
    const basePrompt = `Generate professional content for a ${format.toUpperCase()} document based on the following input:`;
    
    const formatSpecificPrompts = {
        docx: `
${basePrompt}

Input: ${content}

Requirements:
- Create a well-structured Word document
- Use proper headings and subheadings
- Include bullet points and numbered lists where appropriate
- Ensure professional formatting
- Make content comprehensive and detailed

Output: Provide the complete document content with proper structure.`,
        
        pdf: `
${basePrompt}

Input: ${content}

Requirements:
- Create a professional PDF document
- Use clear headings and sections
- Include proper formatting for readability
- Ensure content is comprehensive
- Structure for print-friendly layout

Output: Provide the complete document content optimized for PDF format.`,
        
        xlsx: `
${basePrompt}

Input: ${content}

Requirements:
- Create a structured Excel spreadsheet
- Organize data into logical sections
- Include headers and proper data organization
- Consider formulas and calculations if applicable
- Ensure data is properly formatted

Output: Provide the spreadsheet content with clear data structure and organization.`
    };
    
    return formatSpecificPrompts[format] || basePrompt;
}

/**
 * Get skill capabilities and requirements
 */
router.get('/skills/:format/capabilities', async (req, res) => {
    try {
        const { format } = req.params;
        const skills = await skillManager.getAvailableSkills();
        
        if (!skills[format]) {
            return res.status(404).json({
                success: false,
                error: `Skill ${format} not found`
            });
        }
        
        res.json({
            success: true,
            skill: skills[format],
            message: `${format.toUpperCase()} skill capabilities retrieved`
        });
        
    } catch (error) {
        console.error(`Error getting ${req.params.format} capabilities:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to get ${req.params.format} capabilities`,
            details: error.message
        });
    }
});

/**
 * Test skill availability and requirements
 */
router.get('/skills/:format/test', async (req, res) => {
    try {
        const { format } = req.params;
        const skillInfo = await skillManager.getSkillInfo(format, 
            require('path').join(__dirname, '../../skills', format));
        
        // Test if skill can be used
        const testResult = {
            available: skillInfo.available,
            requirements: skillInfo.requirements,
            capabilities: skillInfo.capabilities,
            status: skillInfo.available ? 'ready' : 'not_ready',
            message: skillInfo.available ? 
                `${format.toUpperCase()} skill is ready to use` : 
                `${format.toUpperCase()} skill is not available or missing requirements`
        };
        
        res.json({
            success: true,
            test: testResult,
            message: `Skill test completed for ${format}`
        });
        
    } catch (error) {
        console.error(`Error testing ${req.params.format} skill:`, error);
        res.status(500).json({
            success: false,
            error: `Failed to test ${req.params.format} skill`,
            details: error.message
        });
    }
});

module.exports = router;
