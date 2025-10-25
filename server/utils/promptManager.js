/**
 * Prompt Management Module
 * Loads, manages, and applies AI prompts from centralized config file
 */

const fs = require('fs').promises;
const path = require('path');

const PROMPTS_FILE = path.join(__dirname, '../../config/prompts.json');
const BACKUP_FILE = path.join(__dirname, '../../config/prompts.backup.json');

let promptsCache = null;

/**
 * Loads prompts from JSON file
 * @returns {Promise<Object>} - Prompts configuration object
 */
async function loadPrompts() {
    try {
        if (promptsCache) {
            return promptsCache;
        }
        
        const data = await fs.readFile(PROMPTS_FILE, 'utf8');
        promptsCache = JSON.parse(data);
        return promptsCache;
    } catch (error) {
        console.error('Error loading prompts:', error);
        // Return default prompts if file doesn't exist
        return getDefaultPrompts();
    }
}

/**
 * Saves prompts to JSON file
 * @param {Object} prompts - Prompts configuration to save
 * @returns {Promise<boolean>} - Success status
 */
async function savePrompts(prompts) {
    try {
        // Backup current prompts before saving
        await backupPrompts();
        
        // Update metadata
        prompts.metadata = {
            ...prompts.metadata,
            lastModified: new Date().toISOString(),
            customized: true
        };
        
        // Save to file
        await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2), 'utf8');
        
        // Clear cache to force reload
        promptsCache = null;
        
        console.log('✓ Prompts saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving prompts:', error);
        throw new Error('Failed to save prompts: ' + error.message);
    }
}

/**
 * Creates backup of current prompts
 * @returns {Promise<void>}
 */
async function backupPrompts() {
    try {
        const current = await fs.readFile(PROMPTS_FILE, 'utf8');
        await fs.writeFile(BACKUP_FILE, current, 'utf8');
        console.log('✓ Prompts backed up');
    } catch (error) {
        console.log('⚠ Backup failed:', error.message);
    }
}

/**
 * Restores prompts from backup
 * @returns {Promise<boolean>} - Success status
 */
async function restoreFromBackup() {
    try {
        const backup = await fs.readFile(BACKUP_FILE, 'utf8');
        await fs.writeFile(PROMPTS_FILE, backup, 'utf8');
        promptsCache = null;
        console.log('✓ Prompts restored from backup');
        return true;
    } catch (error) {
        console.error('Error restoring backup:', error);
        throw new Error('Failed to restore backup: ' + error.message);
    }
}

/**
 * Resets prompts to default values
 * @returns {Promise<boolean>} - Success status
 */
async function resetToDefaults() {
    try {
        await backupPrompts();
        const defaults = getDefaultPrompts();
        await fs.writeFile(PROMPTS_FILE, JSON.stringify(defaults, null, 2), 'utf8');
        promptsCache = null;
        console.log('✓ Prompts reset to defaults');
        return true;
    } catch (error) {
        console.error('Error resetting prompts:', error);
        throw new Error('Failed to reset prompts: ' + error.message);
    }
}

/**
 * Gets a specific prompt by key
 * @param {string} promptKey - Key of the prompt (e.g., 'contentGeneration')
 * @returns {Promise<Object>} - Prompt object
 */
async function getPrompt(promptKey) {
    const prompts = await loadPrompts();
    return prompts.prompts[promptKey];
}

/**
 * Applies variables to a prompt template
 * @param {string} template - Prompt template with {{variable}} placeholders
 * @param {Object} variables - Object with variable values
 * @returns {string} - Processed prompt
 */
function applyVariables(template, variables) {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value || '');
    }
    
    return result;
}

/**
 * Generates content generation prompt with variables
 * @param {string} userPrompt - User's input prompt
 * @param {number} numSlides - Number of slides
 * @param {boolean} generateImages - Whether to include image instructions
 * @returns {Promise<string>} - Complete AI prompt
 */
async function getContentGenerationPrompt(userPrompt, numSlides, generateImages = false) {
    const promptConfig = await getPrompt('contentGeneration');
    const imagePrompt = generateImages ? await getPrompt('imageGenerationInstructions') : null;
    
    const variables = {
        numSlides: numSlides,
        numContentSlides: numSlides - 1,
        userPrompt: userPrompt,
        imageInstructions: imagePrompt ? imagePrompt.template : ''
    };
    
    return applyVariables(promptConfig.template, variables);
}

/**
 * Generates slide design prompt with variables
 * @param {string} userContent - User's content to convert
 * @returns {Promise<string>} - Complete AI prompt
 */
async function getSlideDesignPrompt(userContent, numSlides = 0) {
    const promptConfig = await getPrompt('slideDesign');
    const schemaConfig = await getPrompt('jsonSchema');
    
    // Build slide guidance based on user preference
    let slideGuidance = '2. Create 4-15 slides total (including title slide) - use MORE slides if needed to avoid overcrowding any single slide';
    
    if (numSlides > 0) {
        slideGuidance = `2. Create approximately ${numSlides} slides total (including title slide). You may use ${numSlides-1} to ${numSlides+2} slides if needed to properly organize the content and avoid overcrowding`;
    }
    
    // Replace the hardcoded slide count instruction
    let template = promptConfig.template;
    template = template.replace(
        /2\. Create 4-15 slides total \(including title slide\).*?any single slide/,
        slideGuidance
    );
    
    const variables = {
        userContent: userContent,
        jsonSchema: schemaConfig.template
    };
    
    return applyVariables(template, variables);
}

/**
 * Generates file processing prompt
 * @param {Array} files - Array of {filename, content} objects
 * @returns {Promise<string>} - Complete AI prompt
 */
async function getFileProcessingPrompt(files) {
    const promptConfig = await getPrompt('fileProcessing');
    
    let filesContent = '';
    files.forEach(file => {
        filesContent += `\n\n=== File: ${file.filename} ===\n\n${file.content}`;
    });
    
    const variables = {
        fileCount: files.length,
        filesContent: filesContent
    };
    
    return applyVariables(promptConfig.template, variables);
}

/**
 * Generates slide modification prompt
 * @param {Array} currentSlides - Current slides array
 * @param {string} modificationRequest - User's modification request
 * @returns {Promise<string>} - Complete AI prompt
 */
async function getSlideModificationPrompt(currentSlides, modificationRequest) {
    const promptConfig = await getPrompt('slideModification');
    
    const variables = {
        slideCount: currentSlides.length,
        currentSlides: JSON.stringify(currentSlides, null, 2),
        modificationRequest: modificationRequest
    };
    
    return applyVariables(promptConfig.template, variables);
}

/**
 * Returns default prompts structure
 * @returns {Object} - Default prompts configuration
 */
function getDefaultPrompts() {
    // This matches the initial prompts.json structure
    return require('../../config/prompts.json');
}

module.exports = {
    loadPrompts,
    savePrompts,
    backupPrompts,
    restoreFromBackup,
    resetToDefaults,
    getPrompt,
    applyVariables,
    getContentGenerationPrompt,
    getSlideDesignPrompt,
    getFileProcessingPrompt,
    getSlideModificationPrompt
};

