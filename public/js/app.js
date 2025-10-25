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
    // Ensure colorThemes is loaded
    if (!window.colorThemes) {
        console.log('Waiting for colorThemes to load...');
        setTimeout(initializeThemeSelector, 100);
        return;
    }
    
    // Display all available themes for user to choose from
    if (window.displayThemeSelector) {
        window.displayThemeSelector(null); // null = no AI suggestion yet
    }
    
    // Restore previously selected theme if any, otherwise use default
    const savedTheme = localStorage.getItem('selected_theme');
    const defaultTheme = 'vibrant-purple';
    
    if (savedTheme && window.colorThemes[savedTheme]) {
        window.selectedTheme = savedTheme;
        if (window.selectTheme) {
            window.selectTheme(savedTheme);
        }
    } else if (window.colorThemes[defaultTheme]) {
        // Set default theme if no saved theme exists
        window.selectedTheme = defaultTheme;
        if (window.selectTheme) {
            window.selectTheme(defaultTheme);
        }
    } else {
        console.error('Default theme not found in colorThemes');
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
    
    // Guard against null elements
    if (!container || !icon) {
        console.warn('Settings section elements not found');
        return;
    }
    
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
    
    business: `Q4 2024 Business Performance Review

Revenue Growth and Financial Performance
Our quarterly revenue has shown exceptional growth throughout 2024. Q1 started at $2.5M, Q2 reached $3.2M, Q3 hit $4.1M, and Q4 closed at $5.3M, representing 112% year-over-year growth and exceeding our annual target by 23%.

Market Share Distribution Across Segments
Our market position has strengthened significantly across all key segments. Enterprise accounts now represent 45% of total revenue, Mid-market clients contribute 30%, Small Business segment accounts for 20%, and Government contracts make up the remaining 5%.

Regional Performance and Growth Metrics
Geographic expansion has driven substantial gains. North America leads with $8.2M in annual revenue (52% of total), EMEA contributed $4.5M (28%), APAC reached $2.1M (13%), and LATAM generated $1.2M (7%), with APAC showing the highest growth rate at 145% year-over-year.

Strategic Priorities for 2025
Key focus areas include expanding enterprise sales team by 40%, launching three new product features, entering two new international markets, and improving customer retention rate from 87% to 92% through enhanced support and success programs.`,
    
    education: `Innovative Teaching Methods for the 21st Century Classroom

Modern education must evolve to prepare students for a rapidly changing world. Traditional lecture-based approaches are giving way to interactive, technology-enhanced learning experiences that foster critical thinking and collaboration.

Effective teaching strategies include project-based learning where students solve real-world problems, flipped classroom models that maximize in-class interaction time, gamification to increase engagement and motivation, and personalized learning paths adapted to individual student needs.

Technology integration enhances learning through virtual reality field trips, collaborative online platforms for group projects, adaptive learning software that adjusts to student progress, and digital portfolios showcasing student achievements.

Assessment methods are also evolving beyond traditional tests to include peer evaluation, self-reflection exercises, practical demonstrations of skills, and ongoing formative feedback that guides learning. These approaches better prepare students for future careers and lifelong learning.`,
    
    health: `Workplace Wellness Program Impact Analysis 2024

Employee Wellness Participation Trends
Our workplace wellness program saw strong adoption throughout 2024. January started with 120 participants, April grew to 280 participants, July reached 450 participants, and October peaked at 620 participants, representing a 417% increase in program engagement.

Health Outcomes and Key Metrics
Program participants showed significant improvements across multiple health indicators. Stress levels decreased by 32%, reported sleep quality improved by 28%, physical activity increased by 45%, and overall wellness scores rose by 38% compared to baseline measurements at program start.

Organizational Benefits and ROI
The wellness program delivered measurable business value. Sick days decreased from 8.5 to 5.2 days per employee annually, healthcare costs reduced by 15% for program participants, employee engagement scores increased by 23%, and voluntary turnover dropped from 14% to 9% among wellness program members.

Program Component Effectiveness
Different wellness initiatives showed varying levels of participation and impact. Mental health resources were used by 45% of employees, Fitness challenges engaged 38%, Nutrition counseling reached 22%, and Mindfulness sessions attracted 18% participation, with combined activities showing the strongest positive outcomes.`,
    
    marketing: `2024 Digital Marketing Performance Analysis

Campaign Performance Across Channels
Our digital marketing efforts in 2024 showed strong performance across all channels. Email marketing generated 35% of leads, Social media campaigns contributed 28%, Paid search (PPC) delivered 22%, Content marketing brought in 10%, and Organic search accounted for 5% of total lead generation.

Quarterly Lead Generation Trends
Lead volume grew consistently throughout the year. Q1 generated 1,200 qualified leads, Q2 reached 1,850 leads, Q3 achieved 2,400 leads, and Q4 peaked at 3,100 leads, representing a 158% increase from Q1 to Q4.

Content Engagement and ROI Metrics
Our content strategy delivered measurable results. Blog posts averaged 2,500 views per article with 4.2% conversion rate, Video content reached 45,000 total views with 6.8% engagement rate, Infographics generated 12,000 shares across platforms, and Webinars attracted 850 registrants with 68% attendance rate.

Marketing Investment and Returns
Total marketing spend of $420,000 generated $2.1M in attributed revenue, delivering a 5:1 ROI. Cost per lead decreased from $85 in Q1 to $52 in Q4, while customer acquisition cost improved from $340 to $280, demonstrating increasing efficiency in our marketing operations.`,
    
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
        document.getElementById('textInput').value = text;
        window.showStatus(`📝 ${category.charAt(0).toUpperCase() + category.slice(1)} example loaded. Ready to preview or generate slides!`, 'success');
    }
}

// ========================================
// EXPORTS
// ========================================

window.toggleSettingsSection = toggleSettingsSection;
window.selectProvider = selectProvider;
window.saveApiKey = saveApiKey;
window.loadExampleByCategory = loadExampleByCategory;

