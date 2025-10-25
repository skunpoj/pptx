/**
 * Workspace Management Utilities
 * Handles creation and setup of temporary workspaces for PowerPoint generation
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Creates a workspace directory with all necessary dependencies
 * @param {string} workDir - Path to workspace directory
 * @returns {Promise<void>}
 */
async function setupWorkspace(workDir) {
    // Create workspace directory
    await fs.mkdir(workDir, { recursive: true });
    console.log(`✓ Created workspace: ${workDir}`);
    
    // Create package.json for workspace (using ES modules)
    const packageJson = {
        "name": "pptx-workspace",
        "version": "1.0.0",
        "type": "module"
    };
    await fs.writeFile(
        path.join(workDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
    console.log('✓ Created package.json');
}

/**
 * Sets up node_modules by symlinking global packages or installing them
 * @param {string} workDir - Path to workspace directory
 * @returns {Promise<void>}
 */
async function setupDependencies(workDir) {
    const nodeModulesPath = path.join(workDir, 'node_modules');
    await fs.mkdir(nodeModulesPath, { recursive: true });
    
    // Platform-specific global modules path
    const globalModulesPath = process.platform === 'win32' 
        ? path.join(process.env.APPDATA || 'C:\\', 'npm', 'node_modules')
        : '/usr/local/lib/node_modules';
    
    // On Windows, symlinks require admin privileges, so skip straight to npm install
    if (process.platform === 'win32') {
        console.log('Windows detected, using npm install...');
        await installDependencies(workDir);
        console.log('✓ Dependencies installed successfully');
        return;
    }
    
    try {
        // Try symlinking first (fast) - Unix/Linux only
        await symlinkGlobalPackages(globalModulesPath, nodeModulesPath);
        console.log('✓ Dependencies linked successfully');
    } catch (symlinkError) {
        // Fallback to npm install (slower but reliable)
        console.log('Symlink failed, falling back to npm install:', symlinkError.message);
        await installDependencies(workDir);
        console.log('✓ Dependencies installed successfully');
    }
}

/**
 * Creates symlinks from global node_modules to workspace node_modules
 * @param {string} globalPath - Global node_modules path
 * @param {string} localPath - Workspace node_modules path
 * @returns {Promise<void>}
 */
async function symlinkGlobalPackages(globalPath, localPath) {
    // Verify global modules exist
    await fs.access(globalPath);
    
    // Symlink main packages
    await fs.symlink(
        path.join(globalPath, 'pptxgenjs'),
        path.join(localPath, 'pptxgenjs'),
        'dir'
    );
    console.log('  ✓ Symlinked pptxgenjs');
    
    // Create @ant directory for scoped package
    await fs.mkdir(path.join(localPath, '@ant'), { recursive: true });
    await fs.symlink(
        path.join(globalPath, '@ant/html2pptx'),
        path.join(localPath, '@ant', 'html2pptx'),
        'dir'
    );
    console.log('  ✓ Symlinked @ant/html2pptx');
    
    // Symlink dependencies
    const depsToLink = ['jszip', 'sharp', 'playwright'];
    for (const dep of depsToLink) {
        try {
            await fs.symlink(
                path.join(globalPath, dep),
                path.join(localPath, dep),
                'dir'
            );
            console.log(`  ✓ Symlinked ${dep}`);
        } catch (e) {
            console.log(`  ⚠ Could not symlink ${dep}: ${e.message}`);
        }
    }
}

/**
 * Installs dependencies using npm (fallback when symlinks fail)
 * @param {string} workDir - Workspace directory path
 * @returns {Promise<void>}
 */
async function installDependencies(workDir) {
    // First, install html2pptx from local tgz file
    const html2pptxTgz = path.join(__dirname, '../../skills/pptx/html2pptx.tgz');
    
    try {
        await fs.access(html2pptxTgz);
        console.log('✓ Found local html2pptx.tgz');
        
        // Install from local tgz
        const cdCommand = process.platform === 'win32' ? 'cd /d' : 'cd';
        const installCmd = `${cdCommand} "${workDir}" && npm install "${html2pptxTgz}" pptxgenjs jszip sharp playwright --no-save --no-audit --no-fund`;
        
        console.log('Installing dependencies from local package...');
        const { stdout, stderr } = await execPromise(installCmd, { 
            timeout: 120000,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
        });
        
        if (stdout) console.log('npm install output:', stdout);
        if (stderr && !stderr.includes('WARN')) console.error('npm install stderr:', stderr);
        
    } catch (error) {
        console.warn('Local html2pptx.tgz not found, trying npm registry...');
        
        // Fallback to npm registry
        const cdCommand = process.platform === 'win32' ? 'cd /d' : 'cd';
        const command = `${cdCommand} "${workDir}" && npm install pptxgenjs @ant/html2pptx jszip sharp playwright --no-save --no-audit --no-fund`;
        
        console.log('Installing dependencies from npm...');
        const { stdout, stderr } = await execPromise(command, { 
            timeout: 120000,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh'
        });
        
        if (stdout) console.log('npm install output:', stdout);
        if (stderr) console.error('npm install stderr:', stderr);
    }
}

/**
 * Runs a JavaScript file in the workspace
 * @param {string} workDir - Workspace directory
 * @param {string} scriptName - Script filename to run
 * @param {number} timeout - Timeout in milliseconds (default: 120000)
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function runScript(workDir, scriptName, timeout = 120000) {
    console.log(`Running ${scriptName} in ${workDir}`);
    
    // Platform-specific command
    const cdCommand = process.platform === 'win32' ? 'cd /d' : 'cd';
    const command = `${cdCommand} "${workDir}" && node ${scriptName}`;
    
    try {
        const { stdout, stderr } = await execPromise(command, { 
            timeout,
            shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/sh',
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer for large outputs
        });
        
        console.log(`${scriptName} output:`, stdout);
        if (stderr) console.error(`${scriptName} stderr:`, stderr);
        
        return { stdout, stderr };
    } catch (error) {
        console.error(`Error running ${scriptName}:`, error.message);
        if (error.killed) {
            throw new Error(`Script timeout after ${timeout}ms. The presentation generation is taking too long. This might be due to missing dependencies or Playwright issues.`);
        }
        throw error;
    }
}

/**
 * Cleans up workspace directory
 * @param {string} workDir - Workspace directory to remove
 * @param {number} delay - Delay before cleanup in milliseconds (default: 5000)
 * @returns {void}
 */
function scheduleCleanup(workDir, delay = 5000) {
    setTimeout(async () => {
        try {
            await fs.rm(workDir, { recursive: true, force: true });
            console.log(`✓ Cleaned up workspace: ${workDir}`);
        } catch (e) {
            console.error(`⚠ Cleanup failed: ${e.message}`);
        }
    }, delay);
}

module.exports = {
    setupWorkspace,
    setupDependencies,
    runScript,
    scheduleCleanup
};

