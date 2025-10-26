/**
 * Application Configuration Constants
 * Centralized configuration to avoid magic numbers and strings
 */

// ========================================
// SERVER CONFIGURATION
// ========================================

const SERVER_CONFIG = {
    PORT: 3000,
    BODY_LIMIT: '50mb',
    FILE_SIZE_LIMIT: 50 * 1024 * 1024, // 50MB
    WORKSPACE_DIR: 'workspace',
    CLEANUP_DELAY: 5000, // 5 seconds
    // Base URL for shareable links - uses environment variable or auto-detects from request
    // Set BASE_URL environment variable to override (e.g., BASE_URL=https://genis.ai)
    BASE_URL: process.env.BASE_URL || null, // null = auto-detect from request
    TIMEOUT: {
        NPM_INSTALL: 120000, // 2 minutes
        CONVERSION: 60000,   // 1 minute
    }
};

// ========================================
// AI PROVIDER CONFIGURATION
// ========================================

const AI_PROVIDERS = {
    BEDROCK: {
        name: 'bedrock',
        // Use global model ID (no region prefix)
        model: 'anthropic.claude-sonnet-4-5-20250929-v1:0',
        endpoint: 'https://bedrock-runtime.us-east-1.amazonaws.com/model',
        maxTokens: 8192,
        envVar: 'bedrock' // Uses environment variable instead of user-provided key
    },
    ANTHROPIC: {
        name: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        model: 'claude-sonnet-4-20250514',
        maxTokens: 4000,
        version: '2023-06-01'
    },
    OPENAI: {
        name: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o',
        maxTokens: 4000
    },
    GEMINI: {
        name: 'gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
        maxTokens: 4000
    },
    OPENROUTER: {
        name: 'openrouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: 'anthropic/claude-3.5-sonnet',
        referer: 'http://localhost:3000',
        title: 'AI Text2PPT Pro'
    }
};

// ========================================
// POWERPOINT CONFIGURATION
// ========================================

const PPTX_CONFIG = {
    LAYOUT: 'LAYOUT_16x9',
    DIMENSIONS: {
        WIDTH: 960,
        HEIGHT: 540
    },
    PADDING: {
        STANDARD: '2rem',
        BOTTOM: '3rem',
        SIDES: '2rem'
    },
    GLOBAL_MODULES_PATH: '/usr/local/lib/node_modules',
    REQUIRED_PACKAGES: ['pptxgenjs', '@ant/html2pptx', 'jszip', 'sharp', 'playwright']
};

// ========================================
// CHART CONFIGURATION
// ========================================

const CHART_TYPES = {
    BAR: 'bar',
    COLUMN: 'column',
    LINE: 'line',
    PIE: 'pie',
    AREA: 'area'
};

const CHART_COLORS = ['#667eea', '#764ba2', '#f39c12', '#2ecc71', '#e74c3c', '#3498db'];

// ========================================
// FILE TYPE CONFIGURATION
// ========================================

const ACCEPTED_FILE_TYPES = {
    TEXT: ['.txt', '.md'],
    DOCUMENTS: ['.doc', '.docx', '.pdf'],
    PRESENTATIONS: ['.pptx', '.ppt']
};

const ALL_ACCEPTED_TYPES = [
    ...ACCEPTED_FILE_TYPES.TEXT,
    ...ACCEPTED_FILE_TYPES.DOCUMENTS,
    ...ACCEPTED_FILE_TYPES.PRESENTATIONS
];

// ========================================
// SLIDE LAYOUT TYPES
// ========================================

const LAYOUT_TYPES = {
    BULLETS: 'bullets',
    TWO_COLUMN: 'two-column',
    THREE_COLUMN: 'three-column',
    FRAMEWORK: 'framework',
    PROCESS_FLOW: 'process-flow',
    CHART: 'chart'
};

// ========================================
// THEME KEYWORDS (for color extraction)
// ========================================

const THEME_KEYWORDS = {
    FINANCE: ['finance', 'bank', 'invest', 'trading', 'stock'],
    HEALTHCARE: ['health', 'medical', 'clinic', 'hospital', 'patient'],
    TECH: ['tech', 'software', 'digital', 'app', 'code', 'ai'],
    MARKETING: ['market', 'sales', 'campaign', 'brand', 'advertising'],
    ENVIRONMENT: ['green', 'eco', 'sustain', 'environment', 'climate'],
    EDUCATION: ['education', 'school', 'learning', 'university', 'training']
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
    SERVER_CONFIG,
    AI_PROVIDERS,
    PPTX_CONFIG,
    CHART_TYPES,
    CHART_COLORS,
    ACCEPTED_FILE_TYPES,
    ALL_ACCEPTED_TYPES,
    LAYOUT_TYPES,
    THEME_KEYWORDS
};

