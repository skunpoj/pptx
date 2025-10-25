/**
 * Prompt Management API Routes
 * Endpoints for reading and updating AI prompts from frontend
 */

const express = require('express');
const router = express.Router();
const {
    loadPrompts,
    savePrompts,
    restoreFromBackup,
    resetToDefaults
} = require('../utils/promptManager');

/**
 * GET /api/prompts
 * Returns all prompts configuration
 */
router.get('/prompts', async (req, res) => {
    try {
        const prompts = await loadPrompts();
        res.json(prompts);
    } catch (error) {
        console.error('Error loading prompts:', error);
        res.status(500).json({ error: 'Failed to load prompts: ' + error.message });
    }
});

/**
 * POST /api/prompts
 * Updates prompts configuration
 */
router.post('/prompts', async (req, res) => {
    try {
        const { prompts } = req.body;
        
        if (!prompts) {
            return res.status(400).json({ error: 'Prompts data required' });
        }
        
        const success = await savePrompts(prompts);
        
        if (success) {
            res.json({ 
                success: true, 
                message: 'Prompts updated successfully',
                backup: true
            });
        } else {
            res.status(500).json({ error: 'Failed to save prompts' });
        }
    } catch (error) {
        console.error('Error saving prompts:', error);
        res.status(500).json({ error: 'Failed to save prompts: ' + error.message });
    }
});

/**
 * POST /api/prompts/reset
 * Resets prompts to default values
 */
router.post('/prompts/reset', async (req, res) => {
    try {
        const success = await resetToDefaults();
        
        if (success) {
            const prompts = await loadPrompts();
            res.json({ 
                success: true, 
                message: 'Prompts reset to defaults',
                prompts: prompts
            });
        } else {
            res.status(500).json({ error: 'Failed to reset prompts' });
        }
    } catch (error) {
        console.error('Error resetting prompts:', error);
        res.status(500).json({ error: 'Failed to reset prompts: ' + error.message });
    }
});

/**
 * POST /api/prompts/restore
 * Restores prompts from backup
 */
router.post('/prompts/restore', async (req, res) => {
    try {
        const success = await restoreFromBackup();
        
        if (success) {
            const prompts = await loadPrompts();
            res.json({ 
                success: true, 
                message: 'Prompts restored from backup',
                prompts: prompts
            });
        } else {
            res.status(500).json({ error: 'Failed to restore prompts' });
        }
    } catch (error) {
        console.error('Error restoring prompts:', error);
        res.status(500).json({ error: 'Failed to restore from backup: ' + error.message });
    }
});

/**
 * GET /api/prompts/:key
 * Returns a specific prompt by key
 */
router.get('/prompts/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const prompts = await loadPrompts();
        const prompt = prompts.prompts[key];
        
        if (!prompt) {
            return res.status(404).json({ error: 'Prompt not found' });
        }
        
        res.json(prompt);
    } catch (error) {
        console.error('Error loading prompt:', error);
        res.status(500).json({ error: 'Failed to load prompt: ' + error.message });
    }
});

/**
 * GET /api/examples
 * Returns example templates from prompts.json
 */
router.get('/examples', async (req, res) => {
    try {
        const prompts = await loadPrompts();
        
        if (prompts.exampleTemplates && prompts.exampleTemplates.templates) {
            res.json(prompts.exampleTemplates.templates);
        } else {
            res.status(404).json({ error: 'Example templates not found in prompts.json' });
        }
    } catch (error) {
        console.error('Error loading example templates:', error);
        res.status(500).json({ error: 'Failed to load example templates: ' + error.message });
    }
});

module.exports = router;

