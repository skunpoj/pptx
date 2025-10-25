/**
 * Prompt Editor Module
 * Frontend interface for viewing and editing AI prompts
 */

// ========================================
// PROMPT LOADING
// ========================================

/**
 * Loads all prompts from backend
 * @returns {Promise<Object>} - Prompts configuration
 */
async function loadAllPrompts() {
    try {
        const response = await fetch('/api/prompts');
        if (!response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to load prompts');
            } else {
                const text = await response.text();
                console.error('Non-JSON response when loading prompts:', text.substring(0, 500));
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Expected JSON but got:', text.substring(0, 500));
            throw new Error('Server returned invalid response (not JSON). Check browser console.');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error loading prompts:', error);
        window.showStatus('❌ Error loading prompts: ' + error.message, 'error');
        return null;
    }
}

/**
 * Displays prompt editor UI
 */
async function showPromptEditor() {
    const prompts = await loadAllPrompts();
    if (!prompts) return;
    
    const editorContainer = document.getElementById('promptEditorContainer');
    
    let html = `
        <div style="background: #f0f4ff; border: 2px solid #667eea; border-radius: 12px; padding: 1.5rem; margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #333;">📝 AI Prompt Customization</h3>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-secondary" onclick="resetPromptsToDefaults()" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        🔄 Reset to Defaults
                    </button>
                    <button class="btn-secondary" onclick="restorePromptsFromBackup()" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        ⏮️ Restore Backup
                    </button>
                    <button class="btn-primary" onclick="saveCustomPrompts()" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
                        💾 Save Changes
                    </button>
                </div>
            </div>
            
            <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 0.75rem; margin-bottom: 1rem; border-radius: 4px;">
                <strong>⚠️ Advanced Feature:</strong> Edit these prompts to customize how the AI generates content and designs slides. Changes are automatically backed up.
                ${prompts.metadata?.customized ? '<div style="margin-top: 0.5rem; color: #d97706;"><strong>✏️ Customized:</strong> Last modified ' + new Date(prompts.metadata.lastModified).toLocaleString() + '</div>' : ''}
            </div>
            
            <div id="promptsList"></div>
        </div>
    `;
    
    editorContainer.innerHTML = html;
    
    // Render individual prompt editors
    renderPromptEditors(prompts);
}

/**
 * Renders editors for each prompt
 * @param {Object} prompts - Prompts configuration
 */
function renderPromptEditors(prompts) {
    const container = document.getElementById('promptsList');
    
    let html = '<h3 style="color: #667eea; margin: 1rem 0 0.5rem 0;">🤖 AI System Prompts</h3>';
    
    // Render system prompts
    for (const [key, prompt] of Object.entries(prompts.prompts)) {
        html += `
            <div style="background: white; border: 2px solid #e0e7ff; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 0.25rem 0; color: #667eea; font-size: 1rem;">${prompt.name}</h4>
                        <p style="margin: 0; font-size: 0.8rem; color: #666;">${prompt.description}</p>
                        ${prompt.variables && prompt.variables.length > 0 ? `
                        <div style="margin-top: 0.5rem;">
                            <span style="font-size: 0.75rem; color: #999;">Variables: </span>
                            ${prompt.variables.map(v => `<code style="background: #f0f4ff; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.7rem; margin-right: 0.25rem;">{{${v}}}</code>`).join('')}
                        </div>
                        ` : ''}
                    </div>
                    <button class="btn-secondary" onclick="togglePromptView('prompt_${key}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; white-space: nowrap;">
                        <span id="toggle-prompt_${key}">📖 View</span>
                    </button>
                </div>
                
                <div id="prompt-prompt_${key}" style="display: none;">
                    <textarea id="editor-prompt_${key}" class="prompt-editor" data-type="prompt" data-key="${key}" style="width: 100%; min-height: 300px; padding: 0.75rem; border: 2px solid #ddd; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.85rem; line-height: 1.5; resize: vertical;">${escapeHtml(prompt.template)}</textarea>
                    <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                        <div style="font-size: 0.75rem; color: #666;">
                            Characters: <span id="count-prompt_${key}">${prompt.template.length}</span>
                        </div>
                        <button class="btn-secondary" onclick="formatPrompt('prompt_${key}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                            ✨ Format
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render example templates section
    if (prompts.exampleTemplates && prompts.exampleTemplates.templates) {
        html += '<h3 style="color: #667eea; margin: 2rem 0 0.5rem 0;">📚 Example Templates</h3>';
        html += '<p style="color: #666; font-size: 0.9rem; margin-bottom: 1rem;">Edit the pre-built examples that appear when users click the example buttons (Tech, Business, etc.)</p>';
        
        for (const [key, template] of Object.entries(prompts.exampleTemplates.templates)) {
            html += `
                <div style="background: white; border: 2px solid #ffd700; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                        <div style="flex: 1;">
                            <h4 style="margin: 0 0 0.25rem 0; color: #f59e0b; font-size: 1rem;">
                                ${template.icon || '📄'} ${template.name}
                            </h4>
                            <p style="margin: 0; font-size: 0.8rem; color: #666;">
                                Category: <code style="background: #fef3c7; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem;">${key}</code>
                            </p>
                        </div>
                        <button class="btn-secondary" onclick="togglePromptView('example_${key}')" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; white-space: nowrap;">
                            <span id="toggle-example_${key}">📖 View</span>
                        </button>
                    </div>
                    
                    <div id="prompt-example_${key}" style="display: none;">
                        <div style="margin-bottom: 0.5rem;">
                            <label style="display: block; font-size: 0.8rem; color: #666; margin-bottom: 0.25rem;">Template Name:</label>
                            <input type="text" id="editor-example_${key}_name" value="${escapeHtml(template.name)}" 
                                style="width: 100%; padding: 0.5rem; border: 2px solid #ddd; border-radius: 6px; font-size: 0.9rem;">
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <label style="display: block; font-size: 0.8rem; color: #666; margin-bottom: 0.25rem;">Icon (emoji):</label>
                            <input type="text" id="editor-example_${key}_icon" value="${escapeHtml(template.icon || '📄')}" 
                                style="width: 100px; padding: 0.5rem; border: 2px solid #ddd; border-radius: 6px; font-size: 1.2rem; text-align: center;">
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <label style="display: block; font-size: 0.8rem; color: #666; margin-bottom: 0.25rem;">Content (11 paragraphs for 10-12 slides):</label>
                            <textarea id="editor-example_${key}_content" class="prompt-editor" data-type="example" data-key="${key}" style="width: 100%; min-height: 400px; padding: 0.75rem; border: 2px solid #fbbf24; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 0.85rem; line-height: 1.5; resize: vertical;">${escapeHtml(template.content)}</textarea>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
                            <div style="font-size: 0.75rem; color: #666;">
                                Characters: <span id="count-example_${key}">${template.content.length}</span> | 
                                Paragraphs: <span id="para-example_${key}">${(template.content.match(/\n\n/g) || []).length + 1}</span>
                            </div>
                            <button class="btn-secondary" onclick="formatPrompt('example_${key}_content')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">
                                ✨ Format
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = html;
    
    // Add character count listeners for system prompts
    for (const key of Object.keys(prompts.prompts)) {
        const editor = document.getElementById(`editor-prompt_${key}`);
        if (editor) {
            editor.addEventListener('input', () => {
                document.getElementById(`count-prompt_${key}`).textContent = editor.value.length;
            });
        }
    }
    
    // Add character count listeners for example templates
    if (prompts.exampleTemplates && prompts.exampleTemplates.templates) {
        for (const key of Object.keys(prompts.exampleTemplates.templates)) {
            const editor = document.getElementById(`editor-example_${key}_content`);
            if (editor) {
                editor.addEventListener('input', () => {
                    const content = editor.value;
                    document.getElementById(`count-example_${key}`).textContent = content.length;
                    document.getElementById(`para-example_${key}`).textContent = (content.match(/\n\n/g) || []).length + 1;
                });
            }
        }
    }
}

/**
 * Toggles prompt view/edit mode
 * @param {string} key - Prompt key
 */
function togglePromptView(key) {
    const container = document.getElementById(`prompt-${key}`);
    const toggle = document.getElementById(`toggle-${key}`);
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        toggle.textContent = '📝 Hide';
    } else {
        container.style.display = 'none';
        toggle.textContent = '📖 View';
    }
}

/**
 * Formats prompt text (basic formatting)
 * @param {string} key - Prompt key
 */
function formatPrompt(key) {
    const editor = document.getElementById(`editor-${key}`);
    if (editor) {
        // Basic formatting: trim whitespace, normalize line breaks
        let text = editor.value;
        text = text.replace(/\r\n/g, '\n'); // Normalize line endings
        text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
        editor.value = text.trim();
        
        // Update character count
        document.getElementById(`count-${key}`).textContent = editor.value.length;
        
        window.showStatus('✅ Prompt formatted', 'success');
    }
}

/**
 * Saves custom prompts to backend
 */
async function saveCustomPrompts() {
    try {
        // Collect all prompt values
        const currentPrompts = await loadAllPrompts();
        
        // Update system prompts from editors
        for (const key of Object.keys(currentPrompts.prompts)) {
            const editor = document.getElementById(`editor-prompt_${key}`);
            if (editor) {
                currentPrompts.prompts[key].template = editor.value;
            }
        }
        
        // Update example templates from editors
        if (currentPrompts.exampleTemplates && currentPrompts.exampleTemplates.templates) {
            for (const key of Object.keys(currentPrompts.exampleTemplates.templates)) {
                const nameInput = document.getElementById(`editor-example_${key}_name`);
                const iconInput = document.getElementById(`editor-example_${key}_icon`);
                const contentEditor = document.getElementById(`editor-example_${key}_content`);
                
                if (nameInput) {
                    currentPrompts.exampleTemplates.templates[key].name = nameInput.value;
                }
                if (iconInput) {
                    currentPrompts.exampleTemplates.templates[key].icon = iconInput.value;
                }
                if (contentEditor) {
                    currentPrompts.exampleTemplates.templates[key].content = contentEditor.value;
                }
            }
        }
        
        // Save to backend
        const response = await fetch('/api/prompts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompts: currentPrompts })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save');
        }
        
        const result = await response.json();
        window.showStatus('✅ All prompts and examples saved successfully! Backup created.', 'success');
        
        // Reload example templates in the main UI
        if (window.loadExampleTemplates) {
            await window.loadExampleTemplates();
        }
        
        // Reload editor to show updated metadata
        setTimeout(() => showPromptEditor(), 500);
        
    } catch (error) {
        console.error('Error saving prompts:', error);
        window.showStatus('❌ Error saving prompts: ' + error.message, 'error');
    }
}

/**
 * Resets prompts to default values
 */
async function resetPromptsToDefaults() {
    if (!confirm('Are you sure you want to reset all prompts to defaults? Current prompts will be backed up.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/prompts/reset', {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to reset');
        }
        
        const result = await response.json();
        window.showStatus('✅ Prompts reset to defaults. Backup saved.', 'success');
        
        // Reload editor
        setTimeout(() => showPromptEditor(), 500);
        
    } catch (error) {
        console.error('Error resetting prompts:', error);
        window.showStatus('❌ Error resetting prompts: ' + error.message, 'error');
    }
}

/**
 * Restores prompts from backup
 */
async function restorePromptsFromBackup() {
    if (!confirm('Are you sure you want to restore prompts from the last backup?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/prompts/restore', {
            method: 'POST'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to restore');
        }
        
        const result = await response.json();
        window.showStatus('✅ Prompts restored from backup.', 'success');
        
        // Reload editor
        setTimeout(() => showPromptEditor(), 500);
        
    } catch (error) {
        console.error('Error restoring prompts:', error);
        window.showStatus('❌ Error restoring prompts: ' + error.message, 'error');
    }
}

/**
 * Escapes HTML for display
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// EXPORTS
// ========================================

window.showPromptEditor = showPromptEditor;
window.togglePromptView = togglePromptView;
window.formatPrompt = formatPrompt;
window.saveCustomPrompts = saveCustomPrompts;
window.resetPromptsToDefaults = resetPromptsToDefaults;
window.restorePromptsFromBackup = restorePromptsFromBackup;

