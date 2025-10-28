/**
 * User Tracking Utility
 * Tracks user slide generation counts and other metrics
 */

const fs = require('fs').promises;
const path = require('path');

// Base directory for user tracking data
const TRACKING_DIR = path.join(__dirname, '../../workspace/tracking');

/**
 * Initialize tracking directory
 */
async function initializeTracking() {
    try {
        await fs.mkdir(TRACKING_DIR, { recursive: true });
        console.log('✅ User tracking directory initialized');
    } catch (error) {
        console.error('❌ Failed to initialize tracking directory:', error);
        throw error;
    }
}

/**
 * Get user tracking data
 * @param {string} userId - User identifier (email or sub from Auth0)
 * @returns {Object} - User tracking data
 */
async function getUserTracking(userId) {
    try {
        const trackingFile = path.join(TRACKING_DIR, `${userId}.json`);
        
        try {
            const data = await fs.readFile(trackingFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // File doesn't exist, return default tracking data
            return {
                userId,
                totalSlidesGenerated: 0,
                totalPresentationsGenerated: 0,
                firstGeneration: null,
                lastGeneration: null,
                createdAt: new Date().toISOString()
            };
        }
    } catch (error) {
        console.error('❌ Failed to get user tracking:', error);
        return {
            userId,
            totalSlidesGenerated: 0,
            totalPresentationsGenerated: 0,
            firstGeneration: null,
            lastGeneration: null,
            createdAt: new Date().toISOString()
        };
    }
}

/**
 * Update user tracking data
 * @param {string} userId - User identifier
 * @param {number} slidesGenerated - Number of slides generated
 * @param {Object} metadata - Additional metadata
 */
async function updateUserTracking(userId, slidesGenerated = 0, metadata = {}) {
    try {
        const trackingFile = path.join(TRACKING_DIR, `${userId}.json`);
        const currentData = await getUserTracking(userId);
        
        const updatedData = {
            ...currentData,
            totalSlidesGenerated: currentData.totalSlidesGenerated + slidesGenerated,
            totalPresentationsGenerated: currentData.totalPresentationsGenerated + 1,
            lastGeneration: new Date().toISOString(),
            firstGeneration: currentData.firstGeneration || new Date().toISOString(),
            ...metadata
        };
        
        await fs.writeFile(trackingFile, JSON.stringify(updatedData, null, 2));
        console.log(`✅ Updated tracking for user ${userId}: ${updatedData.totalSlidesGenerated} total slides`);
        
        return updatedData;
    } catch (error) {
        console.error('❌ Failed to update user tracking:', error);
        throw error;
    }
}

/**
 * Get user slide count for display
 * @param {string} userId - User identifier
 * @returns {number} - Total slides generated
 */
async function getUserSlideCount(userId) {
    try {
        const trackingData = await getUserTracking(userId);
        return trackingData.totalSlidesGenerated;
    } catch (error) {
        console.error('❌ Failed to get user slide count:', error);
        return 0;
    }
}

/**
 * Clean up old tracking data (optional)
 * @param {number} maxAge - Maximum age in milliseconds
 */
async function cleanupOldTracking(maxAge = 365 * 24 * 60 * 60 * 1000) { // 1 year default
    try {
        const files = await fs.readdir(TRACKING_DIR);
        const cutoffTime = Date.now() - maxAge;
        
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(TRACKING_DIR, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime.getTime() < cutoffTime) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Cleaned up old tracking file: ${file}`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Failed to cleanup tracking data:', error);
    }
}

module.exports = {
    initializeTracking,
    getUserTracking,
    updateUserTracking,
    getUserSlideCount,
    cleanupOldTracking
};
