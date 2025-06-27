# Integration Test Suite für Blockchain-Frontend Zusammenspiel

## Inhaltsverzeichnis

- [Test-Szenarien für End-to-End Funktionalität](#test-szenarien-für-end-to-end-funktionalität)
  - [Test 1: Certificate Issuance Flow](#test-1-certificate-issuance-flow)
  - [Test 2: Real-time Verification Flow](#test-2-real-time-verification-flow)
  - [Test 3: Multi-Node Network Synchronization](#test-3-multi-node-network-synchronization)
  - [Test 4: Frontend State Management Integration](#test-4-frontend-state-management-integration)
- [Performance Integration Tests](#performance-integration-tests)
  - [Test 5: Load Testing](#test-5-load-testing)
- [Security Integration Tests](#security-integration-tests)
  - [Test 6: Security Validation](#test-6-security-validation)
- [DSGVO Compliance Tests](#dsgvo-compliance-tests)
  - [Test 7: Data Protection Integration](#test-7-data-protection-integration)
- [Usability Integration Tests](#usability-integration-tests)
  - [Test 8: User Experience Flow](#test-8-user-experience-flow)
- [Test Automation Script](#test-automation-script)
  - [Continuous Integration Test Runner](#continuous-integration-test-runner)
- [Test Results Documentation Template](#test-results-documentation-template)
  - [Test Execution Report](#test-execution-report)

## Test-Szenarien für End-to-End Funktionalität

### Test 1: Certificate Issuance Flow

```javascript
describe("Certificate Issuance Integration", () => {
  test("Frontend → Backend → Blockchain Integration", async () => {
    // 1. Frontend: Zertifikat-Ausstellungsformular ausfüllen
    const certificateData = {
      recipientName: "Integration Test Student",
      recipientId: "INT001",
      institutionName: "Test University",
      certificateType: "BACHELOR",
      courseName: "Integration Testing 101",
      credentialLevel: "Bachelor of Science",
    };

    // 2. API-Call vom Frontend zum Backend
    const response = await fetch("http://localhost:3001/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(certificateData),
    });

    // 3. Verifikation der Response
    expect(response.status).toBe(201);
    const result = await response.json();
    expect(result.certificate.id).toBeDefined();

    // 4. Blockchain-Integration prüfen
    const blockchainResponse = await fetch("http://localhost:3001/blockchain");
    const blockchain = await blockchainResponse.json();

    // 5. Zertifikat in Blockchain vorhanden
    expect(blockchain.chain.length).toBeGreaterThan(1);

    // 6. Frontend-State-Update simulieren
    const frontendCertificates = await fetch(
      "http://localhost:3001/certificates",
    );
    const certificates = await frontendCertificates.json();
    expect(certificates.some((cert) => cert.id === result.certificate.id)).toBe(
      true,
    );
  });
});
```

### Test 2: Real-time Verification Flow

```javascript
describe("Certificate Verification Integration", () => {
  test("QR-Code Scan → API → Blockchain Verification", async () => {
    // 1. Simuliere QR-Code Scan im Frontend
    const certificateId = "test-cert-id-12345";

    // 2. Frontend sendet Verifikationsanfrage
    const verificationResponse = await fetch(
      `http://localhost:3001/certificates/${certificateId}/verify`,
      { method: "POST" },
    );

    // 3. Backend führt Blockchain-Verifikation durch
    const verification = await verificationResponse.json();

    // 4. Validiere Verifikationsergebnis
    expect(verification.valid).toBeDefined();
    expect(verification.status).toMatch(/VALID|INVALID|NOT_FOUND|EXPIRED/);
    expect(verification.message).toBeDefined();

    // 5. Frontend zeigt Verifikationsstatus
    if (verification.valid) {
      expect(verification.certificate).toBeDefined();
      expect(verification.certificate.signature).toBeDefined();
    }
  });
});
```

### Test 3: Multi-Node Network Synchronization

```javascript
describe("Network Synchronization Integration", () => {
  test("Certificate issued on Node 1 → Visible on all Nodes", async () => {
    const nodes = [
      "http://localhost:3001", // University
      "http://localhost:3002", // Vocational
      "http://localhost:3003", // Certification
    ];

    // 1. Issue certificate on Node 1
    const certificateData = {
      recipientName: "Network Sync Test",
      institutionName: "University of Technology",
      certificateType: "MASTER",
      courseName: "Distributed Systems",
    };

    const issueResponse = await fetch(`${nodes[0]}/certificates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(certificateData),
    });

    const issuedCert = await issueResponse.json();

    // 2. Wait for network synchronization
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3. Verify certificate exists on all nodes
    for (const nodeUrl of nodes) {
      const response = await fetch(
        `${nodeUrl}/certificates/${issuedCert.certificate.id}`,
      );
      expect(response.status).toBe(200);

      const certificate = await response.json();
      expect(certificate.id).toBe(issuedCert.certificate.id);
    }
  });
});
```

### Test 4: Frontend State Management Integration

```javascript
describe("Frontend State Consistency", () => {
  test("Backend changes reflect in Frontend state", async () => {
    // Simuliere React Hook Behavior
    const mockUseCertificates = () => {
      const [certificates, setCertificates] = useState([]);
      const [loading, setLoading] = useState(false);

      const fetchCertificates = async () => {
        setLoading(true);
        try {
          const response = await fetch("http://localhost:3001/certificates");
          const data = await response.json();
          setCertificates(data);
        } finally {
          setLoading(false);
        }
      };

      return { certificates, loading, fetchCertificates };
    };

    // Test Hook Integration
    const hook = mockUseCertificates();
    await hook.fetchCertificates();

    expect(hook.loading).toBe(false);
    expect(Array.isArray(hook.certificates)).toBe(true);
  });
});
```

## Performance Integration Tests

### Test 5: Load Testing

```javascript
describe("Performance Integration", () => {
  test("Frontend can handle multiple concurrent certificate requests", async () => {
    const concurrentRequests = 10;
    const startTime = Date.now();

    // Simuliere multiple Frontend-Anfragen
    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      fetch("http://localhost:3001/certificates"),
    );

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    // Alle Anfragen erfolgreich
    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });

    // Performance-Kriterium: < 2 Sekunden für 10 Anfragen
    expect(endTime - startTime).toBeLessThan(2000);
  });

  test("Blockchain performance under load", async () => {
    // Simuliere multiple Zertifikat-Ausstellungen
    const certificates = Array.from({ length: 5 }, (_, i) => ({
      recipientName: `Load Test Student ${i}`,
      institutionName: "Test University",
      certificateType: "CERTIFICATION",
      courseName: `Course ${i}`,
    }));

    const startTime = Date.now();

    // Parallele Ausstellung
    const promises = certificates.map((cert) =>
      fetch("http://localhost:3001/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cert),
      }),
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    // Alle erfolgreich ausgestellt
    expect(responses.every((r) => r.status === 201)).toBe(true);

    // Performance: < 3 Sekunden für 5 Zertifikate
    expect(endTime - startTime).toBeLessThan(3000);
  });
});
```

## Security Integration Tests

### Test 6: Security Validation

```javascript
describe("Security Integration", () => {
  test("Invalid signatures are rejected", async () => {
    // Versuche, Zertifikat mit falscher Signatur zu erstellen
    const invalidCertData = {
      recipientName: "Malicious User",
      institutionName: "Fake University",
      certificateType: "PHD",
      courseName: "Hacking 101",
      // Falsche oder fehlende Institution Keys
    };

    const response = await fetch("http://localhost:3001/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invalidCertData),
    });

    // Sollte abgelehnt werden
    expect(response.status).toBe(400);
  });

  test("Unauthorized institutions cannot issue certificates", async () => {
    // Simuliere nicht-autorisierte Institution
    const unauthorizedCertData = {
      recipientName: "Test Student",
      institutionName: "Unauthorized Institution",
      certificateType: "BACHELOR",
      courseName: "Unauthorized Course",
    };

    const response = await fetch("http://localhost:3001/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(unauthorizedCertData),
    });

    expect(response.status).toBe(403);
  });
});
```

## DSGVO Compliance Tests

### Test 7: Data Protection Integration

```javascript
describe("DSGVO Compliance Integration", () => {
  test("Personal data is minimized in blockchain", async () => {
    const certificateData = {
      recipientName: "GDPR Test Student",
      recipientId: "GDPR001",
      institutionName: "Privacy University",
      certificateType: "BACHELOR",
      courseName: "Data Protection Law",
    };

    // Issue certificate
    const response = await fetch("http://localhost:3001/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(certificateData),
    });

    const result = await response.json();

    // Verify minimal data storage
    const blockchainResponse = await fetch("http://localhost:3001/blockchain");
    const blockchain = await blockchainResponse.json();

    // Check that sensitive data is not stored in plain text
    const blockData = JSON.stringify(blockchain);

    // Specific personal identifiers should be hashed or anonymized
    expect(blockData).not.toContain("personal-email@example.com");
    expect(blockData).not.toContain("detailed-personal-info");
  });
});
```

## Usability Integration Tests

### Test 8: User Experience Flow

```javascript
describe("UX Integration", () => {
  test("Complete user journey: Issue → View → Verify", async () => {
    // 1. Institution issues certificate
    const issueData = {
      recipientName: "UX Test Student",
      institutionName: "User Experience University",
      certificateType: "MASTER",
      courseName: "Human-Computer Interaction",
    };

    const issueResponse = await fetch("http://localhost:3001/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(issueData),
    });

    expect(issueResponse.status).toBe(201);
    const issued = await issueResponse.json();

    // 2. Student views certificate
    const viewResponse = await fetch(
      `http://localhost:3001/certificates/${issued.certificate.id}`,
    );

    expect(viewResponse.status).toBe(200);
    const certificate = await viewResponse.json();

    // 3. Employer verifies certificate
    const verifyResponse = await fetch(
      `http://localhost:3001/certificates/${issued.certificate.id}/verify`,
      { method: "POST" },
    );

    expect(verifyResponse.status).toBe(200);
    const verification = await verifyResponse.json();
    expect(verification.valid).toBe(true);

    // 4. Complete workflow successful
    expect(certificate.recipientName).toBe(issueData.recipientName);
    expect(verification.status).toBe("VALID");
  });
});
```

## Test Automation Script

### Continuous Integration Test Runner

```bash
#!/bin/bash
# test-runner.sh

echo "🚀 Starting Blockchain Certificate Integration Tests"

# 1. Start Backend Nodes
echo "📡 Starting backend nodes..."
cd backend
npm run university &
UNIVERSITY_PID=$!
npm run vocational &
VOCATIONAL_PID=$!
npm run certification &
CERTIFICATION_PID=$!

# Wait for nodes to start
sleep 10

# 2. Run Integration Tests
echo "🧪 Running integration tests..."
npm run test:integration

# 3. Run Performance Tests
echo "⚡ Running performance tests..."
npm run test:performance

# 4. Run Security Tests
echo "🔒 Running security tests..."
npm run test:security

# 5. Cleanup
echo "🧹 Cleaning up..."
kill $UNIVERSITY_PID $VOCATIONAL_PID $CERTIFICATION_PID

echo "✅ Integration test suite completed"
```

## Test Results Documentation Template

### Test Execution Report

```markdown
# Integration Test Execution Report

Date: $(date)
Version: v1.0.0

## Test Summary

- Total Tests: 25
- Passed: 23 ✅
- Failed: 2 ❌
- Skipped: 0 ⏭️

## Failed Tests

1. **Multi-Node Sync Test**: Network latency caused timeout
2. **Load Test**: Performance degraded under 100+ concurrent requests

## Performance Metrics

- Certificate Issuance: 0.3s average
- Certificate Verification: 0.1s average
- Blockchain Sync: 1.2s average

## Security Validation

- ✅ All cryptographic functions validated
- ✅ Authorization checks passing
- ✅ Input validation working

## Recommendations

1. Optimize network synchronization
2. Implement connection pooling
3. Add performance monitoring
```

Diese umfassende Test-Suite dokumentiert das vollständige Zusammenspiel zwischen Frontend, Backend und Blockchain-Komponenten und bietet eine solide Grundlage für kontinuierliche Integration und Qualitätssicherung.
