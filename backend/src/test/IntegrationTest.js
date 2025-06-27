const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const baseUrl = "http://localhost:3001";

class IntegrationTestSuite {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async log(message, type = "INFO") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${type}] ${message}`);
  }

  async assert(condition, message) {
    this.totalTests++;
    if (condition) {
      this.passedTests++;
      await this.log(`✅ PASS: ${message}`, "TEST");
      return true;
    } else {
      await this.log(`❌ FAIL: ${message}`, "TEST");
      return false;
    }
  }

  async waitForServer(url, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${url}/health`);
        if (response.ok) {
          await this.log(`Server at ${url} is ready`);
          return true;
        }
      } catch (error) {
        await this.log(`Waiting for server at ${url}... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    throw new Error(`Server at ${url} did not become ready`);
  }

  // Test 1: Certificate Issuance End-to-End Flow
  async testCertificateIssuanceFlow() {
    await this.log("=== Test 1: Certificate Issuance End-to-End Flow ===", "SUITE");
    
    try {
      // 1. Create a wallet for the institution
      const walletResponse = await fetch(`${baseUrl}/wallets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test University",
          type: "institution"
        })
      });
      
      await this.assert(walletResponse.ok, "Institution wallet created successfully");
      const wallet = await walletResponse.json();
      await this.assert(wallet.publicKey, "Wallet has public key");

      // 2. Add funds to the wallet via faucet
      const faucetResponse = await fetch(`${baseUrl}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: wallet.publicKey,
          amount: 100
        })
      });
      
      await this.assert(faucetResponse.ok, "Faucet funding successful");

      // 3. Check wallet balance
      const balanceResponse = await fetch(`${baseUrl}/wallets/${wallet.publicKey}`);
      const balanceData = await balanceResponse.json();
      await this.assert(balanceData.balance >= 100, "Wallet balance is sufficient");

      // 4. Create a certificate
      const certificateData = {
        recipientName: "Integration Test Student",
        recipientId: "INT001",
        institutionName: "Test University", 
        certificateType: "BACHELOR",
        courseName: "Integration Testing 101",
        credentialLevel: "Bachelor of Science",
        issuerWallet: wallet.publicKey
      };

      const certResponse = await fetch(`${baseUrl}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certificateData)
      });

      await this.assert(certResponse.ok, "Certificate creation request successful");
      const certificate = await certResponse.json();
      await this.assert(certificate.id, "Certificate has unique ID");
      await this.assert(certificate.hash, "Certificate has cryptographic hash");

      // 5. Verify the certificate can be retrieved
      const retrieveResponse = await fetch(`${baseUrl}/certificates/${certificate.id}`);
      await this.assert(retrieveResponse.ok, "Certificate retrieval successful");
      const retrievedCert = await retrieveResponse.json();
      await this.assert(
        retrievedCert.recipientName === certificateData.recipientName,
        "Retrieved certificate data matches"
      );

      // 6. Verify certificate appears in blockchain
      const blockchainResponse = await fetch(`${baseUrl}/blockchain`);
      const blockchain = await blockchainResponse.json();
      const certificateInChain = blockchain.chain.some(block => 
        block.transactions && block.transactions.some(tx => 
          tx.type === "CERTIFICATE" && tx.certificateId === certificate.id
        )
      );
      await this.assert(certificateInChain, "Certificate transaction recorded in blockchain");

      return { wallet, certificate };
    } catch (error) {
      await this.log(`Certificate issuance flow failed: ${error.message}`, "ERROR");
      throw error;
    }
  }

  // Test 2: Multi-Node Network Synchronization
  async testNetworkSynchronization() {
    await this.log("=== Test 2: Multi-Node Network Synchronization ===", "SUITE");
    
    try {
      const nodes = [
        "http://localhost:3001",
        "http://localhost:3002", 
        "http://localhost:3003"
      ];

      // 1. Check all nodes are running
      for (const nodeUrl of nodes) {
        try {
          const response = await fetch(`${nodeUrl}/blockchain`);
          await this.assert(response.ok, `Node ${nodeUrl} is accessible`);
        } catch (error) {
          await this.log(`Node ${nodeUrl} is not running - skipping network sync test`, "WARN");
          return;
        }
      }

      // 2. Get initial blockchain state from all nodes
      const initialStates = {};
      for (const nodeUrl of nodes) {
        const response = await fetch(`${nodeUrl}/blockchain`);
        const blockchain = await response.json();
        initialStates[nodeUrl] = blockchain.chain.length;
      }

      // 3. Create a certificate on the first node
      const walletResponse = await fetch(`${nodes[0]}/wallets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Sync Test Institution" })
      });
      const wallet = await walletResponse.json();

      await fetch(`${nodes[0]}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.publicKey, amount: 100 })
      });

      const certResponse = await fetch(`${nodes[0]}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: "Sync Test Student",
          recipientId: "SYNC001",
          institutionName: "Sync Test Institution",
          certificateType: "CERTIFICATE",
          courseName: "Network Synchronization",
          credentialLevel: "Test Certificate",
          issuerWallet: wallet.publicKey
        })
      });

      const certificate = await certResponse.json();
      await this.assert(certificate.id, "Certificate created on first node");

      // 4. Trigger consensus on all nodes
      for (const nodeUrl of nodes) {
        try {
          await fetch(`${nodeUrl}/consensus`, { method: "POST" });
          await this.log(`Consensus triggered on ${nodeUrl}`);
        } catch (error) {
          await this.log(`Failed to trigger consensus on ${nodeUrl}: ${error.message}`, "WARN");
        }
      }

      // 5. Wait for synchronization
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 6. Verify all nodes have the same blockchain state
      const finalStates = {};
      for (const nodeUrl of nodes) {
        try {
          const response = await fetch(`${nodeUrl}/blockchain`);
          const blockchain = await response.json();
          finalStates[nodeUrl] = blockchain.chain.length;
          
          // Check if certificate exists on this node
          const certExists = blockchain.chain.some(block =>
            block.transactions && block.transactions.some(tx =>
              tx.type === "CERTIFICATE" && tx.certificateId === certificate.id
            )
          );
          await this.assert(certExists, `Certificate synchronized to ${nodeUrl}`);
        } catch (error) {
          await this.log(`Failed to check final state of ${nodeUrl}: ${error.message}`, "WARN");
        }
      }

      // 7. Verify blockchain lengths are consistent
      const chainLengths = Object.values(finalStates);
      const allSameLength = chainLengths.every(length => length === chainLengths[0]);
      await this.assert(allSameLength, "All nodes have same blockchain length");

    } catch (error) {
      await this.log(`Network synchronization test failed: ${error.message}`, "ERROR");
      throw error;
    }
  }

  // Test 3: Certificate Verification Flow
  async testCertificateVerification() {
    await this.log("=== Test 3: Certificate Verification Flow ===", "SUITE");
    
    try {
      // 1. Create a certificate first
      const { certificate } = await this.testCertificateIssuanceFlow();

      // 2. Verify certificate by ID
      const verifyResponse = await fetch(`${baseUrl}/certificates/verify/${certificate.id}`);
      await this.assert(verifyResponse.ok, "Certificate verification endpoint accessible");
      
      const verificationResult = await verifyResponse.json();
      await this.assert(verificationResult.valid === true, "Certificate verification returns valid");
      await this.assert(verificationResult.certificate, "Verification includes certificate data");

      // 3. Test verification of non-existent certificate
      const invalidVerifyResponse = await fetch(`${baseUrl}/certificates/verify/nonexistent123`);
      const invalidResult = await invalidVerifyResponse.json();
      await this.assert(invalidResult.valid === false, "Invalid certificate returns false");

      // 4. Verify certificate hash integrity
      const retrieveResponse = await fetch(`${baseUrl}/certificates/${certificate.id}`);
      const retrievedCert = await retrieveResponse.json();
      await this.assert(
        retrievedCert.hash === certificate.hash,
        "Certificate hash integrity maintained"
      );

    } catch (error) {
      await this.log(`Certificate verification test failed: ${error.message}`, "ERROR");
      throw error;
    }
  }

  // Test 4: API Error Handling
  async testAPIErrorHandling() {
    await this.log("=== Test 4: API Error Handling ===", "SUITE");
    
    try {
      // 1. Test invalid certificate creation
      const invalidCertResponse = await fetch(`${baseUrl}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Missing required fields
          recipientName: "Test"
        })
      });
      await this.assert(
        invalidCertResponse.status >= 400,
        "Invalid certificate creation returns error status"
      );

      // 2. Test invalid wallet access
      const invalidWalletResponse = await fetch(`${baseUrl}/wallets/invalidaddress123`);
      await this.assert(
        invalidWalletResponse.status >= 400,
        "Invalid wallet access returns error status"
      );

      // 3. Test invalid faucet request
      const invalidFaucetResponse = await fetch(`${baseUrl}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: "invalid",
          amount: -100
        })
      });
      await this.assert(
        invalidFaucetResponse.status >= 400,
        "Invalid faucet request returns error status"
      );

    } catch (error) {
      await this.log(`API error handling test failed: ${error.message}`, "ERROR");
      throw error;
    }
  }

  // Test 5: Performance and Load Testing
  async testPerformanceLoad() {
    await this.log("=== Test 5: Performance and Load Testing ===", "SUITE");
    
    try {
      // 1. Create a wallet for testing
      const walletResponse = await fetch(`${baseUrl}/wallets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Load Test Institution" })
      });
      const wallet = await walletResponse.json();

      await fetch(`${baseUrl}/faucet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: wallet.publicKey, amount: 1000 })
      });

      // 2. Create multiple certificates simultaneously
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        fetch(`${baseUrl}/certificates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientName: `Load Test Student ${i}`,
            recipientId: `LOAD${i.toString().padStart(3, '0')}`,
            institutionName: "Load Test Institution",
            certificateType: "CERTIFICATE",
            courseName: `Load Test Course ${i}`,
            credentialLevel: "Test Certificate",
            issuerWallet: wallet.publicKey
          })
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 3. Verify all requests succeeded
      const successfulRequests = responses.filter(r => r.ok).length;
      await this.assert(
        successfulRequests === concurrentRequests,
        `All ${concurrentRequests} concurrent requests succeeded`
      );

      // 4. Check performance metrics
      const avgResponseTime = duration / concurrentRequests;
      await this.assert(
        avgResponseTime < 1000,
        `Average response time (${avgResponseTime}ms) is acceptable`
      );

      await this.log(`Created ${concurrentRequests} certificates in ${duration}ms (avg: ${avgResponseTime}ms per request)`);

    } catch (error) {
      await this.log(`Performance load test failed: ${error.message}`, "ERROR");
      throw error;
    }
  }

  // Main test runner
  async runAllTests() {
    await this.log("🚀 Starting Integration Test Suite", "SUITE");
    await this.log("=".repeat(60), "SUITE");
    
    try {
      // Wait for server to be ready
      await this.waitForServer(baseUrl);
      
      // Run all test suites
      await this.testCertificateIssuanceFlow();
      await this.testCertificateVerification();
      await this.testNetworkSynchronization();
      await this.testAPIErrorHandling();
      await this.testPerformanceLoad();
      
    } catch (error) {
      await this.log(`Test suite execution failed: ${error.message}`, "ERROR");
    }

    // Generate final report
    await this.generateTestReport();
  }

  async generateTestReport() {
    await this.log("=".repeat(60), "SUITE");
    await this.log("📊 INTEGRATION TEST RESULTS", "SUITE");
    await this.log("=".repeat(60), "SUITE");
    
    const passRate = ((this.passedTests / this.totalTests) * 100).toFixed(1);
    
    await this.log(`Total Tests: ${this.totalTests}`, "REPORT");
    await this.log(`Passed: ${this.passedTests}`, "REPORT");
    await this.log(`Failed: ${this.totalTests - this.passedTests}`, "REPORT");
    await this.log(`Pass Rate: ${passRate}%`, "REPORT");
    
    if (this.passedTests === this.totalTests) {
      await this.log("🎉 ALL TESTS PASSED!", "SUCCESS");
    } else {
      await this.log(`⚠️  ${this.totalTests - this.passedTests} TESTS FAILED`, "WARN");
    }
    
    await this.log("=".repeat(60), "SUITE");
  }
}

// Run the integration tests
async function main() {
  const testSuite = new IntegrationTestSuite();
  await testSuite.runAllTests();
  
  // Exit with appropriate code
  process.exit(testSuite.passedTests === testSuite.totalTests ? 0 : 1);
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error("Integration test suite crashed:", error);
    process.exit(1);
  });
}

module.exports = IntegrationTestSuite;
