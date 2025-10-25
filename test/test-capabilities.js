/**
 * Quick test script to verify the capabilities endpoint
 */

const http = require('http');

async function testCapabilities() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/capabilities', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const capabilities = JSON.parse(data);
                    console.log('\n✅ Capabilities API Response:');
                    console.log(JSON.stringify(capabilities, null, 2));
                    
                    console.log('\n📊 Feature Status:');
                    console.log(`  PDF Conversion: ${capabilities.pdfConversion ? '✅ Available' : '❌ Unavailable'}`);
                    console.log(`  Environment: ${capabilities.environment || 'unknown'}`);
                    console.log(`  Message: ${capabilities.message || 'N/A'}`);
                    
                    resolve(capabilities);
                } catch (err) {
                    reject(new Error(`Failed to parse response: ${err.message}`));
                }
            });
        }).on('error', (err) => {
            reject(new Error(`HTTP request failed: ${err.message}`));
        });
    });
}

async function testHealth() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:3000/api/health', (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const health = JSON.parse(data);
                    console.log('\n✅ Health Check Response:');
                    console.log(JSON.stringify(health, null, 2));
                    resolve(health);
                } catch (err) {
                    reject(new Error(`Failed to parse response: ${err.message}`));
                }
            });
        }).on('error', (err) => {
            reject(new Error(`HTTP request failed: ${err.message}`));
        });
    });
}

// Run tests
(async () => {
    console.log('🧪 Testing Server Endpoints...\n');
    console.log('⏳ Make sure server is running: node server.js\n');
    
    try {
        await testHealth();
        await testCapabilities();
        
        console.log('\n✅ All tests passed!\n');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\n💡 Make sure the server is running: node server.js\n');
        process.exit(1);
    }
})();

