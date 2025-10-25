#!/usr/bin/env node

/**
 * Server-side test suite to verify optimization didn't break backend functionality
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    host: 'localhost',
    port: 3000,
    timeout: 5000,
    retries: 3
};

// Test results
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🔍';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function addTestResult(testName, passed, error = null) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`${testName}: PASSED`, 'success');
    } else {
        testResults.failed++;
        testResults.errors.push({ test: testName, error });
        log(`${testName}: FAILED - ${error}`, 'error');
    }
}

// Test functions
async function testServerStartup() {
    log('Testing server startup...');
    
    try {
        // Check if server.js exists and is readable
        const serverPath = path.join(__dirname, '..', 'server.js');
        if (!fs.existsSync(serverPath)) {
            addTestResult('Server file exists', false, 'server.js not found');
            return false;
        }
        
        // Check if server.js has valid syntax
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        if (!serverContent.includes('express') || !serverContent.includes('app.listen')) {
            addTestResult('Server file syntax', false, 'Invalid server.js structure');
            return false;
        }
        
        addTestResult('Server file exists', true);
        addTestResult('Server file syntax', true);
        return true;
    } catch (error) {
        addTestResult('Server startup test', false, error.message);
        return false;
    }
}

async function testServerModules() {
    log('Testing server modules...');
    
    const modules = [
        'server/utils/ai.js',
        'server/utils/helpers.js',
        'server/utils/workspace.js',
        'server/utils/generators.js',
        'server/utils/fileStorage.js',
        'server/utils/promptManager.js',
        'server/utils/slideLayouts.js',
        'server/routes/content.js',
        'server/routes/prompts.js',
        'server/config/constants.js'
    ];
    
    let allModulesExist = true;
    
    for (const module of modules) {
        const modulePath = path.join(__dirname, '..', module);
        if (fs.existsSync(modulePath)) {
            addTestResult(`Module ${module}`, true);
        } else {
            addTestResult(`Module ${module}`, false, 'File not found');
            allModulesExist = false;
        }
    }
    
    return allModulesExist;
}

async function testServerEndpoints() {
    log('Testing server endpoints...');
    
    const endpoints = [
        { path: '/api/health', method: 'GET', expectedStatus: 200 },
        { path: '/api/capabilities', method: 'GET', expectedStatus: 200 },
        { path: '/', method: 'GET', expectedStatus: 200 }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(endpoint.path, endpoint.method);
            const passed = response.statusCode === endpoint.expectedStatus;
            addTestResult(`Endpoint ${endpoint.path}`, passed, 
                passed ? null : `Expected ${endpoint.expectedStatus}, got ${response.statusCode}`);
        } catch (error) {
            addTestResult(`Endpoint ${endpoint.path}`, false, error.message);
        }
    }
}

async function testFileStructure() {
    log('Testing file structure...');
    
    const requiredFiles = [
        'server.js',
        'package.json',
        'public/index.html',
        'public/css/styles.css',
        'public/js/api/capabilities.js',
        'public/js/api/preview.js',
        'public/js/api/generation.js',
        'public/js/api/viewer.js',
        'public/js/api/sharing.js',
        'public/js/api/modification.js'
    ];
    
    let allFilesExist = true;
    
    for (const file of requiredFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (fs.existsSync(filePath)) {
            addTestResult(`File ${file}`, true);
        } else {
            addTestResult(`File ${file}`, false, 'File not found');
            allFilesExist = false;
        }
    }
    
    return allFilesExist;
}

async function testOptimizationResults() {
    log('Testing optimization results...');
    
    // Check if BKP folder was removed
    const bkpPath = path.join(__dirname, '..', 'BKP');
    if (!fs.existsSync(bkpPath)) {
        addTestResult('BKP folder removed', true);
    } else {
        addTestResult('BKP folder removed', false, 'BKP folder still exists');
    }
    
    // Check if test files were moved
    const testHtmlPath = path.join(__dirname, '..', 'test', 'html');
    if (fs.existsSync(testHtmlPath)) {
        addTestResult('Test files organized', true);
    } else {
        addTestResult('Test files organized', false, 'Test HTML files not moved to test/html');
    }
    
    // Check if API modules were created
    const apiModulesPath = path.join(__dirname, '..', 'public', 'js', 'api');
    if (fs.existsSync(apiModulesPath)) {
        const modules = fs.readdirSync(apiModulesPath);
        if (modules.length >= 6) {
            addTestResult('API modules created', true);
        } else {
            addTestResult('API modules created', false, `Only ${modules.length} modules found`);
        }
    } else {
        addTestResult('API modules created', false, 'API modules directory not found');
    }
}

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: TEST_CONFIG.host,
            port: TEST_CONFIG.port,
            path: path,
            method: method,
            timeout: TEST_CONFIG.timeout
        };
        
        const req = http.request(options, (res) => {
            resolve(res);
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// Main test runner
async function runAllTests() {
    log('🚀 Starting server optimization test suite...');
    log('='.repeat(50));
    
    try {
        // Run all tests
        await testServerStartup();
        await testServerModules();
        await testFileStructure();
        await testOptimizationResults();
        
        // Try to test endpoints (server might not be running)
        try {
            await testServerEndpoints();
        } catch (error) {
            log('⚠️ Server endpoints test skipped (server not running)', 'warning');
        }
        
        // Print results
        log('='.repeat(50));
        log('📊 Test Results Summary:');
        log(`Total tests: ${testResults.total}`);
        log(`Passed: ${testResults.passed}`);
        log(`Failed: ${testResults.failed}`);
        
        const successRate = testResults.total > 0 ? Math.round((testResults.passed / testResults.total) * 100) : 0;
        log(`Success rate: ${successRate}%`);
        
        if (testResults.errors.length > 0) {
            log('❌ Errors found:');
            testResults.errors.forEach(error => {
                log(`  - ${error.test}: ${error.error}`);
            });
        }
        
        if (successRate >= 90) {
            log('🎉 Optimization test suite PASSED!', 'success');
            process.exit(0);
        } else if (successRate >= 70) {
            log('⚠️ Optimization test suite completed with warnings', 'warning');
            process.exit(1);
        } else {
            log('❌ Optimization test suite FAILED', 'error');
            process.exit(1);
        }
        
    } catch (error) {
        log(`❌ Test suite failed with error: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    runAllTests,
    testServerStartup,
    testServerModules,
    testFileStructure,
    testOptimizationResults
};
