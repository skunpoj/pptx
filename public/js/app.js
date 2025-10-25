/**
 * Application State and Initialization Module
 * Central state management and app initialization
 */

// ========================================
// GLOBAL STATE
// ========================================

// Slide data and generation state
window.currentSlideData = null;
window.currentProvider = 'anthropic';
window.currentView = 'list';
window.selectedTheme = null;
window.templateFile = null;

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initializes the application on page load
 */
window.addEventListener('load', () => {
    initializeAPIKeys();
    initializeProviderSelection();
    initializeAPISectionState();
    initializeThemeSelector();
});

/**
 * Loads saved API keys from localStorage
 */
function initializeAPIKeys() {
    const providers = ['anthropic', 'openai', 'gemini', 'openrouter'];
    
    providers.forEach(provider => {
        const savedKey = localStorage.getItem(`${provider}_api_key`);
        if (savedKey) {
            const inputElement = document.getElementById(`apiKey-${provider}`);
            if (inputElement) {
                inputElement.value = savedKey;
            }
        }
    });
}

/**
 * Loads saved provider selection
 */
function initializeProviderSelection() {
    const savedProvider = localStorage.getItem('ai_provider') || 'anthropic';
    window.currentProvider = savedProvider;
    selectProvider(savedProvider);
}

/**
 * Restores settings section collapsed/expanded state
 */
function initializeAPISectionState() {
    const isCollapsed = localStorage.getItem('settings_section_collapsed') === 'true';
    if (isCollapsed) {
        toggleSettingsSection();
    }
}

/**
 * Initializes theme selector on page load
 */
function initializeThemeSelector() {
    // Display all available themes for user to choose from
    if (window.displayThemeSelector) {
        window.displayThemeSelector(null); // null = no AI suggestion yet
    }
    
    // Restore previously selected theme if any, otherwise use default
    const savedTheme = localStorage.getItem('selected_theme');
    const defaultTheme = 'vibrant-purple';
    
    if (savedTheme && window.colorThemes && window.colorThemes[savedTheme]) {
        window.selectedTheme = savedTheme;
        if (window.selectTheme) {
            window.selectTheme(savedTheme);
        }
    } else if (window.colorThemes && window.colorThemes[defaultTheme]) {
        // Set default theme if no saved theme exists
        window.selectedTheme = defaultTheme;
        if (window.selectTheme) {
            window.selectTheme(defaultTheme);
        }
    }
}

// ========================================
// SETTINGS SECTION MANAGEMENT
// ========================================

/**
 * Toggles entire settings section visibility
 */
function toggleSettingsSection() {
    const container = document.getElementById('settingsSectionContainer');
    const icon = document.getElementById('settingsToggleIcon');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        icon.textContent = '▼';
        localStorage.setItem('settings_section_collapsed', 'false');
    } else {
        container.style.display = 'none';
        icon.textContent = '▶';
        localStorage.setItem('settings_section_collapsed', 'true');
    }
}

/**
 * Selects an AI provider
 * @param {string} provider - Provider name ('anthropic', 'openai', etc.)
 */
function selectProvider(provider) {
    window.currentProvider = provider;
    localStorage.setItem('ai_provider', provider);
    
    // Update button styles
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.style.border = '2px solid #ddd';
        btn.style.background = 'white';
        btn.style.color = '#666';
    });
    
    const activeBtn = document.getElementById(`provider-${provider}`);
    if (activeBtn) {
        activeBtn.style.border = '2px solid #667eea';
        activeBtn.style.background = '#e0e7ff';
        activeBtn.style.color = '#667eea';
    }
    
    // Show/hide provider sections
    document.querySelectorAll('.provider-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const activeSection = document.getElementById(`section-${provider}`);
    if (activeSection) {
        activeSection.style.display = 'block';
    }
}

/**
 * Saves API key to localStorage
 * @param {string} provider - Provider name
 */
function saveApiKey(provider) {
    const apiKeyInput = document.getElementById(`apiKey-${provider}`);
    if (!apiKeyInput) return;
    
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        window.showStatus('Please enter your API key', 'error');
        return;
    }
    
    localStorage.setItem(`${provider}_api_key`, apiKey);
    window.showStatus(`✅ ${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved!`, 'success');
}

// ========================================
// EXAMPLE TEMPLATES
// ========================================

const exampleTemplates = {
    tech: `The Future of Artificial Intelligence in Healthcare

Artificial intelligence is revolutionizing healthcare by improving diagnostics, personalizing treatment plans, and accelerating drug discovery. Machine learning algorithms can now detect diseases from medical images with accuracy rivaling human experts.

Key applications include early cancer detection through image analysis, predictive analytics for patient outcomes, robotic surgery assistance, and virtual health assistants. AI-powered tools are reducing diagnostic errors and helping doctors make better informed decisions.

The integration of AI with electronic health records enables personalized medicine by analyzing patient data to recommend optimal treatments. Natural language processing helps extract insights from medical literature and patient notes.

Challenges remain including data privacy concerns, the need for regulatory frameworks, potential algorithmic bias, and ensuring AI systems are explainable to healthcare providers. Despite these hurdles, AI promises to make healthcare more accessible and effective for everyone.`,
    
    business: `Digital Transformation Strategy for Modern Enterprises

Digital transformation is no longer optional for businesses seeking to remain competitive in today's fast-paced market. Companies must embrace cloud computing, data analytics, and automation to streamline operations and improve customer experiences.

Key pillars of successful transformation include cloud migration for scalability, data-driven decision making through advanced analytics, customer experience optimization using digital channels, and process automation to reduce costs and errors.

The journey requires strong leadership commitment, clear vision and roadmap, investment in technology infrastructure, and a culture of continuous innovation. Companies must also focus on upskilling employees to work effectively with new technologies.

Success metrics include improved operational efficiency, enhanced customer satisfaction, faster time to market for new products, and increased revenue through digital channels. Regular assessment and adjustment of strategies ensures continued relevance and competitive advantage.`,
    
    education: `Innovative Teaching Methods for the 21st Century Classroom

Modern education must evolve to prepare students for a rapidly changing world. Traditional lecture-based approaches are giving way to interactive, technology-enhanced learning experiences that foster critical thinking and collaboration.

Effective teaching strategies include project-based learning where students solve real-world problems, flipped classroom models that maximize in-class interaction time, gamification to increase engagement and motivation, and personalized learning paths adapted to individual student needs.

Technology integration enhances learning through virtual reality field trips, collaborative online platforms for group projects, adaptive learning software that adjusts to student progress, and digital portfolios showcasing student achievements.

Assessment methods are also evolving beyond traditional tests to include peer evaluation, self-reflection exercises, practical demonstrations of skills, and ongoing formative feedback that guides learning. These approaches better prepare students for future careers and lifelong learning.`,
    
    health: `Mental Health Awareness in the Modern Workplace

Mental health has become a critical concern for organizations worldwide. Creating supportive work environments that prioritize employee wellbeing leads to improved productivity, reduced turnover, and stronger company culture.

Common workplace stressors include high workload and tight deadlines, lack of work-life balance, insufficient recognition and support, unclear expectations and poor communication, and limited opportunities for growth and development.

Effective organizational strategies include flexible work arrangements, mental health resources and counseling services, stress management workshops, open communication channels for concerns, and leadership training on mental health awareness.

Individual practices that support mental health include regular exercise and physical activity, mindfulness and meditation practices, maintaining social connections, setting healthy boundaries, and seeking professional help when needed. Creating a culture where mental health is openly discussed reduces stigma and encourages people to seek support.`,
    
    marketing: `Content Marketing Strategies for 2024

Content marketing continues to evolve as consumer behaviors shift and new platforms emerge. Successful brands focus on creating authentic, valuable content that resonates with their target audience across multiple channels.

Key trends shaping content strategy include short-form video dominance on platforms like TikTok and Instagram Reels, interactive content that engages audiences through quizzes and polls, user-generated content that builds community and trust, and AI-powered personalization for tailored experiences.

Essential components of effective campaigns include consistent brand voice across all channels, data-driven optimization based on performance metrics, multi-platform distribution for maximum reach, and authentic storytelling that connects emotionally with audiences.

Measuring success requires tracking engagement rates and time spent with content, conversion metrics and ROI analysis, audience growth and retention, brand sentiment and awareness, and content performance across different channels. Regular analysis enables continuous improvement and strategic adjustments.`,
    
    environment: `Sustainable Business Practices for a Greener Future

Environmental sustainability has become a business imperative as consumers, investors, and regulators demand responsible corporate behavior. Companies that embrace sustainable practices gain competitive advantages while contributing to global environmental goals.

Key areas for action include reducing carbon footprint through energy efficiency and renewable energy adoption, implementing circular economy principles to minimize waste, sustainable supply chain management with ethical sourcing, and water conservation in operations and products.

Business benefits of sustainability include cost savings through resource efficiency, enhanced brand reputation and customer loyalty, access to green financing and investment, improved risk management and regulatory compliance, and attraction of top talent who value corporate responsibility.

Implementation strategies involve setting measurable sustainability goals with clear timelines, conducting environmental impact assessments, engaging stakeholders in sustainability initiatives, transparent reporting of progress and challenges, and continuous innovation in sustainable products and processes. Leadership commitment and employee engagement are essential for success.`
};

/**
 * Loads an example by category
 * @param {string} category - Example category
 */
function loadExampleByCategory(category) {
    const text = exampleTemplates[category];
    if (text) {
        document.getElementById('ideaInput').value = text;
        window.showStatus(`📝 ${category.charAt(0).toUpperCase() + category.slice(1)} example loaded into idea generator. Click "Expand Idea" to create full content.`, 'info');
    }
}

// ========================================
// EXPORTS
// ========================================

window.toggleSettingsSection = toggleSettingsSection;
window.selectProvider = selectProvider;
window.saveApiKey = saveApiKey;
window.loadExampleByCategory = loadExampleByCategory;

module.exports = {
    SERVER_CONFIG,
    AI_PROVIDERS,
    PPTX_CONFIG,
    CHART_TYPES,
    CHART_COLORS,
    ACCEPTED_FILE_TYPES,
    ALL_ACCEPTED_TYPES,
    LAYOUT_TYPES: {
        BULLETS: 'bullets',
        TWO_COLUMN: 'two-column',
        THREE_COLUMN: 'three-column',
        FRAMEWORK: 'framework',
        PROCESS_FLOW: 'process-flow',
        CHART: 'chart'
    },
    exampleTemplates
};

