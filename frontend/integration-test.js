#!/usr/bin/env node

/**
 * Frontend Integration Test Suite
 * Tests the frontend-backend integration using simulated user interactions
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class FrontendIntegrationTest {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:5173';
    this.apiUrl = 'http://localhost:3001';
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async checkServerHealth(url) {
    try {
      const response = await fetch(`${url}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async testFrontendBuild() {
    this.log('=== Testing Frontend Build Process ===');
    
    try {
      // Change to frontend directory
      const frontendDir = path.resolve(__dirname, '../../../frontend');
      process.chdir(frontendDir);
      
      // Test if dependencies are installed
      if (!fs.existsSync('node_modules')) {
        this.log('Installing frontend dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }
      
      // Test build process
      this.log('Testing frontend build...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Check if dist folder was created
      const distExists = fs.existsSync('dist');
      if (distExists) {
        this.log('✅ Frontend build successful');
        return true;
      } else {
        this.log('❌ Frontend build failed - no dist folder');
        return false;
      }
    } catch (error) {
      this.log(`❌ Frontend build error: ${error.message}`);
      return false;
    }
  }

  async testAPIIntegration() {
    this.log('=== Testing Frontend-Backend API Integration ===');
    
    try {
      // Test if backend is reachable
      const backendHealth = await this.checkServerHealth(this.apiUrl);
      if (!backendHealth) {
        this.log('❌ Backend server not reachable at ' + this.apiUrl);
        return false;
      }
      
      this.log('✅ Backend server is reachable');
      
      // Test API endpoints that frontend uses
      const endpoints = [
        '/blockchain',
        '/wallets',
        '/certificates',
        '/network',
        '/mempool'
      ];
      
      let allEndpointsWorking = true;
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.apiUrl}${endpoint}`);
          if (response.ok) {
            this.log(`✅ API endpoint ${endpoint} is working`);
          } else {
            this.log(`❌ API endpoint ${endpoint} returned status ${response.status}`);
            allEndpointsWorking = false;
          }
        } catch (error) {
          this.log(`❌ API endpoint ${endpoint} failed: ${error.message}`);
          allEndpointsWorking = false;
        }
      }
      
      return allEndpointsWorking;
    } catch (error) {
      this.log(`❌ API integration test failed: ${error.message}`);
      return false;
    }
  }

  async testEnvironmentConfiguration() {
    this.log('=== Testing Environment Configuration ===');
    
    try {
      const frontendDir = path.resolve(__dirname, '../../../frontend');
      
      // Check for environment configuration
      const envFiles = ['.env', '.env.local', '.env.production'];
      let hasEnvConfig = false;
      
      for (const envFile of envFiles) {
        const envPath = path.join(frontendDir, envFile);
        if (fs.existsSync(envPath)) {
          hasEnvConfig = true;
          this.log(`✅ Environment file found: ${envFile}`);
          
          // Check if it contains the API URL configuration
          const envContent = fs.readFileSync(envPath, 'utf8');
          if (envContent.includes('VITE_API_BASE_URL')) {
            this.log('✅ API base URL is configured');
          } else {
            this.log('⚠️  VITE_API_BASE_URL not found in environment config');
          }
          break;
        }
      }
      
      if (!hasEnvConfig) {
        this.log('⚠️  No environment configuration files found');
        this.log('Frontend will use default API URL configuration');
      }
      
      // Check package.json for required dependencies
      const packageJsonPath = path.join(frontendDir, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        const requiredDeps = ['react', 'vite', '@vitejs/plugin-react'];
        const missingDeps = requiredDeps.filter(dep => 
          !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
        );
        
        if (missingDeps.length === 0) {
          this.log('✅ All required dependencies are present');
        } else {
          this.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      this.log(`❌ Environment configuration test failed: ${error.message}`);
      return false;
    }
  }

  async testCertificateWorkflow() {
    this.log('=== Testing Certificate Management Workflow ===');
    
    try {
      // This test simulates the complete certificate workflow
      // that a user would perform in the frontend
      
      // 1. Create a wallet (simulating frontend wallet creation)
      const walletResponse = await fetch(`${this.apiUrl}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Frontend Integration Test Institution',
          type: 'institution'
        })
      });
      
      if (!walletResponse.ok) {
        this.log('❌ Failed to create wallet for certificate workflow test');
        return false;
      }
      
      const wallet = await walletResponse.json();
      this.log(`✅ Created test wallet: ${wallet.publicKey.substring(0, 12)}...`);
      
      // 2. Fund the wallet (simulating faucet usage)
      const faucetResponse = await fetch(`${this.apiUrl}/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: wallet.publicKey,
          amount: 100
        })
      });
      
      if (!faucetResponse.ok) {
        this.log('❌ Failed to fund wallet via faucet');
        return false;
      }
      
      this.log('✅ Wallet funded successfully');
      
      // 3. Create a certificate (simulating frontend certificate creation)
      const certificateData = {
        recipientName: 'Frontend Integration Test Student',
        recipientId: 'FIT001',
        institutionName: 'Frontend Integration Test Institution',
        certificateType: 'BACHELOR',
        courseName: 'Frontend Integration Testing',
        credentialLevel: 'Bachelor of Integration Testing',
        issuerWallet: wallet.publicKey
      };
      
      const certResponse = await fetch(`${this.apiUrl}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(certificateData)
      });
      
      if (!certResponse.ok) {
        this.log('❌ Failed to create certificate');
        return false;
      }
      
      const certificate = await certResponse.json();
      this.log(`✅ Certificate created: ${certificate.id}`);
      
      // 4. Verify the certificate (simulating frontend verification)
      const verifyResponse = await fetch(`${this.apiUrl}/certificates/verify/${certificate.id}`);
      const verificationResult = await verifyResponse.json();
      
      if (verificationResult.valid) {
        this.log('✅ Certificate verification successful');
      } else {
        this.log('❌ Certificate verification failed');
        return false;
      }
      
      // 5. Retrieve certificate list (simulating frontend dashboard)
      const listResponse = await fetch(`${this.apiUrl}/certificates`);
      const certificates = await listResponse.json();
      
      const foundCert = certificates.find(cert => cert.id === certificate.id);
      if (foundCert) {
        this.log('✅ Certificate appears in certificate list');
      } else {
        this.log('❌ Certificate not found in certificate list');
        return false;
      }
      
      return true;
    } catch (error) {
      this.log(`❌ Certificate workflow test failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Frontend Integration Test Suite');
    this.log('='.repeat(60));
    
    const tests = [
      { name: 'Frontend Build', fn: () => this.testFrontendBuild() },
      { name: 'Environment Configuration', fn: () => this.testEnvironmentConfiguration() },
      { name: 'API Integration', fn: () => this.testAPIIntegration() },
      { name: 'Certificate Workflow', fn: () => this.testCertificateWorkflow() }
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
      this.log(`\n--- Running ${test.name} Test ---`);
      try {
        const result = await test.fn();
        if (result) {
          passed++;
          this.log(`✅ ${test.name} test PASSED`);
        } else {
          this.log(`❌ ${test.name} test FAILED`);
        }
      } catch (error) {
        this.log(`❌ ${test.name} test ERROR: ${error.message}`);
      }
    }
    
    // Generate report
    this.log('\n' + '='.repeat(60));
    this.log('📊 FRONTEND INTEGRATION TEST RESULTS');
    this.log('='.repeat(60));
    this.log(`Total Tests: ${total}`);
    this.log(`Passed: ${passed}`);
    this.log(`Failed: ${total - passed}`);
    this.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      this.log('🎉 ALL FRONTEND INTEGRATION TESTS PASSED!');
    } else {
      this.log(`⚠️  ${total - passed} TESTS FAILED`);
    }
    
    return passed === total;
  }
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

// Run tests if executed directly
async function main() {
  const testSuite = new FrontendIntegrationTest();
  const success = await testSuite.runAllTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Frontend integration test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = FrontendIntegrationTest;
