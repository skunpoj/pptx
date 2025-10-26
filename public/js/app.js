/**
 * Application State and Initialization Module
 * Central state management and app initialization
 */

// ========================================
// GLOBAL STATE
// ========================================

// Slide data and generation state
window.currentSlideData = null;
window.currentProvider = 'anthropic'; // Default provider shown in UI
window.currentView = 'list';
window.selectedTheme = null;
window.templateFile = null;
window.selectedOutputType = 'pptx'; // Default output type

// Time tracking state
window.generationStartTime = null;
window.timeTrackingSteps = [];

// ========================================
// INITIALIZATION
// ========================================

/**
 * Initializes the application on page load
 */
window.addEventListener('load', () => {
    initializeAPIKeys();
    initializeProviderSelection();
    initializeImageProviderSelection();
    initializeAPISectionState();
    initializeThemeSelector();
    initializeOutputType();
});

/**
 * Loads saved API keys from localStorage
 */
function initializeAPIKeys() {
    const providers = ['huggingface', 'anthropic', 'openai', 'gemini', 'openrouter', 'stability'];
    
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
 * Initializes image provider selection on page load
 */
function initializeImageProviderSelection() {
    let savedImageProvider = localStorage.getItem('image_provider') || 'huggingface';
    
    // Auto-switch away from Gemini if it was previously selected
    if (savedImageProvider === 'gemini') {
        console.warn('⚠️  Gemini image provider was selected but is not available. Switching to Hugging Face.');
        savedImageProvider = 'huggingface';
        localStorage.setItem('image_provider', 'huggingface');
    }
    
    window.currentImageProvider = savedImageProvider;
    
    // Update UI buttons
    document.querySelectorAll('.provider-btn-img').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`img-provider-${savedImageProvider}`);
    if (activeBtn && !activeBtn.disabled) {
        activeBtn.classList.add('active');
    }
    
    // Show appropriate API key section
    showImageProviderSection(savedImageProvider);
    
    console.log(`🎨 Image provider initialized: ${savedImageProvider}`);
}

/**
 * Show/hide API key sections based on selected image provider
 */
function showImageProviderSection(provider) {
    // Hide all image provider sections first
    const sections = ['huggingface', 'stability'];
    sections.forEach(sec => {
        const section = document.getElementById(`section-${sec}`);
        if (section) {
            section.style.display = 'none';
        }
    });
    
    // Show the selected provider's section
    // For DALL-E, show OpenAI section (they use the same key)
    let sectionToShow = provider;
    let providerDisplayName = provider;
    
    if (provider === 'dalle') {
        sectionToShow = 'openai';
        providerDisplayName = 'DALL-E 3 (uses OpenAI key)';
    } else if (provider === 'huggingface') {
        providerDisplayName = 'Hugging Face (FREE)';
    } else if (provider === 'stability') {
        providerDisplayName = 'Stability AI';
    }
    
    const selectedSection = document.getElementById(`section-${sectionToShow}`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
        
        // Update the hint text
        const hintElement = document.getElementById('currentImageProviderName');
        if (hintElement) {
            hintElement.textContent = providerDisplayName;
            hintElement.style.color = '#667eea';
            hintElement.style.fontWeight = 'bold';
        }
        
        // Scroll to the section
        setTimeout(() => {
            selectedSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
    
    console.log(`📋 Showing API key section for: ${sectionToShow} (${providerDisplayName})`);
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

/**
 * Initializes output type selection on page load
 */
function initializeOutputType() {
    const savedType = localStorage.getItem('selected_output_type');
    if (savedType) {
        window.selectedOutputType = savedType;
        // Update radio button state
        const radio = document.querySelector(`input[name="outputType"][value="${savedType}"]`);
        if (radio) {
            radio.checked = true;
            selectOutputType(savedType);
        }
    } else {
        // Default to pptx
        window.selectedOutputType = 'pptx';
    }
    console.log('✓ Output type initialized:', window.selectedOutputType);
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
 * Selects an AI provider for content generation
 * @param {string} provider - Provider name ('anthropic', 'openai', etc.)
 */
function selectProvider(provider) {
    window.currentProvider = provider;
    localStorage.setItem('ai_provider', provider);
    
    // Update button styles
    document.querySelectorAll('.provider-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`provider-${provider}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
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
 * Selects an AI provider for image generation
 * @param {string} provider - Provider name ('dalle', 'stability', 'gemini')
 */
function selectImageProvider(provider) {
    // Prevent selecting Gemini (not available yet)
    if (provider === 'gemini') {
        alert('⚠️ Gemini Image Generation Not Available\n\nGoogle has not released a public API for Imagen yet.\n\nPlease use Hugging Face (FREE), DALL-E 3, or Stability AI instead.');
        return;
    }
    
    window.currentImageProvider = provider;
    localStorage.setItem('image_provider', provider);
    
    // Update button styles
    document.querySelectorAll('.provider-btn-img').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`img-provider-${provider}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // Show/hide appropriate API key sections for image providers
    showImageProviderSection(provider);
    
    console.log(`🎨 Image provider set to: ${provider}`);
}

/**
 * Gets the current image generation provider
 * @returns {string} Provider name
 */
function getImageProvider() {
    let provider = window.currentImageProvider || localStorage.getItem('image_provider') || 'huggingface';
    
    // Auto-switch away from Gemini if selected (not available yet)
    if (provider === 'gemini') {
        console.warn('⚠️  Gemini image generation not available, switching to Hugging Face');
        provider = 'huggingface';
        window.currentImageProvider = 'huggingface';
        localStorage.setItem('image_provider', 'huggingface');
        
        // Update UI if buttons exist
        setTimeout(() => {
            const geminiBtn = document.getElementById('img-provider-gemini');
            const hfBtn = document.getElementById('img-provider-huggingface');
            if (geminiBtn) geminiBtn.classList.remove('active');
            if (hfBtn) hfBtn.classList.add('active');
        }, 100);
    }
    
    return provider;
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

// Templates will be loaded from API (/api/examples)
// Fallback templates are ONLY used if API fails
let exampleTemplates = {}; // Empty by default - will be populated from prompts.json

// FALLBACK ONLY - These are loaded from prompts.json via API
const FALLBACK_exampleTemplates = {
    tech: `The Future of Artificial Intelligence in Healthcare

Introduction to AI in Modern Healthcare
Artificial intelligence is revolutionizing healthcare by improving diagnostics, personalizing treatment plans, and accelerating drug discovery. Machine learning algorithms can now detect diseases from medical images with accuracy rivaling human experts. The healthcare industry stands at the threshold of a transformative era where AI-powered solutions are becoming integral to patient care delivery and medical research.

Diagnostic Applications and Medical Imaging
Key applications include early cancer detection through image analysis, predictive analytics for patient outcomes, robotic surgery assistance, and virtual health assistants. AI-powered tools are reducing diagnostic errors and helping doctors make better informed decisions. Radiology departments are experiencing a 40% improvement in detection rates for early-stage tumors, while pathology labs are using AI to analyze tissue samples with unprecedented accuracy.

Personalized Medicine and Treatment Planning
The integration of AI with electronic health records enables personalized medicine by analyzing patient data to recommend optimal treatments. Natural language processing helps extract insights from medical literature and patient notes. Genomic sequencing combined with AI algorithms allows physicians to tailor cancer treatments based on individual genetic profiles, resulting in 35% better patient outcomes and reduced side effects.

Drug Discovery and Development
AI is accelerating pharmaceutical research by predicting molecular interactions and identifying promising drug candidates in months instead of years. Machine learning models analyze millions of compounds to determine which molecules are most likely to succeed in clinical trials. This approach has reduced early-stage drug development costs by 60% while increasing the success rate of bringing new medications to market.

Clinical Decision Support Systems
Intelligent clinical decision support systems assist healthcare providers by analyzing patient symptoms, medical history, and current research to suggest evidence-based treatment options. These systems integrate real-time data from wearable devices, lab results, and patient-reported outcomes to provide comprehensive care recommendations. Hospitals using AI-powered decision support have reported 25% reduction in medical errors and improved adherence to clinical guidelines.

Predictive Analytics for Population Health
AI models analyze population health data to identify at-risk individuals before diseases manifest, enabling proactive preventive care interventions. Public health agencies use predictive analytics to forecast disease outbreaks, optimize resource allocation, and design targeted health campaigns. This proactive approach has reduced hospital readmission rates by 30% and improved chronic disease management outcomes significantly.

Robotic Surgery and Precision Procedures
Robotic surgical systems enhanced with AI capabilities enable minimally invasive procedures with sub-millimeter precision. Surgeons use AI-guided robots for complex operations including cardiac surgery, neurosurgery, and orthopedic procedures. These systems analyze real-time imaging data to compensate for hand tremors, optimize incision placement, and reduce surgical complications by 45% compared to traditional methods.

Virtual Health Assistants and Patient Engagement
AI-powered chatbots and virtual health assistants provide 24/7 patient support, answering medical questions, scheduling appointments, and monitoring medication adherence. These digital assistants use natural language understanding to engage patients in their native languages and provide culturally appropriate health information. Patient engagement scores have increased by 55% in healthcare systems deploying virtual assistant technology.

Data Privacy and Security Challenges
Challenges remain including data privacy concerns, the need for regulatory frameworks, potential algorithmic bias, and ensuring AI systems are explainable to healthcare providers. Healthcare organizations must implement robust data encryption, access controls, and audit trails to protect sensitive patient information. The industry is developing federated learning approaches that allow AI models to train on distributed datasets without compromising individual privacy.

Ethical Considerations and Algorithmic Fairness
Ensuring AI systems are fair and unbiased across different demographic groups is critical for equitable healthcare delivery. Researchers are developing techniques to detect and mitigate bias in training data, validate AI models across diverse populations, and ensure transparent decision-making processes. Regulatory bodies are establishing guidelines for AI transparency, requiring developers to document model limitations and performance across patient subgroups.

Future Outlook and Transformative Potential
Despite current hurdles, AI promises to make healthcare more accessible, affordable, and effective for everyone. The convergence of AI with genomics, wearable sensors, and telemedicine will create integrated health ecosystems that provide continuous, personalized care. Over the next decade, AI is expected to reduce healthcare costs by 20% while improving patient outcomes and expanding access to quality care in underserved communities.`,
    
    business: `Q4 2024 Business Performance Review

Executive Summary and Overview
Our company has delivered exceptional performance in 2024, exceeding targets across all key metrics and establishing strong momentum for 2025. This comprehensive review examines our financial results, market position, operational achievements, and strategic initiatives. We have demonstrated resilience in a challenging economic environment while making significant investments in growth and innovation.

Revenue Growth and Financial Performance
Our quarterly revenue has shown exceptional growth throughout 2024. Q1 started at $2.5M, Q2 reached $3.2M, Q3 hit $4.1M, and Q4 closed at $5.3M, representing 112% year-over-year growth and exceeding our annual target by 23%. Gross margins improved from 62% to 68% due to operational efficiencies and favorable product mix. EBITDA margins expanded to 28%, demonstrating strong operational leverage and disciplined cost management.

Market Share Distribution Across Segments
Our market position has strengthened significantly across all key segments. Enterprise accounts now represent 45% of total revenue, Mid-market clients contribute 30%, Small Business segment accounts for 20%, and Government contracts make up the remaining 5%. Enterprise segment grew by 145% year-over-year with 12 new Fortune 500 customers added. Our market share in the enterprise segment increased from 8% to 15%, positioning us as a top-three provider in our category.

Customer Acquisition and Retention Metrics
Customer acquisition accelerated throughout the year with 450 new customers added in 2024, representing 89% growth versus prior year. Customer retention rate improved from 87% to 92%, driven by enhanced customer success programs and product improvements. Net Revenue Retention reached 125%, indicating strong expansion within existing accounts. Average contract value increased by 35% as customers adopted additional features and expanded usage across their organizations.

Regional Performance and Growth Metrics
Geographic expansion has driven substantial gains. North America leads with $8.2M in annual revenue (52% of total), EMEA contributed $4.5M (28%), APAC reached $2.1M (13%), and LATAM generated $1.2M (7%), with APAC showing the highest growth rate at 145% year-over-year. We established new offices in Singapore and São Paulo, hired regional sales teams, and adapted our product offerings to meet local market requirements and compliance standards.

Product Innovation and Development
Product development initiatives delivered three major releases in 2024, introducing advanced analytics capabilities, mobile applications, and API integrations that customers have enthusiastically adopted. Our R&D investment increased to 22% of revenue, supporting a robust innovation pipeline. Customer feature adoption rates averaged 68% within 90 days of release, validating our product-market fit. We filed 8 patent applications for proprietary technologies that differentiate our platform.

Operational Excellence and Efficiency Gains
Operational improvements drove significant cost savings and productivity gains across the organization. Sales efficiency improved by 42% measured by revenue per sales representative, while customer support costs decreased by 18% through AI-powered self-service tools. Supply chain optimization reduced fulfillment costs by 25%, and cloud infrastructure migration lowered IT expenses by 30% while improving system reliability and performance.

Marketing Performance and Brand Growth
Marketing initiatives generated 8,500 qualified leads, a 158% increase from 2023, while cost per lead decreased by 35%. Brand awareness in our target markets increased from 28% to 47% based on independent surveys. Our content marketing strategy produced 120 high-quality articles, 24 webinars, and 15 case studies that drove significant organic traffic growth. Social media following grew by 215%, expanding our reach and engagement with potential customers.

Team Growth and Organizational Development
Headcount grew from 85 to 142 employees, with strategic hires across engineering, sales, and customer success. Employee engagement scores increased to 8.4/10, placing us in the top quartile for companies our size. We implemented comprehensive training programs, enhanced benefits packages, and created clear career progression frameworks. Voluntary turnover decreased to 8%, significantly below industry average of 15%.

Strategic Partnerships and Ecosystem Development
We established partnerships with three leading technology platforms, creating integrated solutions that expand our addressable market by 40%. Channel partnerships contributed 18% of total revenue, exceeding our 12% target. Strategic alliance with a major consulting firm provides access to enterprise customers and validation of our solutions. Our partner ecosystem now includes 45 certified implementation partners across 15 countries.

Strategic Priorities and 2025 Roadmap
Key focus areas for 2025 include expanding enterprise sales team by 40%, launching three new product features based on customer feedback, entering two new international markets in Europe and Asia, and improving customer retention rate from 92% to 95% through enhanced support and success programs. We plan to raise Series B funding to accelerate growth, invest in AI capabilities, and expand our market leadership position.`,
    
    education: `Innovative Teaching Methods for the 21st Century Classroom

The Evolution of Educational Paradigms
Modern education must evolve to prepare students for a rapidly changing world. Traditional lecture-based approaches are giving way to interactive, technology-enhanced learning experiences that foster critical thinking and collaboration. The 21st century demands graduates who can adapt to new challenges, work in diverse teams, and continuously learn throughout their careers. Educational institutions are fundamentally reimagining their approaches to teaching and learning.

Project-Based Learning and Real-World Applications
Effective teaching strategies include project-based learning where students solve real-world problems, developing critical thinking, collaboration, and problem-solving skills. Students work on extended investigations of authentic challenges, such as designing sustainable communities, creating business plans, or developing solutions to local environmental issues. This approach increases student engagement by 75% and improves knowledge retention by 60% compared to traditional instruction methods.

Flipped Classroom Models and Active Learning
Flipped classroom models maximize in-class interaction time by moving content delivery to pre-class videos and readings, allowing classroom time for discussions, problem-solving, and collaborative activities. Teachers facilitate active learning experiences rather than delivering lectures, providing personalized support to students who need it most. Schools implementing flipped classrooms report 40% improvement in student performance and significantly higher satisfaction among both teachers and students.

Gamification and Student Motivation
Gamification increases engagement and motivation by incorporating game elements such as points, badges, leaderboards, and challenges into learning activities. Students progress through levels, unlock achievements, and compete in friendly competitions that make learning fun and rewarding. Educational games teach complex concepts through interactive simulations and scenarios, resulting in 35% higher engagement rates and improved mastery of difficult subjects.

Personalized Learning Paths and Adaptive Technology
Personalized learning paths adapted to individual student needs, learning styles, and pace ensure each student receives appropriate challenge and support. Adaptive learning platforms use AI to assess student understanding in real-time and adjust content difficulty, provide targeted interventions, and recommend next steps. This individualized approach has reduced achievement gaps by 30% and allows advanced students to progress rapidly while struggling students receive additional support.

Technology Integration and Digital Tools
Technology integration enhances learning through virtual reality field trips that transport students to historical events or distant locations, collaborative online platforms for group projects that develop digital citizenship skills, adaptive learning software that adjusts to student progress, and digital portfolios showcasing student achievements. Schools with comprehensive technology integration report 50% improvement in digital literacy skills and better preparation for technology-driven careers.

Collaborative Learning and Peer Interaction
Collaborative learning strategies emphasize peer interaction, group problem-solving, and collective knowledge construction. Students work in diverse teams to complete complex tasks, learning to communicate effectively, resolve conflicts, and leverage individual strengths. Research shows collaborative learning improves social skills, critical thinking, and academic achievement across all subjects. Teachers design structured group activities with clear roles, accountability mechanisms, and reflection opportunities.

Modern Assessment Strategies
Assessment methods are evolving beyond traditional tests to include peer evaluation where students provide constructive feedback to classmates, self-reflection exercises that develop metacognitive skills, practical demonstrations of skills in authentic contexts, and ongoing formative feedback that guides learning. These approaches provide more comprehensive understanding of student abilities and better prepare students for real-world challenges where they must evaluate their own work and continuously improve.

Social-Emotional Learning Integration
Integrating social-emotional learning into curriculum helps students develop self-awareness, emotional regulation, empathy, relationship skills, and responsible decision-making. Schools implementing comprehensive SEL programs report 25% reduction in behavioral problems, improved classroom climate, and better academic outcomes. Teachers incorporate mindfulness practices, conflict resolution training, and character development activities throughout the school day.

Teacher Professional Development and Support
Effective implementation of innovative methods requires comprehensive teacher professional development, ongoing coaching, and collaborative planning time. Schools must invest in training programs that help teachers master new pedagogical approaches, integrate technology effectively, and differentiate instruction. Professional learning communities allow teachers to share best practices, analyze student work together, and continuously refine their craft.

Future Skills and Career Readiness
These innovative approaches better prepare students for future careers requiring creativity, critical thinking, collaboration, communication, and adaptability. Educational programs increasingly emphasize computational thinking, data literacy, global competence, and entrepreneurial mindsets. Partnerships with industry provide students with internships, mentorships, and authentic projects that connect classroom learning to career pathways and lifelong learning opportunities.`,
    
    health: `Workplace Wellness Program Impact Analysis 2024

Program Overview and Strategic Objectives
Our comprehensive workplace wellness program launched in January 2024 with the goal of improving employee health, reducing healthcare costs, and creating a culture of wellbeing. The program encompasses physical fitness, mental health support, nutrition counseling, and preventive care initiatives. Executive leadership committed to investing in employee wellness as a strategic priority that drives business performance and competitive advantage in talent markets.

Employee Wellness Participation Trends
Our workplace wellness program saw strong adoption throughout 2024. January started with 120 participants, April grew to 280 participants, July reached 450 participants, and October peaked at 620 participants, representing a 417% increase in program engagement. Participation rates varied by employee demographics, with highest engagement among employees aged 25-45 and those in departments with strong manager support. Digital engagement through our wellness app averaged 4.2 sessions per week per active user.

Physical Health Outcomes and Fitness Metrics
Program participants showed significant improvements across multiple health indicators. Stress levels decreased by 32%, reported sleep quality improved by 28%, physical activity increased by 45%, and overall wellness scores rose by 38% compared to baseline measurements at program start. Biometric screening results showed average improvements of 12 points in blood pressure, 15% reduction in cholesterol levels, and 8-pound average weight loss among participants targeting weight management goals.

Mental Health and Emotional Wellbeing
Mental health initiatives delivered substantial positive impact on employee emotional wellbeing. Utilization of employee assistance program services increased by 145%, with reduced stigma around seeking mental health support. Participants reported 35% reduction in anxiety symptoms and 40% improvement in work-life balance satisfaction. Resilience scores improved by 28%, indicating better ability to cope with stress and adversity. Mindfulness program participants showed 50% reduction in burnout symptoms.

Organizational Benefits and ROI
The wellness program delivered measurable business value. Sick days decreased from 8.5 to 5.2 days per employee annually, healthcare costs reduced by 15% for program participants, employee engagement scores increased by 23%, and voluntary turnover dropped from 14% to 9% among wellness program members. Productivity metrics showed 12% improvement in performance ratings for wellness participants. Total program ROI calculated at 3.2:1 based on healthcare savings and reduced absenteeism costs.

Program Component Effectiveness Analysis
Different wellness initiatives showed varying levels of participation and impact. Mental health resources were used by 45% of employees with 92% satisfaction ratings, Fitness challenges engaged 38% with highest completion rates for team-based competitions, Nutrition counseling reached 22% with participants reporting improved eating habits and energy levels, and Mindfulness sessions attracted 18% participation with exceptional impact scores. Combined activities showed the strongest positive outcomes, suggesting integrated approaches work best.

Preventive Care and Health Screenings
Preventive health screenings identified potential health issues early, enabling timely interventions. Annual health assessments achieved 68% participation rate, detecting previously undiagnosed conditions in 15% of participants including hypertension, diabetes risk, and cardiovascular concerns. Follow-up care coordination helped 85% of at-risk employees connect with healthcare providers. Flu vaccination rates increased from 45% to 78%, reducing flu-related absences by 60% during peak season.

Fitness Challenges and Physical Activity Programs
Step challenges, exercise classes, and sports leagues created social connections while promoting physical activity. Monthly fitness challenges averaged 320 participants with 72% completion rate. On-site fitness facility usage increased by 155%, while partnerships with local gyms provided access to 95% of employees. Walking meetings and active workstation options became popular, with 40% of employees reporting increased movement during work hours.

Nutrition and Healthy Eating Initiatives
Nutrition programs included healthy cafeteria options, cooking demonstrations, meal planning workshops, and personalized nutrition counseling. Cafeteria healthy option sales increased by 68%, while vending machine healthier choices grew from 30% to 60% of total sales. Participants in nutrition counseling reported improved dietary habits, with 70% meeting recommended fruit and vegetable intake targets. Hydration campaigns reduced sugary beverage consumption by 45%.

Work-Life Balance and Flexibility Programs
Flexible work arrangements, including remote work options and flexible scheduling, significantly improved work-life balance satisfaction. 85% of employees utilized some form of flexible work arrangement, reporting 35% improvement in ability to manage personal and professional responsibilities. Paid time off utilization increased from 75% to 92%, indicating employees felt more comfortable taking needed breaks. Time management workshops helped employees set boundaries and prioritize effectively.

Future Enhancements and 2025 Roadmap
Based on program success and employee feedback, 2025 enhancements will include expanded mental health resources with additional counselors, financial wellness education to address holistic wellbeing, family wellness programs extending benefits to spouses and children, and advanced data analytics for personalized wellness recommendations. Investment in wellness will increase by 40% to support program expansion and enhance existing offerings that demonstrate strong ROI and employee satisfaction.`,
    
    marketing: `2024 Digital Marketing Performance Analysis

Executive Summary and Key Achievements
Our digital marketing strategy delivered exceptional results in 2024, driving significant lead generation, revenue growth, and brand awareness improvements. This comprehensive analysis examines performance across all marketing channels, content initiatives, and campaign types. We exceeded our annual lead generation target by 32% while reducing cost per lead by 35%, demonstrating improved efficiency and effectiveness in our marketing investments.

Campaign Performance Across Channels
Our digital marketing efforts in 2024 showed strong performance across all channels. Email marketing generated 35% of leads with industry-leading open rates of 28% and click-through rates of 4.2%, Social media campaigns contributed 28% with exceptional engagement on LinkedIn and Instagram, Paid search (PPC) delivered 22% with improved quality scores reducing cost per click by 25%, Content marketing brought in 10% with high-quality inbound leads, and Organic search accounted for 5% showing steady growth as SEO initiatives matured.

Quarterly Lead Generation Trends
Lead volume grew consistently throughout the year demonstrating strong momentum and effective optimization. Q1 generated 1,200 qualified leads establishing our baseline performance, Q2 reached 1,850 leads reflecting campaign optimizations and seasonal factors, Q3 achieved 2,400 leads driven by product launch campaigns and expanded targeting, and Q4 peaked at 3,100 leads representing a 158% increase from Q1 to Q4. Lead quality metrics also improved with 42% of leads reaching qualified opportunity stage versus 28% in prior year.

Email Marketing Excellence
Email marketing remained our highest performing channel with sophisticated segmentation and personalization strategies. We deployed 156 campaigns reaching 85,000 subscribers, achieving 28% average open rates and 4.2% click-through rates, both significantly above industry benchmarks. Automated nurture sequences converted 15% of leads into opportunities. A/B testing of subject lines, send times, and content formats improved engagement by 35%. Re-engagement campaigns recovered 2,400 inactive subscribers.

Social Media Strategy and Growth
Social media presence expanded dramatically across platforms with follower growth of 215% and engagement rates 3x industry average. LinkedIn generated 45% of social leads through thought leadership content and executive visibility programs. Instagram visual storytelling campaigns achieved 8.5% engagement rate with younger buyer segments. Twitter drove real-time engagement during industry events. Influencer partnerships expanded reach by 180,000 impressions monthly.

Paid Search and PPC Optimization
Paid search campaigns achieved 22% lead contribution with continuous optimization improving efficiency. Total ad spend of $180,000 generated 2,340 qualified leads at $77 average cost per lead. Quality score improvements reduced cost per click by 25% while improving ad positions. Conversion rate optimization increased landing page conversion from 8% to 12%. Negative keyword refinement reduced wasted spend by 30%. Remarketing campaigns achieved 4.5x return on ad spend.

Content Marketing Strategy and Impact
Content marketing established thought leadership while generating high-quality inbound leads. We published 120 blog posts averaging 2,500 views and 4.2% conversion rate. Ultimate guides and e-books generated 1,850 leads with excellent engagement metrics. Case studies showcasing customer success drove 680 enterprise leads. Webinar series attracted 850 registrants with 68% attendance and 25% conversion to opportunities. Podcast launched in Q3 downloaded 12,000 times building brand awareness in new segments.

SEO Performance and Organic Growth
Search engine optimization efforts delivered steady organic traffic growth and improved rankings for target keywords. Organic traffic increased 125% year-over-year with 85,000 monthly visitors by Q4. Page one rankings achieved for 45 high-value keywords versus 18 at year start. Technical SEO improvements reduced page load time by 40% and fixed 350 crawl errors. Content optimization increased average time on site by 55%. Local SEO initiatives improved map pack visibility for regional searches.

Video Marketing and Visual Content
Video content emerged as high-performing format with exceptional engagement and lead generation. Product demo videos reached 45,000 total views with 6.8% engagement rate and 12% conversion to trial signups. Customer testimonial videos built trust and credibility with prospects. Animated explainer videos simplified complex concepts achieving 8,200 views and 15% lead conversion. YouTube channel grew to 5,400 subscribers with steady monthly growth. Short-form social videos generated 280,000 impressions.

Marketing Automation and Lead Nurturing
Marketing automation platform implementation transformed lead management and nurturing capabilities. We deployed 25 automated workflows spanning welcome series, product education, event follow-up, and re-engagement campaigns. Lead scoring model identified sales-ready leads with 85% accuracy, improving sales efficiency. Behavioral triggers delivered personalized content based on prospect actions and interests. Automated reporting provided real-time visibility into campaign performance and pipeline contribution.

Content Engagement and ROI Metrics
Our content strategy delivered measurable results across all formats and channels. Blog posts averaged 2,500 views per article with 4.2% conversion rate generating 480 leads. Video content reached 45,000 total views with 6.8% engagement rate driving product awareness. Infographics generated 12,000 shares across platforms expanding brand reach. Webinars attracted 850 registrants with 68% attendance rate producing high-quality leads. Interactive tools and calculators engaged 3,200 visitors with 18% lead capture rate.

Marketing Investment and Returns
Total marketing spend of $420,000 generated $2.1M in attributed revenue, delivering a 5:1 ROI that exceeded our 4:1 target. Cost per lead decreased from $85 in Q1 to $52 in Q4 reflecting optimization and scale efficiencies, while customer acquisition cost improved from $340 to $280, demonstrating increasing efficiency in our marketing operations. Marketing contributed to 68% of total pipeline value. Channel attribution analysis revealed multi-touch customer journeys averaging 7 touchpoints before conversion, validating integrated marketing approach.`,
    
    environment: `Sustainable Business Practices for a Greener Future

The Business Case for Sustainability
Environmental sustainability has become a business imperative as consumers, investors, and regulators demand responsible corporate behavior. Companies that embrace sustainable practices gain competitive advantages while contributing to global environmental goals. Market research shows 73% of consumers prefer purchasing from sustainable brands, while 85% of investors consider ESG factors in investment decisions. Sustainable businesses outperform peers by 15% in long-term value creation and demonstrate greater resilience during economic disruptions.

Carbon Footprint Reduction Strategies
Key areas for action include reducing carbon footprint through energy efficiency and renewable energy adoption. Companies are conducting comprehensive carbon audits to establish baselines and identify reduction opportunities. Transitioning to LED lighting, upgrading HVAC systems, and implementing smart building technologies reduce energy consumption by 30-40%. Installing solar panels and purchasing renewable energy credits help businesses achieve carbon neutrality. Many leading companies have committed to net-zero emissions by 2040.

Circular Economy and Waste Reduction
Implementing circular economy principles to minimize waste transforms business models from linear take-make-dispose to regenerative systems. Companies are redesigning products for durability, repairability, and recyclability, extending product lifecycles by 3-5 years. Product-as-a-service models retain ownership and responsibility for end-of-life processing. Waste audit programs identify opportunities to reduce, reuse, and recycle materials, with leading companies achieving 95% landfill diversion rates. Industrial symbiosis programs convert waste streams into valuable inputs for other processes.

Sustainable Supply Chain Management
Sustainable supply chain management with ethical sourcing ensures environmental responsibility extends beyond company boundaries. Supplier sustainability assessments evaluate environmental performance, labor practices, and governance standards. Partnership programs help suppliers improve sustainability through shared best practices, joint investments, and long-term commitments. Blockchain technology provides transparency and traceability for sustainable materials. Transportation optimization reduces logistics emissions by consolidating shipments and using efficient routing algorithms.

Water Conservation and Management
Water conservation in operations and products addresses growing water scarcity challenges worldwide. Water audits identify consumption patterns and reduction opportunities across facilities. Low-flow fixtures, recycling systems, and process optimization reduce water usage by 35-50%. Rainwater harvesting and greywater systems provide alternative water sources. Product design innovations reduce water consumption during customer use phase. Companies in water-stressed regions implement comprehensive water stewardship programs engaging local communities and ecosystems.

Sustainable Product Design and Innovation
Product innovation focused on sustainability creates differentiation and meets evolving customer expectations. Design for environment principles minimize material use, eliminate toxic substances, and enable recycling. Bio-based and recycled materials replace virgin plastics and traditional materials. Modular design facilitates repair and upgrades rather than replacement. Life cycle assessments quantify environmental impacts from raw material extraction through end-of-life, informing design decisions that reduce overall footprint by 40%.

Business Benefits and Competitive Advantages
Business benefits of sustainability include cost savings through resource efficiency reducing operational expenses by 20-30%, enhanced brand reputation and customer loyalty driving 15% revenue premiums, access to green financing and investment at favorable terms, improved risk management and regulatory compliance avoiding penalties and disruptions, and attraction of top talent who value corporate responsibility with 70% of millennial workers preferring sustainable employers. Sustainable companies demonstrate higher profitability and lower volatility.

Employee Engagement and Culture
Building sustainability culture requires employee engagement across all organizational levels. Sustainability training programs educate employees about environmental impacts and their role in solutions. Green teams comprised of volunteer employee champions drive grassroots initiatives and innovation. Recognition programs celebrate sustainability achievements and promote best practices. Incorporating sustainability into performance evaluations and compensation aligns individual incentives with corporate goals. Employee engagement in sustainability initiatives correlates with 25% higher job satisfaction.

Stakeholder Collaboration and Partnerships
Effective sustainability requires collaboration with diverse stakeholders including customers, suppliers, communities, NGOs, and government agencies. Multi-stakeholder initiatives address systemic challenges beyond single company capabilities. Industry coalitions establish common standards and drive collective progress. Community partnerships address local environmental and social issues while building goodwill. Engaging investors through transparent ESG reporting and dialogue attracts sustainability-focused capital. Customer co-creation programs develop sustainable solutions meeting real needs.

Measurement, Reporting and Transparency
Transparent reporting of progress and challenges builds credibility and accountability. Companies adopt standardized frameworks including GRI, SASB, and TCFD for consistent sustainability disclosure. Key performance indicators track energy use, emissions, waste, water consumption, and social metrics with year-over-year comparisons. Third-party verification and audits ensure data accuracy and credibility. Integrated reports connect sustainability performance to financial results and strategic priorities. Digital dashboards provide real-time visibility enabling rapid response and continuous improvement.

Implementation Roadmap and Success Factors
Implementation strategies involve setting measurable sustainability goals with clear timelines aligned to science-based targets, conducting environmental impact assessments establishing baselines and priorities, engaging stakeholders in sustainability initiatives building broad support, transparent reporting of progress and challenges maintaining accountability, and continuous innovation in sustainable products and processes driving competitive advantage. Leadership commitment and employee engagement are essential for success. Companies achieving sustainability excellence demonstrate CEO sponsorship, board oversight, cross-functional collaboration, adequate resource allocation, and integration of sustainability into core business strategy and operations.`
};

/**
 * Loads example templates from API
 */
async function loadExampleTemplates() {
    try {
        const response = await fetch('/api/examples');
        if (response.ok) {
            const templates = await response.json();
            // Convert API format to internal format
            exampleTemplates = {};
            for (const [key, template] of Object.entries(templates)) {
                exampleTemplates[key] = template.content;
            }
            console.log('✓ Example templates loaded from prompts.json via API');
            console.log('  Categories:', Object.keys(exampleTemplates).join(', '));
        } else {
            console.warn('⚠️ Failed to load example templates from API, using fallback');
            exampleTemplates = FALLBACK_exampleTemplates;
        }
    } catch (error) {
        console.warn('⚠️ Error loading example templates:', error.message);
        exampleTemplates = FALLBACK_exampleTemplates;
    }
}

/**
 * Loads an example by category
 * @param {string} category - Example category
 */
function loadExampleByCategory(category) {
    const text = exampleTemplates[category];
    if (text) {
        document.getElementById('textInput').value = text;
        
        // Clear preview cache for this content to force fresh generation
        if (typeof clearPreviewCacheForText === 'function') {
            clearPreviewCacheForText(text);
            console.log('🗑️ Cleared cache for new example to ensure fresh preview');
        }
        
        // Clear current slide data to force new generation
        window.currentSlideData = null;
        
        // Hide preview sections until new preview is generated
        const modificationSection = document.getElementById('modificationSection');
        const generatePptSection = document.getElementById('generatePptSection');
        if (modificationSection) modificationSection.style.display = 'none';
        
        // Keep generatePptSection visible if it has download buttons
        if (generatePptSection) {
            const hasDownloadButtons = generatePptSection.querySelector('.download-link, .presentation-options');
            if (!hasDownloadButtons) {
                generatePptSection.style.display = 'none';
            }
        }
        
        // Clear preview area (but keep download buttons in generatePptSection)
        const preview = document.getElementById('preview');
        if (preview) {
            preview.innerHTML = '';
        }
        
        // Keep download buttons and options in generatePptSection
        // They will be replaced when new PowerPoint is generated
        
        window.showStatus(`📝 ${category.charAt(0).toUpperCase() + category.slice(1)} example loaded. Click "Generate Preview" for fresh slides!`, 'success');
    }
}

// Load examples on page load
document.addEventListener('DOMContentLoaded', () => {
    loadExampleTemplates();
});

// ========================================
// OUTPUT TYPE SELECTION
// ========================================

/**
 * Selects output file type (pptx, docx, xlsx)
 * @param {string} type - File type
 */
function selectOutputType(type) {
    window.selectedOutputType = type;
    localStorage.setItem('selected_output_type', type);
    
    // Update UI feedback
    const labels = document.querySelectorAll('.file-type-option');
    labels.forEach(label => {
        const input = label.querySelector('input[type="radio"]');
        if (input && input.value === type) {
            label.style.background = 'rgba(255, 154, 86, 0.2)';
        } else {
            label.style.background = '';
        }
    });
    
    console.log('✓ Output type selected:', type);
    window.showStatus(`📄 Output type set to ${type.toUpperCase()}`, 'success');
}

/**
 * Gets current output type
 */
function getOutputType() {
    return window.selectedOutputType || 'pptx';
}

// ========================================
// TIME TRACKING UTILITIES
// ========================================

/**
 * Starts time tracking for generation process
 */
function startTimeTracking() {
    window.generationStartTime = Date.now();
    window.timeTrackingSteps = [];
    console.log('⏱️ Time tracking started');
}

/**
 * Adds a time tracking step
 * @param {string} stepName - Name of the step
 * @param {string} description - Step description
 */
function addTimeStep(stepName, description) {
    if (!window.generationStartTime) return;
    
    const elapsed = Date.now() - window.generationStartTime;
    const step = {
        name: stepName,
        description: description,
        elapsed: elapsed,
        timestamp: Date.now()
    };
    
    window.timeTrackingSteps.push(step);
    console.log(`⏱️ [${formatTime(elapsed)}] ${stepName}: ${description}`);
    
    // Update UI if time tracker exists
    updateTimeTrackerUI();
}

/**
 * Gets total elapsed time
 */
function getElapsedTime() {
    if (!window.generationStartTime) return 0;
    return Date.now() - window.generationStartTime;
}

/**
 * Formats milliseconds to readable time
 * @param {number} ms - Milliseconds
 */
function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
}

/**
 * Updates time tracker UI
 */
function updateTimeTrackerUI() {
    const tracker = document.getElementById('timeTracker');
    if (!tracker) return;
    
    const elapsed = getElapsedTime();
    const elapsedEl = document.getElementById('timeElapsed');
    if (elapsedEl) {
        elapsedEl.textContent = formatTime(elapsed);
    }
    
    // Update steps
    const stepsContainer = document.getElementById('timeTrackerSteps');
    if (stepsContainer && window.timeTrackingSteps.length > 0) {
        const lastStep = window.timeTrackingSteps[window.timeTrackingSteps.length - 1];
        const stepEl = document.querySelector(`[data-step="${lastStep.name}"]`);
        if (stepEl) {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
            const durationEl = stepEl.querySelector('.step-duration');
            if (durationEl) {
                const duration = lastStep.elapsed - (window.timeTrackingSteps[window.timeTrackingSteps.length - 2]?.elapsed || 0);
                durationEl.textContent = formatTime(duration);
            }
        }
        
        // Mark next step as active
        const nextStepIndex = window.timeTrackingSteps.length;
        const allSteps = stepsContainer.querySelectorAll('.time-step');
        if (allSteps[nextStepIndex]) {
            allSteps[nextStepIndex].classList.add('active');
        }
    }
}

/**
 * Creates time tracker HTML
 */
function createTimeTrackerHTML() {
    return `
        <div class="time-tracker" id="timeTracker">
            <div class="time-tracker-header">
                <span class="time-tracker-title">⏱️ Generation Progress</span>
                <span class="time-elapsed" id="timeElapsed">0s</span>
            </div>
            <div class="time-tracker-steps" id="timeTrackerSteps">
                <div class="time-step active" data-step="init">
                    <span>🚀 Initializing AI analysis</span>
                    <span class="step-duration"></span>
                </div>
                <div class="time-step" data-step="content">
                    <span>📝 Extracting content structure</span>
                    <span class="step-duration"></span>
                </div>
                <div class="time-step" data-step="data">
                    <span>📊 Processing data for charts</span>
                    <span class="step-duration"></span>
                </div>
                <div class="time-step" data-step="design">
                    <span>🎨 Creating slide layouts</span>
                    <span class="step-duration"></span>
                </div>
                <div class="time-step" data-step="render">
                    <span>✨ Rendering previews</span>
                    <span class="step-duration"></span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Stops time tracking
 */
function stopTimeTracking() {
    if (!window.generationStartTime) return;
    
    const totalTime = getElapsedTime();
    console.log('⏱️ Time tracking completed - Total:', formatTime(totalTime));
    console.log('⏱️ Steps breakdown:');
    window.timeTrackingSteps.forEach(step => {
        console.log(`   ${step.name}: ${step.description} (${formatTime(step.elapsed)})`);
    });
    
    return {
        totalTime,
        steps: window.timeTrackingSteps
    };
}

// ========================================
// EXPORTS
// ========================================

window.toggleSettingsSection = toggleSettingsSection;
window.selectProvider = selectProvider;
window.selectImageProvider = selectImageProvider;
window.getImageProvider = getImageProvider;
window.saveApiKey = saveApiKey;
window.loadExampleByCategory = loadExampleByCategory;
window.selectOutputType = selectOutputType;
window.getOutputType = getOutputType;
window.startTimeTracking = startTimeTracking;
window.addTimeStep = addTimeStep;
window.getElapsedTime = getElapsedTime;
window.formatTime = formatTime;
window.createTimeTrackerHTML = createTimeTrackerHTML;
window.stopTimeTracking = stopTimeTracking;

// Immediate diagnostic
console.log('✅ app.js loaded - window.loadExampleByCategory:', typeof window.loadExampleByCategory);

