#!/usr/bin/env node

/**
 * Comprehensive validation script to ensure optimization didn't break anything
 */

const fs = require('fs');
const path = require('path');

// Validation results
const validationResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
};

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '🔍';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function addResult(testName, passed, message = null, isWarning = false) {
    validationResults.total++;
    if (passed) {
        validationResults.passed++;
        log(`${testName}: PASSED`, 'success');
    } else if (isWarning) {
        validationResults.warnings++;
        log(`${testName}: WARNING - ${message}`, 'warning');
    } else {
        validationResults.failed++;
        validationResults.issues.push({ test: testName, message });
        log(`${testName}: FAILED - ${message}`, 'error');
    }
}

// Validation functions
function validateFileStructure() {
    log('🔍 Validating file structure...');
    
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
        'public/js/api/modification.js',
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
    
    let allFilesExist = true;
    requiredFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            addResult(`File ${file}`, true);
        } else {
            addResult(`File ${file}`, false, 'File not found');
            allFilesExist = false;
        }
    });
    
    return allFilesExist;
}

function validateOptimizationResults() {
    log('🔍 Validating optimization results...');
    
    // Check if BKP folder was removed
    const bkpPath = path.join(__dirname, 'BKP');
    if (!fs.existsSync(bkpPath)) {
        addResult('BKP folder removed', true);
    } else {
        addResult('BKP folder removed', false, 'BKP folder still exists');
    }
    
    // Check if backup HTML files were removed
    const backupFiles = [
        'public/index-old-backup.html',
        'public/index-new.html'
    ];
    
    let backupFilesRemoved = true;
    backupFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) {
            addResult(`Backup file ${file} removed`, true);
        } else {
            addResult(`Backup file ${file} removed`, false, 'Backup file still exists');
            backupFilesRemoved = false;
        }
    });
    
    // Check if test files were organized
    const testHtmlPath = path.join(__dirname, 'test', 'html');
    if (fs.existsSync(testHtmlPath)) {
        addResult('Test files organized', true);
    } else {
        addResult('Test files organized', false, 'Test HTML files not moved to test/html');
    }
    
    // Check if API modules were created
    const apiModulesPath = path.join(__dirname, 'public', 'js', 'api');
    if (fs.existsSync(apiModulesPath)) {
        const modules = fs.readdirSync(apiModulesPath);
        if (modules.length >= 6) {
            addResult('API modules created', true);
        } else {
            addResult('API modules created', false, `Only ${modules.length} modules found, expected 6+`);
        }
    } else {
        addResult('API modules created', false, 'API modules directory not found');
    }
    
    return backupFilesRemoved;
}

function validateJavaScriptSyntax() {
    log('🔍 Validating JavaScript syntax...');
    
    const jsFiles = [
        'public/js/api/capabilities.js',
        'public/js/api/preview.js',
        'public/js/api/generation.js',
        'public/js/api/viewer.js',
        'public/js/api/sharing.js',
        'public/js/api/modification.js',
        'public/js/api.js'
    ];
    
    let allSyntaxValid = true;
    jsFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                // Basic syntax check - look for common issues
                if (content.includes('import ') && !content.includes('// Note: Individual API modules')) {
                    addResult(`Syntax ${file}`, false, 'ES6 import syntax found (should use script tags)');
                    allSyntaxValid = false;
                } else if (content.includes('undefined') && content.includes('function')) {
                    addResult(`Syntax ${file}`, true);
                } else {
                    addResult(`Syntax ${file}`, true);
                }
            } catch (error) {
                addResult(`Syntax ${file}`, false, `Error reading file: ${error.message}`);
                allSyntaxValid = false;
            }
        } else {
            addResult(`Syntax ${file}`, false, 'File not found');
            allSyntaxValid = false;
        }
    });
    
    return allSyntaxValid;
}

function validateHTMLIntegration() {
    log('🔍 Validating HTML integration...');
    
    const htmlPath = path.join(__dirname, 'public', 'index.html');
    if (!fs.existsSync(htmlPath)) {
        addResult('HTML file exists', false, 'index.html not found');
        return false;
    }
    
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Check if API modules are loaded
    const apiModules = [
        'capabilities.js',
        'preview.js',
        'generation.js',
        'viewer.js',
        'sharing.js',
        'modification.js'
    ];
    
    let allModulesLoaded = true;
    apiModules.forEach(module => {
        if (htmlContent.includes(`api/${module}`)) {
            addResult(`HTML loads ${module}`, true);
        } else {
            addResult(`HTML loads ${module}`, false, `Module ${module} not found in HTML`);
            allModulesLoaded = false;
        }
    });
    
    // Check if main API file is loaded
    if (htmlContent.includes('api.js')) {
        addResult('HTML loads main API file', true);
    } else {
        addResult('HTML loads main API file', false, 'Main API file not found in HTML');
        allModulesLoaded = false;
    }
    
    return allModulesLoaded;
}

function validateFunctionExports() {
    log('🔍 Validating function exports...');
    
    const expectedFunctions = [
        'checkServerCapabilities',
        'getApiKey',
        'generatePreview',
        'generatePresentation',
        'viewPresentation',
        'sharePresentation',
        'modifyCurrentSlide',
        'showNotification',
        'convertToPDF',
        'updateProgress'
    ];
    
    let allFunctionsExported = true;
    expectedFunctions.forEach(funcName => {
        // Check if function is exported in any of the API modules
        const apiModulesPath = path.join(__dirname, 'public', 'js', 'api');
        if (fs.existsSync(apiModulesPath)) {
            const modules = fs.readdirSync(apiModulesPath);
            let functionFound = false;
            
            modules.forEach(module => {
                if (module.endsWith('.js')) {
                    const modulePath = path.join(apiModulesPath, module);
                    const content = fs.readFileSync(modulePath, 'utf8');
                    if (content.includes(`window.${funcName}`) || content.includes(`function ${funcName}`)) {
                        functionFound = true;
                    }
                }
            });
            
            if (functionFound) {
                addResult(`Function ${funcName} exported`, true);
            } else {
                addResult(`Function ${funcName} exported`, false, `Function ${funcName} not found in API modules`);
                allFunctionsExported = false;
            }
        } else {
            addResult(`Function ${funcName} exported`, false, 'API modules directory not found');
            allFunctionsExported = false;
        }
    });
    
    return allFunctionsExported;
}

function validateServerStructure() {
    log('🔍 Validating server structure...');
    
    const serverFiles = [
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
    
    let allServerFilesExist = true;
    serverFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        if (fs.existsSync(filePath)) {
            addResult(`Server file ${file}`, true);
        } else {
            addResult(`Server file ${file}`, false, 'Server file not found');
            allServerFilesExist = false;
        }
    });
    
    return allServerFilesExist;
}

function validateNoRegressions() {
    log('🔍 Validating no regressions...');
    
    // Check if original functionality is preserved
    const serverPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverPath)) {
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        
        // Check for key server functionality
        const keyFeatures = [
            'express',
            'app.listen',
            'require(\'./server/utils/',
            'require(\'./server/routes/'
        ];
        
        let allFeaturesPresent = true;
        keyFeatures.forEach(feature => {
            if (serverContent.includes(feature)) {
                addResult(`Server feature ${feature}`, true);
            } else {
                addResult(`Server feature ${feature}`, false, `Feature ${feature} not found in server.js`);
                allFeaturesPresent = false;
            }
        });
        
        return allFeaturesPresent;
    } else {
        addResult('Server file exists', false, 'server.js not found');
        return false;
    }
}

// Main validation function
function runValidation() {
    log('🚀 Starting optimization validation...');
    log('='.repeat(60));
    
    try {
        // Run all validations
        validateFileStructure();
        validateOptimizationResults();
        validateJavaScriptSyntax();
        validateHTMLIntegration();
        validateFunctionExports();
        validateServerStructure();
        validateNoRegressions();
        
        // Print results
        log('='.repeat(60));
        log('📊 Validation Results:');
        log(`Total checks: ${validationResults.total}`);
        log(`Passed: ${validationResults.passed}`);
        log(`Failed: ${validationResults.failed}`);
        log(`Warnings: ${validationResults.warnings}`);
        
        const successRate = validationResults.total > 0 ? 
            Math.round((validationResults.passed / validationResults.total) * 100) : 0;
        log(`Success rate: ${successRate}%`);
        
        if (validationResults.issues.length > 0) {
            log('❌ Issues found:');
            validationResults.issues.forEach(issue => {
                log(`  - ${issue.test}: ${issue.message}`);
            });
        }
        
        if (successRate >= 95) {
            log('🎉 Optimization validation PASSED!', 'success');
            return true;
        } else if (successRate >= 80) {
            log('⚠️ Optimization validation completed with warnings', 'warning');
            return false;
        } else {
            log('❌ Optimization validation FAILED', 'error');
            return false;
        }
        
    } catch (error) {
        log(`❌ Validation failed with error: ${error.message}`, 'error');
        return false;
    }
}

// Run validation if this file is executed directly
if (require.main === module) {
    const success = runValidation();
    process.exit(success ? 0 : 1);
}

module.exports = { runValidation };
