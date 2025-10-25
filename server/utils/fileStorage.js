/**
 * File Storage Utility
 * Handles storing and serving generated presentations (PPTX and PDF)
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Base directories
const WORKSPACE_DIR = path.join(__dirname, '../../workspace');
const GENERATED_DIR = path.join(WORKSPACE_DIR, 'generated');
const SHARED_DIR = path.join(WORKSPACE_DIR, 'shared');

// File retention periods (milliseconds)
const RETENTION = {
    GENERATED: 24 * 60 * 60 * 1000,      // 24 hours for generated files
    SHARED: 7 * 24 * 60 * 60 * 1000      // 7 days for shared presentations
};

/**
 * Initialize storage directories
 */
async function initializeStorage() {
    try {
        await fs.mkdir(WORKSPACE_DIR, { recursive: true });
        await fs.mkdir(GENERATED_DIR, { recursive: true });
        await fs.mkdir(SHARED_DIR, { recursive: true });
        console.log('✅ Storage directories initialized');
    } catch (error) {
        console.error('❌ Failed to initialize storage:', error);
        throw error;
    }
}

/**
 * Save presentation file
 * @param {string} sessionId - Unique session identifier
 * @param {Buffer} pptxBuffer - PowerPoint file buffer
 * @param {Object} metadata - Presentation metadata
 * @returns {Object} - File paths and URLs
 */
async function savePresentation(sessionId, pptxBuffer, metadata = {}) {
    try {
        const sessionDir = path.join(GENERATED_DIR, sessionId);
        await fs.mkdir(sessionDir, { recursive: true });
        
        const pptxPath = path.join(sessionDir, 'presentation.pptx');
        await fs.writeFile(pptxPath, pptxBuffer);
        
        // Save metadata
        const metadataPath = path.join(sessionDir, 'metadata.json');
        const metadataContent = {
            sessionId,
            title: metadata.title || 'AI Presentation',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + RETENTION.GENERATED).toISOString(),
            pptxSize: pptxBuffer.length,
            downloads: 0,
            ...metadata
        };
        await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
        
        console.log(`✅ Saved presentation: ${sessionId} (${(pptxBuffer.length / 1024).toFixed(2)} KB)`);
        
        return {
            sessionId,
            pptxPath,
            downloadUrl: `/download/${sessionId}/presentation.pptx`,
            viewerUrl: `/download/${sessionId}/presentation.pdf`,
            metadata: metadataContent
        };
    } catch (error) {
        console.error('❌ Failed to save presentation:', error);
        throw error;
    }
}

/**
 * Convert PPTX to PDF using LibreOffice
 * @param {string} pptxPath - Path to PPTX file
 * @returns {string} - Path to generated PDF
 */
async function convertToPDF(pptxPath) {
    try {
        const outputDir = path.dirname(pptxPath);
        
        console.log(`🔄 Converting to PDF: ${path.basename(pptxPath)}`);
        
        // Check if LibreOffice is available
        try {
            await execAsync('soffice --version');
        } catch (error) {
            console.warn('⚠️ LibreOffice not found, PDF conversion unavailable');
            throw new Error('PDF conversion not available - LibreOffice not installed');
        }
        
        // Convert using LibreOffice headless mode
        const command = `soffice --headless --convert-to pdf --outdir "${outputDir}" "${pptxPath}"`;
        
        const { stdout, stderr } = await execAsync(command, {
            timeout: 120000  // 2 minutes timeout
        });
        
        if (stderr && !stderr.includes('Warning')) {
            console.warn('LibreOffice stderr:', stderr);
        }
        
        const pdfPath = pptxPath.replace('.pptx', '.pdf');
        
        // Verify PDF was created
        try {
            const stats = await fs.stat(pdfPath);
            console.log(`✅ PDF created: ${(stats.size / 1024).toFixed(2)} KB`);
            
            // Update metadata
            const metadataPath = path.join(outputDir, 'metadata.json');
            try {
                const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
                metadata.pdfSize = stats.size;
                metadata.pdfCreatedAt = new Date().toISOString();
                await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            } catch (metaError) {
                // Metadata update is optional
            }
            
            return pdfPath;
        } catch (statError) {
            throw new Error('PDF conversion failed - output file not found');
        }
        
    } catch (error) {
        console.error('❌ PDF conversion error:', error);
        throw error;
    }
}

/**
 * Get file from storage
 * @param {string} sessionId - Session identifier
 * @param {string} filename - File name (presentation.pptx or presentation.pdf)
 * @returns {Object} - File buffer and metadata
 */
async function getFile(sessionId, filename) {
    try {
        // Try generated directory first
        let filePath = path.join(GENERATED_DIR, sessionId, filename);
        
        try {
            const fileBuffer = await fs.readFile(filePath);
            const metadata = await getMetadata(sessionId, 'generated');
            
            // Increment download counter
            metadata.downloads = (metadata.downloads || 0) + 1;
            await saveMetadata(sessionId, metadata, 'generated');
            
            return { fileBuffer, metadata };
        } catch (error) {
            // Try shared directory
            filePath = path.join(SHARED_DIR, sessionId, filename);
            const fileBuffer = await fs.readFile(filePath);
            const metadata = await getMetadata(sessionId, 'shared');
            
            metadata.downloads = (metadata.downloads || 0) + 1;
            await saveMetadata(sessionId, metadata, 'shared');
            
            return { fileBuffer, metadata };
        }
    } catch (error) {
        console.error(`❌ File not found: ${sessionId}/${filename}`);
        throw new Error('File not found or expired');
    }
}

/**
 * Save shared presentation
 * @param {string} shareId - Share identifier
 * @param {Buffer} pptxBuffer - PowerPoint buffer
 * @param {Object} slideData - Slide data for re-generation
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Share information
 */
async function saveSharedPresentation(shareId, pptxBuffer, slideData, metadata = {}) {
    try {
        const shareDir = path.join(SHARED_DIR, shareId);
        await fs.mkdir(shareDir, { recursive: true });
        
        const pptxPath = path.join(shareDir, 'presentation.pptx');
        await fs.writeFile(pptxPath, pptxBuffer);
        
        // Save slide data for modifications
        const slideDataPath = path.join(shareDir, 'slideData.json');
        await fs.writeFile(slideDataPath, JSON.stringify(slideData, null, 2));
        
        // Save metadata
        const metadataContent = {
            shareId,
            title: metadata.title || 'AI Presentation',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + RETENTION.SHARED).toISOString(),
            pptxSize: pptxBuffer.length,
            views: 0,
            downloads: 0,
            ...metadata
        };
        
        const metadataPath = path.join(shareDir, 'metadata.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadataContent, null, 2));
        
        console.log(`✅ Saved shared presentation: ${shareId}`);
        
        return {
            shareId,
            pptxPath,
            downloadUrl: `/download/${shareId}/presentation.pptx`,
            pdfUrl: `/download/${shareId}/presentation.pdf`,
            metadata: metadataContent
        };
    } catch (error) {
        console.error('❌ Failed to save shared presentation:', error);
        throw error;
    }
}

/**
 * Get metadata for a session
 * @param {string} sessionId - Session identifier
 * @param {string} type - 'generated' or 'shared'
 * @returns {Object} - Metadata object
 */
async function getMetadata(sessionId, type = 'generated') {
    try {
        const baseDir = type === 'shared' ? SHARED_DIR : GENERATED_DIR;
        const metadataPath = path.join(baseDir, sessionId, 'metadata.json');
        const content = await fs.readFile(metadataPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        return {};
    }
}

/**
 * Save metadata for a session
 * @param {string} sessionId - Session identifier
 * @param {Object} metadata - Metadata object
 * @param {string} type - 'generated' or 'shared'
 */
async function saveMetadata(sessionId, metadata, type = 'generated') {
    try {
        const baseDir = type === 'shared' ? SHARED_DIR : GENERATED_DIR;
        const metadataPath = path.join(baseDir, sessionId, 'metadata.json');
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
        console.error('Failed to save metadata:', error);
    }
}

/**
 * Get slide data for shared presentation
 * @param {string} shareId - Share identifier
 * @returns {Object} - Slide data
 */
async function getSharedSlideData(shareId) {
    try {
        const slideDataPath = path.join(SHARED_DIR, shareId, 'slideData.json');
        const content = await fs.readFile(slideDataPath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        throw new Error('Shared presentation not found or expired');
    }
}

/**
 * Update shared presentation
 * @param {string} shareId - Share identifier
 * @param {Object} slideData - Updated slide data
 */
async function updateSharedPresentation(shareId, slideData) {
    try {
        const slideDataPath = path.join(SHARED_DIR, shareId, 'slideData.json');
        await fs.writeFile(slideDataPath, JSON.stringify(slideData, null, 2));
        
        // Update metadata
        const metadata = await getMetadata(shareId, 'shared');
        metadata.updatedAt = new Date().toISOString();
        await saveMetadata(shareId, metadata, 'shared');
        
        console.log(`✅ Updated shared presentation: ${shareId}`);
    } catch (error) {
        console.error('❌ Failed to update shared presentation:', error);
        throw error;
    }
}

/**
 * Clean up old files
 * @param {string} type - 'generated' or 'shared'
 */
async function cleanupOldFiles(type = 'generated') {
    try {
        const baseDir = type === 'shared' ? SHARED_DIR : GENERATED_DIR;
        const maxAge = type === 'shared' ? RETENTION.SHARED : RETENTION.GENERATED;
        
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        let cleanedCount = 0;
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const sessionId = entry.name;
                const metadata = await getMetadata(sessionId, type);
                
                if (metadata.createdAt) {
                    const age = Date.now() - new Date(metadata.createdAt).getTime();
                    
                    if (age > maxAge) {
                        const sessionDir = path.join(baseDir, sessionId);
                        await fs.rm(sessionDir, { recursive: true, force: true });
                        cleanedCount++;
                        console.log(`🗑️ Cleaned up old ${type} session: ${sessionId}`);
                    }
                }
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`✅ Cleanup complete: Removed ${cleanedCount} old ${type} session(s)`);
        }
        
        return cleanedCount;
    } catch (error) {
        console.error(`❌ Cleanup error for ${type}:`, error);
        return 0;
    }
}

/**
 * Get storage statistics
 * @returns {Object} - Storage stats
 */
async function getStorageStats() {
    try {
        const stats = {
            generated: { count: 0, totalSize: 0 },
            shared: { count: 0, totalSize: 0 }
        };
        
        // Count generated files
        const generatedEntries = await fs.readdir(GENERATED_DIR, { withFileTypes: true });
        for (const entry of generatedEntries) {
            if (entry.isDirectory()) {
                stats.generated.count++;
                const size = await getDirectorySize(path.join(GENERATED_DIR, entry.name));
                stats.generated.totalSize += size;
            }
        }
        
        // Count shared files
        const sharedEntries = await fs.readdir(SHARED_DIR, { withFileTypes: true });
        for (const entry of sharedEntries) {
            if (entry.isDirectory()) {
                stats.shared.count++;
                const size = await getDirectorySize(path.join(SHARED_DIR, entry.name));
                stats.shared.totalSize += size;
            }
        }
        
        return stats;
    } catch (error) {
        console.error('❌ Failed to get storage stats:', error);
        return { generated: { count: 0, totalSize: 0 }, shared: { count: 0, totalSize: 0 } };
    }
}

/**
 * Get directory size
 * @param {string} dirPath - Directory path
 * @returns {number} - Size in bytes
 */
async function getDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const entryPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
                totalSize += await getDirectorySize(entryPath);
            } else {
                const stats = await fs.stat(entryPath);
                totalSize += stats.size;
            }
        }
    } catch (error) {
        // Ignore errors
    }
    
    return totalSize;
}

/**
 * Check if LibreOffice is available
 * @returns {boolean} - True if available
 */
async function checkLibreOffice() {
    try {
        await execAsync('soffice --version');
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Start auto-cleanup scheduler
 * Runs every hour to clean up old files
 */
function startAutoCleanup() {
    // Initial cleanup on start
    setTimeout(() => {
        cleanupOldFiles('generated');
        cleanupOldFiles('shared');
    }, 10000); // Wait 10 seconds after server start
    
    // Run every hour
    setInterval(async () => {
        console.log('🧹 Running scheduled cleanup...');
        const generatedCleaned = await cleanupOldFiles('generated');
        const sharedCleaned = await cleanupOldFiles('shared');
        
        if (generatedCleaned === 0 && sharedCleaned === 0) {
            console.log('✨ No files to clean');
        }
        
        // Log storage stats
        const stats = await getStorageStats();
        console.log('📊 Storage Stats:', {
            generated: `${stats.generated.count} files (${(stats.generated.totalSize / 1024 / 1024).toFixed(2)} MB)`,
            shared: `${stats.shared.count} files (${(stats.shared.totalSize / 1024 / 1024).toFixed(2)} MB)`,
            total: `${(stats.generated.totalSize + stats.shared.totalSize) / 1024 / 1024).toFixed(2)} MB`
        });
    }, 60 * 60 * 1000); // Every hour
    
    console.log('✅ Auto-cleanup scheduler started (runs every hour)');
}

module.exports = {
    initializeStorage,
    savePresentation,
    saveSharedPresentation,
    convertToPDF,
    getFile,
    getSharedSlideData,
    updateSharedPresentation,
    cleanupOldFiles,
    getStorageStats,
    checkLibreOffice,
    startAutoCleanup,
    GENERATED_DIR,
    SHARED_DIR
};

