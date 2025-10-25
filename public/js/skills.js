// Skills management for different output formats (DOCX, PDF, XLSX)

// Global state for skills
window.skillsState = {
    availableSkills: {},
    currentFormat: 'pptx-direct',
    skillCapabilities: {}
};

/**
 * Initialize skills system
 */
async function initializeSkills() {
    try {
        console.log('🔧 Initializing skills system...');
        
        // Load available skills
        await loadAvailableSkills();
        
        // Set up skill selection handlers
        setupSkillSelection();
        
        console.log('✅ Skills system initialized');
    } catch (error) {
        console.error('❌ Skills initialization failed:', error);
    }
}

/**
 * Load available skills from server
 */
async function loadAvailableSkills() {
    try {
        const response = await fetch('/api/skills');
        if (response.ok) {
            const data = await response.json();
            window.skillsState.availableSkills = data.skills;
            console.log('📋 Available skills loaded:', data.skills);
        } else {
            console.warn('⚠️ Could not load skills information');
        }
    } catch (error) {
        console.error('❌ Error loading skills:', error);
    }
}

/**
 * Setup skill selection handlers
 */
function setupSkillSelection() {
    // Handle output type selection
    const outputTypeRadios = document.querySelectorAll('input[name="outputType"]');
    outputTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                selectOutputType(this.value);
            }
        });
    });
}

/**
 * Handle output type selection
 */
function selectOutputType(format) {
    console.log(`📄 Output type selected: ${format}`);
    window.skillsState.currentFormat = format;
    
    // Update UI to show format-specific options
    updateFormatOptions(format);
    
    // Load skill capabilities if not already loaded
    if (!window.skillsState.skillCapabilities[format]) {
        loadSkillCapabilities(format);
    }
}

/**
 * Update UI based on selected format
 */
function updateFormatOptions(format) {
    // Update generation button text
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        const formatNames = {
            'pptx-direct': 'PowerPoint (Direct)',
            'pptx-skill': 'PowerPoint (Skill)',
            'docx': 'Word Document',
            'pdf': 'PDF Document',
            'xlsx': 'Excel Spreadsheet'
        };
        generateBtn.textContent = `✨ Generate Professional ${formatNames[format] || format.toUpperCase()}`;
    }
    
    // Show format-specific information
    showFormatInfo(format);
}

/**
 * Show format-specific information
 */
function showFormatInfo(format) {
    const infoContainer = document.getElementById('formatInfo');
    if (!infoContainer) return;
    
    const formatInfo = {
        'pptx-direct': {
            title: '📊 PowerPoint Direct',
            description: 'Fast PowerPoint generation using integrated html2pptx package',
            features: ['Direct generation', 'Fast processing', 'Integrated package', 'No external dependencies']
        },
        'pptx-skill': {
            title: '📊 PowerPoint Skill',
            description: 'PowerPoint generation using skill-based processing for comparison',
            features: ['Skill-based processing', 'Modular approach', 'Comparison testing', 'Extended capabilities']
        },
        'docx': {
            title: '📝 Word Document',
            description: 'Structured document with headings, formatting, and styles',
            features: ['Headings and subheadings', 'Bullet points', 'Tables', 'Professional formatting']
        },
        'pdf': {
            title: '📄 PDF Document',
            description: 'Print-ready document with consistent formatting',
            features: ['Print optimization', 'Consistent formatting', 'Professional layout', 'Cross-platform compatibility']
        },
        'xlsx': {
            title: '📈 Excel Spreadsheet',
            description: 'Structured data with formulas, formatting, and analysis',
            features: ['Data organization', 'Formulas and calculations', 'Charts and graphs', 'Professional formatting']
        }
    };
    
    const info = formatInfo[format];
    if (info) {
        infoContainer.innerHTML = `
            <div class="format-info">
                <h4>${info.title}</h4>
                <p>${info.description}</p>
                <ul>
                    ${info.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
        `;
        infoContainer.style.display = 'block';
    }
}

/**
 * Load skill capabilities for specific format
 */
async function loadSkillCapabilities(format) {
    try {
        const response = await fetch(`/api/skills/${format}/capabilities`);
        if (response.ok) {
            const data = await response.json();
            window.skillsState.skillCapabilities[format] = data.skill;
            console.log(`📋 Capabilities loaded for ${format}:`, data.skill);
        } else {
            console.warn(`⚠️ Could not load capabilities for ${format}`);
        }
    } catch (error) {
        console.error(`❌ Error loading capabilities for ${format}:`, error);
    }
}

/**
 * Generate content for selected format
 */
async function generateForFormat(content, format, options = {}) {
    try {
        console.log(`🚀 Generating ${format} document...`);
        
        const apiKey = getApiKey();
        if (!apiKey) {
            throw new Error('API key is required');
        }
        
        // Show loading state
        showGenerationLoading(format);
        
        // Handle PPTX options differently
        if (format === 'pptx-direct') {
            // Use the existing direct generation (original method)
            return await generateDirectPPTX(content, apiKey, options);
        } else if (format === 'pptx-skill') {
            // Use the skill-based generation for comparison
            return await generateSkillPPTX(content, apiKey, options);
        } else {
            // Use skill-based generation for other formats
            const response = await fetch(`/api/generate/${format}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: content,
                    apiKey: apiKey,
                    provider: 'anthropic',
                    options: {
                        generateContent: true,
                        ...options
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error(`Generation failed: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                showGenerationSuccess(format, result);
                return result;
            } else {
                throw new Error(result.error || 'Generation failed');
            }
        }
        
    } catch (error) {
        console.error(`❌ ${format} generation failed:`, error);
        showGenerationError(format, error.message);
        throw error;
    }
}

/**
 * Generate PPTX using direct method (original)
 */
async function generateDirectPPTX(content, apiKey, options) {
    // Use the existing generation endpoint
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: content,
            apiKey: apiKey,
            slideData: window.currentSlideData // Use cached preview data if available
        })
    });
    
    if (!response.ok) {
        throw new Error(`Direct PPTX generation failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
        showGenerationSuccess('pptx-direct', result);
        return result;
    } else {
        throw new Error(result.error || 'Direct PPTX generation failed');
    }
}

/**
 * Generate PPTX using skill method (for comparison)
 */
async function generateSkillPPTX(content, apiKey, options) {
    // Use the skill-based generation endpoint
    const response = await fetch('/api/generate/pptx', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            content: content,
            apiKey: apiKey,
            provider: 'anthropic',
            options: {
                generateContent: true,
                ...options
            }
        })
    });
    
    if (!response.ok) {
        throw new Error(`Skill PPTX generation failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
        showGenerationSuccess('pptx-skill', result);
        return result;
    } else {
        throw new Error(result.error || 'Skill PPTX generation failed');
    }
}

/**
 * Show generation loading state
 */
function showGenerationLoading(format) {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.textContent = `🔄 Generating ${format.toUpperCase()}...`;
        generateBtn.disabled = true;
    }
    
    // Show loading message
    showNotification(`🔄 Generating ${format.toUpperCase()} document...`, 'info');
}

/**
 * Show generation success
 */
function showGenerationSuccess(format, result) {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.textContent = `✨ Generate Professional ${format.toUpperCase()}`;
        generateBtn.disabled = false;
    }
    
    showNotification(`✅ ${format.toUpperCase()} document generated successfully!`, 'success');
    
    // Show download options if available
    if (result.result && result.result.output_path) {
        showDownloadOptions(format, result.result.output_path);
    }
}

/**
 * Show generation error
 */
function showGenerationError(format, errorMessage) {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.textContent = `✨ Generate Professional ${format.toUpperCase()}`;
        generateBtn.disabled = false;
    }
    
    showNotification(`❌ ${format.toUpperCase()} generation failed: ${errorMessage}`, 'error');
}

/**
 * Show download options
 */
function showDownloadOptions(format, filePath) {
    const container = document.getElementById('previewContainer');
    if (!container) return;
    
    const downloadDiv = document.createElement('div');
    downloadDiv.className = 'download-options';
    downloadDiv.style.marginTop = '1rem';
    downloadDiv.style.padding = '1rem';
    downloadDiv.style.backgroundColor = '#f8f9fa';
    downloadDiv.style.borderRadius = '4px';
    downloadDiv.style.border = '1px solid #ddd';
    
    const formatNames = {
        'pptx': 'PowerPoint',
        'docx': 'Word Document',
        'pdf': 'PDF Document',
        'xlsx': 'Excel Spreadsheet'
    };
    
    downloadDiv.innerHTML = `
        <h4>📥 Download ${formatNames[format] || format.toUpperCase()}</h4>
        <p>Your ${formatNames[format] || format.toUpperCase()} document is ready for download.</p>
        <button class="btn btn-primary" onclick="downloadFile('${filePath}', '${format}')">
            📥 Download ${format.toUpperCase()}
        </button>
    `;
    
    container.appendChild(downloadDiv);
}

/**
 * Download generated file
 */
function downloadFile(filePath, format) {
    // Create download link
    const link = document.createElement('a');
    link.href = `/api/download/${encodeURIComponent(filePath)}`;
    link.download = `document.${format}`;
    link.click();
    
    showNotification(`📥 Downloading ${format.toUpperCase()} document...`, 'success');
}

/**
 * Test skill availability
 */
async function testSkillAvailability(format) {
    try {
        const response = await fetch(`/api/skills/${format}/test`);
        if (response.ok) {
            const data = await response.json();
            console.log(`🧪 Skill test for ${format}:`, data.test);
            return data.test;
        } else {
            console.warn(`⚠️ Could not test ${format} skill`);
            return { available: false, status: 'error' };
        }
    } catch (error) {
        console.error(`❌ Error testing ${format} skill:`, error);
        return { available: false, status: 'error' };
    }
}

/**
 * Get skill status for UI display
 */
function getSkillStatus(format) {
    const skill = window.skillsState.availableSkills[format];
    if (!skill) return 'unknown';
    
    if (skill.available) {
        return 'ready';
    } else {
        return 'not_ready';
    }
}

/**
 * Show skill requirements
 */
function showSkillRequirements(format) {
    const skill = window.skillsState.availableSkills[format];
    if (!skill) return;
    
    const requirements = skill.requirements || [];
    if (requirements.length > 0) {
        console.log(`📋 Requirements for ${format}:`, requirements);
        showNotification(`📋 ${format.toUpperCase()} requirements: ${requirements.join(', ')}`, 'info');
    }
}

// Export functions for global use
window.initializeSkills = initializeSkills;
window.selectOutputType = selectOutputType;
window.generateForFormat = generateForFormat;
window.testSkillAvailability = testSkillAvailability;
window.getSkillStatus = getSkillStatus;
window.showSkillRequirements = showSkillRequirements;

// Initialize skills when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSkills();
});
