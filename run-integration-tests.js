#!/usr/bin/env node

/**
 * Comprehensive Integration Test Runner
 * Runs both backend and frontend integration tests
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class ComprehensiveTestRunner {
  constructor() {
    this.projectRoot = path.resolve(__dirname);
    this.backendDir = path.join(this.projectRoot, 'backend');
    this.frontendDir = path.join(this.projectRoot, 'frontend');
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async checkServerHealth(url, maxAttempts = 5) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${url}/ping`);
        if (response.ok) {
          return true;
        }
      } catch (error) {
        this.log(`Waiting for server at ${url}... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    return false;
  }



  async runBackendTests() {
    this.log('=== Running Backend Integration Tests ===');
    
    try {
      process.chdir(this.backendDir);
      
      // Check if node_modules exists
      if (!fs.existsSync('node_modules')) {
        this.log('Installing backend dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }
      
      // Run backend integration tests
      execSync('npm run test:integration', { stdio: 'inherit' });
      this.log('✅ Backend integration tests completed');
      return true;
    } catch (error) {
      this.log(`❌ Backend integration tests failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runFrontendTests() {
    this.log('=== Running Frontend Integration Tests ===');
    
    try {
      process.chdir(this.frontendDir);
      
      // Check if node_modules exists
      if (!fs.existsSync('node_modules')) {
        this.log('Installing frontend dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }
      
      // Run frontend integration tests
      execSync('npm run test:integration', { stdio: 'inherit' });
      this.log('✅ Frontend integration tests completed');
      return true;
    } catch (error) {
      this.log(`❌ Frontend integration tests failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runEndToEndTests() {
    this.log('=== Running End-to-End Integration Tests ===');
    
    try {
      // Test full workflow with both frontend and backend
      const apiUrl = 'http://localhost:3001';
      
      // Verify backend is running
      const backendHealth = await this.checkServerHealth(apiUrl);
      if (!backendHealth) {
        this.log('❌ Backend not available for E2E tests', 'ERROR');
        return false;
      }
      
      // Test complete certificate lifecycle
      this.log('Testing complete certificate lifecycle...');
      
      // 1. Create institution wallet
      const walletResponse = await fetch(`${apiUrl}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Test Institution',
          type: 'institution'
        })
      });
      
      if (!walletResponse.ok) {
        throw new Error('Failed to create wallet');
      }
      
      const wallet = await walletResponse.json();
      this.log(`✅ Created institutional wallet`);
      
      // 2. Fund wallet
      await fetch(`${apiUrl}/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: wallet.publicKey,
          amount: 500
        })
      });
      
      this.log('✅ Funded wallet');
      
      // 3. Create multiple certificates to test system under load
      const certificates = [];
      for (let i = 0; i < 5; i++) {
        const certResponse = await fetch(`${apiUrl}/certificates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientName: `E2E Test Student ${i + 1}`,
            recipientId: `E2E${(i + 1).toString().padStart(3, '0')}`,
            institutionName: 'E2E Test Institution',
            certificateType: 'CERTIFICATE',
            courseName: `E2E Test Course ${i + 1}`,
            credentialLevel: 'Test Certificate',
            issuerWallet: wallet.publicKey
          })
        });
        
        if (certResponse.ok) {
          const cert = await certResponse.json();
          certificates.push(cert);
          this.log(`✅ Created certificate ${i + 1}/5`);
        } else {
          throw new Error(`Failed to create certificate ${i + 1}`);
        }
      }
      
      // 4. Verify all certificates
      for (const cert of certificates) {
        const verifyResponse = await fetch(`${apiUrl}/certificates/verify/${cert.id}`);
        const verification = await verifyResponse.json();
        
        if (!verification.valid) {
          throw new Error(`Certificate ${cert.id} verification failed`);
        }
      }
      
      this.log('✅ All certificates verified successfully');
      
      // 5. Test blockchain consistency
      const blockchainResponse = await fetch(`${apiUrl}/blockchain`);
      const blockchain = await blockchainResponse.json();
      
      const certificateTransactions = blockchain.chain.reduce((count, block) => {
        if (block.transactions) {
          return count + block.transactions.filter(tx => tx.type === 'CERTIFICATE').length;
        }
        return count;
      }, 0);
      
      if (certificateTransactions >= certificates.length) {
        this.log('✅ All certificates recorded in blockchain');
      } else {
        throw new Error('Not all certificates found in blockchain');
      }
      
      this.log('✅ E2E tests completed successfully');
      return true;
      
    } catch (error) {
      this.log(`❌ E2E tests failed: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Integration Test Suite');
    this.log('='.repeat(80));
    
    try {
      // Verify backend is accessible
      const backendReady = await this.checkServerHealth('http://localhost:3001');
      if (!backendReady) {
        this.log('❌ Backend server not running at http://localhost:3001', 'ERROR');
        this.log('Please start the backend server before running tests', 'ERROR');
        return false;
      }
      
      // Run all test suites
      const results = {
        backend: await this.runBackendTests(),
        frontend: await this.runFrontendTests(),
        e2e: await this.runEndToEndTests()
      };
      
      // Generate comprehensive report
      this.log('\n' + '='.repeat(80));
      this.log('📊 COMPREHENSIVE INTEGRATION TEST RESULTS');
      this.log('='.repeat(80));
      
      const totalTests = Object.keys(results).length;
      const passedTests = Object.values(results).filter(Boolean).length;
      
      this.log(`Backend Integration Tests: ${results.backend ? '✅ PASSED' : '❌ FAILED'}`);
      this.log(`Frontend Integration Tests: ${results.frontend ? '✅ PASSED' : '❌ FAILED'}`);
      this.log(`End-to-End Tests: ${results.e2e ? '✅ PASSED' : '❌ FAILED'}`);
      this.log('');
      this.log(`Total Test Suites: ${totalTests}`);
      this.log(`Passed: ${passedTests}`);
      this.log(`Failed: ${totalTests - passedTests}`);
      this.log(`Pass Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
      
      if (passedTests === totalTests) {
        this.log('🎉 ALL INTEGRATION TESTS PASSED!');
      } else {
        this.log(`⚠️  ${totalTests - passedTests} TEST SUITES FAILED`);
      }
      
      return passedTests === totalTests;
      
    } catch (error) {
      this.log(`❌ Test suite execution failed: ${error.message}`, 'ERROR');
      return false;
    }
  }
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

// Main execution
async function main() {
  const testRunner = new ComprehensiveTestRunner();
  const success = await testRunner.runAllTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner crashed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;
