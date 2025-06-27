#!/usr/bin/env node

/**
 * Frontend Integration Test Suite
 * Tests the frontend-backend integration using the actual API structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FrontendIntegrationTest {
  constructor() {
    this.testResults = [];
    this.baseUrl = 'http://localhost:5173';
    this.apiUrl = 'http://localhost:3001';
    this.totalTests = 0;
    this.passedTests = 0;
  }

  log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async assert(condition, message) {
    this.totalTests++;
    if (condition) {
      this.passedTests++;
      this.log(`✅ PASS: ${message}`, "TEST");
      return true;
    } else {
      this.log(`❌ FAIL: ${message}`, "TEST");
      return false;
    }
  }

  async checkServerHealth(url) {
    try {
      const response = await fetch(`${url}/ping`);
      return response.ok;
    } catch {
      return false;
    }
  }



  async testAPIIntegration() {
    this.log('=== Testing Frontend-Backend API Integration ===');
    
    try {
      // Test if backend is reachable
      const backendHealth = await this.checkServerHealth(this.apiUrl);
      if (!backendHealth) {
        await this.assert(false, 'Backend server not reachable at ' + this.apiUrl);
        return false;
      }
      
      await this.assert(true, 'Backend server is reachable');
      
      // Test API endpoints that frontend uses
      const endpoints = [
        { path: '/ping', method: 'GET' },
        { path: '/blockchain', method: 'GET' },
        { path: '/wallets', method: 'GET' },
        { path: '/certificates', method: 'GET' },
        { path: '/institutions', method: 'GET' },
        { path: '/transactions/pending', method: 'GET' }
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${this.apiUrl}${endpoint.path}`, {
            method: endpoint.method
          });
          
          await this.assert(
            response.ok,
            `API endpoint ${endpoint.method} ${endpoint.path} is working`
          );
          
          // Verify response contains expected data
          if (response.ok) {
            const data = await response.json();
            await this.assert(
              data !== null && data !== undefined,
              `API endpoint ${endpoint.path} returns valid data`
            );
          }
        } catch (error) {
          await this.assert(
            false, 
            `API endpoint ${endpoint.path} failed: ${error.message}`
          );
        }
      }
      
      return true;
    } catch (error) {
      await this.assert(false, `API integration test failed: ${error.message}`);
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
    this.log('=== Testing Certificate Workflow Integration ===');
    
    try {
      // 1. Create a wallet for the test
      const walletResponse = await fetch(`${this.apiUrl}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Frontend Test Wallet'
        })
      });

      await this.assert(walletResponse.ok, 'Wallet creation successful');
      
      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        await this.assert(walletData.success, 'Wallet creation response indicates success');
        
        const wallet = walletData.wallet;
        await this.assert(wallet.publicKey, 'Wallet has public key');

        // 2. Create a certificate
        const certificateData = {
          recipientName: 'Frontend Test Student',
          recipientWalletAddress: wallet.publicKey,
          certificateType: 'BACHELOR',
          courseName: 'Frontend Integration Test',
          credentialLevel: 'Bachelor of Testing',
          completionDate: new Date().toISOString(),
          grade: 'A+'
        };

        const certResponse = await fetch(`${this.apiUrl}/certificates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certificateData)
        });

        await this.assert(certResponse.ok, 'Certificate creation successful');
        
        if (certResponse.ok) {
          const certResult = await certResponse.json();
          await this.assert(certResult.message, 'Certificate creation response has message');
          
          const certificate = certResult.certificate;
          await this.assert(certificate.id, 'Certificate has unique ID');

          // 3. Retrieve the certificate
          const retrieveResponse = await fetch(`${this.apiUrl}/certificates/${certificate.id}`);
          await this.assert(retrieveResponse.ok, 'Certificate retrieval successful');

          // 4. Verify the certificate
          const verifyResponse = await fetch(`${this.apiUrl}/certificates/${certificate.id}/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          await this.assert(verifyResponse.ok, 'Certificate verification successful');

          // 5. Search for certificates
          const searchResponse = await fetch(`${this.apiUrl}/certificates?q=${encodeURIComponent(certificateData.recipientName)}`);
          if (searchResponse.ok) {
            await this.assert(true, 'Certificate search endpoint available');
          }
        }
      }

      return true;
    } catch (error) {
      await this.assert(false, `Certificate workflow test failed: ${error.message}`);
      return false;
    }
  }

  async testWalletIntegration() {
    this.log('=== Testing Wallet Integration ===');
    
    try {
      // 1. Test wallet listing
      const walletsResponse = await fetch(`${this.apiUrl}/wallets`);
      await this.assert(walletsResponse.ok, 'Wallets listing endpoint accessible');
      
      if (walletsResponse.ok) {
        const wallets = await walletsResponse.json();
        await this.assert(Array.isArray(wallets), 'Wallets response is an array');
      }

      // 2. Create a new wallet
      const createWalletResponse = await fetch(`${this.apiUrl}/wallets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Test Integration Wallet'
        })
      });

      await this.assert(createWalletResponse.ok, 'Wallet creation endpoint working');
      
      if (createWalletResponse.ok) {
        const walletData = await createWalletResponse.json();
        await this.assert(walletData.success, 'Wallet creation successful');
        
        const wallet = walletData.wallet;
        await this.assert(wallet.publicKey, 'Created wallet has public key');
        await this.assert(wallet.label, 'Created wallet has label');

        // 3. Test wallet retrieval
        const walletDetailResponse = await fetch(`${this.apiUrl}/wallets/${wallet.publicKey}`);
        await this.assert(walletDetailResponse.ok, 'Wallet detail retrieval successful');

        // 4. Test wallet certificates endpoint
        const walletCertsResponse = await fetch(`${this.apiUrl}/wallets/${wallet.publicKey}/certificates`);
        await this.assert(walletCertsResponse.ok, 'Wallet certificates endpoint accessible');

        // 5. Test wallet transactions endpoint
        const walletTxResponse = await fetch(`${this.apiUrl}/wallets/${wallet.publicKey}/transactions`);
        await this.assert(walletTxResponse.ok, 'Wallet transactions endpoint accessible');
      }

      return true;
    } catch (error) {
      await this.assert(false, `Wallet integration test failed: ${error.message}`);
      return false;
    }
  }

  async testBlockchainIntegration() {
    this.log('=== Testing Blockchain Data Integration ===');
    
    try {
      // 1. Test blockchain endpoint
      const blockchainResponse = await fetch(`${this.apiUrl}/blockchain`);
      await this.assert(blockchainResponse.ok, 'Blockchain endpoint accessible');
      
      if (blockchainResponse.ok) {
        const blockchain = await blockchainResponse.json();
        await this.assert(blockchain.chain, 'Blockchain has chain property');
        await this.assert(Array.isArray(blockchain.chain), 'Blockchain chain is an array');
        await this.assert(blockchain.chain.length > 0, 'Blockchain has at least genesis block');
      }

      // 2. Test blocks endpoint
      const blocksResponse = await fetch(`${this.apiUrl}/blocks`);
      await this.assert(blocksResponse.ok, 'Blocks endpoint accessible');

      // 3. Test pending transactions
      const pendingResponse = await fetch(`${this.apiUrl}/transactions/pending`);
      await this.assert(pendingResponse.ok, 'Pending transactions endpoint accessible');
      
      if (pendingResponse.ok) {
        const pending = await pendingResponse.json();
        await this.assert(Array.isArray(pending), 'Pending transactions is an array');
      }

      // 4. Test institutions endpoint
      const institutionsResponse = await fetch(`${this.apiUrl}/institutions`);
      await this.assert(institutionsResponse.ok, 'Institutions endpoint accessible');

      // 5. Test current institution endpoint
      const institutionResponse = await fetch(`${this.apiUrl}/institution`);
      await this.assert(institutionResponse.ok, 'Current institution endpoint accessible');

      // 6. Test network endpoint
      const networkResponse = await fetch(`${this.apiUrl}/network`);
      await this.assert(networkResponse.ok, 'Network endpoint accessible');

      return true;
    } catch (error) {
      await this.assert(false, `Blockchain integration test failed: ${error.message}`);
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Frontend Integration Test Suite');
    this.log('='.repeat(60));
    
    const tests = [
      { name: 'Environment Configuration', fn: () => this.testEnvironmentConfiguration() },
      { name: 'API Integration', fn: () => this.testAPIIntegration() },
      { name: 'Certificate Workflow', fn: () => this.testCertificateWorkflow() },
      { name: 'Wallet Integration', fn: () => this.testWalletIntegration() },
      { name: 'Blockchain Integration', fn: () => this.testBlockchainIntegration() }
    ];
    
    let testsPassed = 0;
    let testsTotal = tests.length;
    
    for (const test of tests) {
      this.log(`\n--- Running ${test.name} Test ---`);
      try {
        const result = await test.fn();
        if (result) {
          testsPassed++;
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
    this.log(`Total Test Suites: ${testsTotal}`);
    this.log(`Passed Test Suites: ${testsPassed}`);
    this.log(`Failed Test Suites: ${testsTotal - testsPassed}`);
    this.log(`Test Suite Pass Rate: ${((testsPassed / testsTotal) * 100).toFixed(1)}%`);
    this.log(`\nDetailed Test Results:`);
    this.log(`Total Individual Tests: ${this.totalTests}`);
    this.log(`Passed Individual Tests: ${this.passedTests}`);
    this.log(`Failed Individual Tests: ${this.totalTests - this.passedTests}`);
    this.log(`Individual Test Pass Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
    
    if (testsPassed === testsTotal && this.passedTests === this.totalTests) {
      this.log('🎉 ALL FRONTEND INTEGRATION TESTS PASSED!');
    } else {
      this.log(`⚠️  ${testsTotal - testsPassed} TEST SUITES AND ${this.totalTests - this.passedTests} INDIVIDUAL TESTS FAILED`);
    }
    
    return testsPassed === testsTotal;
  }
}

// Run tests if executed directly
async function main() {
  // Polyfill fetch for Node.js
  if (typeof globalThis.fetch === 'undefined') {
    const nodeFetch = await import('node-fetch');
    globalThis.fetch = nodeFetch.default;
  }
  
  const testSuite = new FrontendIntegrationTest();
  const success = await testSuite.runAllTests();
  process.exit(success ? 0 : 1);
}

// Always run the tests when executed directly
main().catch(error => {
  console.error('Frontend integration test suite crashed:', error);
  process.exit(1);
});
