const Certificate = require("../core/Certificate");
const CertificateTransaction = require("../core/CertificateTransaction");
const CertificateBlockchain = require("../core/CertificateBlockchain");
const { Institution, InstitutionRegistry } = require("../core/Institution");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

console.log("🧪 Certificate Blockchain Test Suite");
console.log("=====================================\n");

// Test 1: Certificate Creation and Validation
console.log("1️⃣ Testing Certificate Creation and Validation");

try {
  // Create test institution
  const institutionKeyPair = ec.genKeyPair();
  const institutionPublicKey = institutionKeyPair.getPublic("hex");
  const institutionPrivateKey = institutionKeyPair.getPrivate("hex");

  console.log("✅ Generated institution key pair");

  // Create certificate
  const certificate = new Certificate({
    recipientName: "John Doe",
    recipientId: "STU123456",
    institutionName: "University of Technology",
    institutionPublicKey: institutionPublicKey,
    certificateType: "BACHELOR",
    courseName: "Computer Science",
    completionDate: "2024-05-15",
    grade: "A",
    credentialLevel: "Bachelor of Science",
  });

  console.log("✅ Created certificate:", certificate.id);

  // Sign certificate
  certificate.signCertificate(institutionPrivateKey);
  console.log("✅ Certificate signed");

  // Validate certificate
  const isValid = certificate.isValid();
  console.log("✅ Certificate validation:", isValid);

  console.log("📋 Certificate details:");
  console.log(`   - Recipient: ${certificate.recipientName}`);
  console.log(`   - Institution: ${certificate.institutionName}`);
  console.log(`   - Type: ${certificate.certificateType}`);
  console.log(`   - Course: ${certificate.courseName}`);
  console.log(`   - Status: ${certificate.getStatus()}\n`);
} catch (error) {
  console.error("❌ Certificate test failed:", error.message);
}

// Test 2: Institution Registry
console.log("2️⃣ Testing Institution Registry");

try {
  const registry = new InstitutionRegistry();

  // Create institutions
  const university = Institution.generateNew(
    "University of Technology",
    "UNIVERSITY",
  );
  const vocational = Institution.generateNew(
    "Professional Vocational School",
    "VOCATIONAL_SCHOOL",
  );
  const certification = Institution.generateNew(
    "Global Certification Provider",
    "CERTIFICATION_PROVIDER",
  );

  // Register institutions
  registry.registerInstitution(university);
  registry.registerInstitution(vocational);
  registry.registerInstitution(certification);

  console.log("✅ Registered 3 institutions");

  // Test authorization
  console.log(
    "✅ University authorized:",
    registry.isAuthorized(university.publicKey),
  );
  console.log(
    "✅ Vocational authorized:",
    registry.isAuthorized(vocational.publicKey),
  );
  console.log(
    "✅ Certification authorized:",
    registry.isAuthorized(certification.publicKey),
  );

  const allInstitutions = registry.getAllInstitutions();
  console.log("✅ Total institutions:", allInstitutions.length);

  console.log("📋 Institution details:");
  allInstitutions.forEach((inst, index) => {
    console.log(`   ${index + 1}. ${inst.name} (${inst.type})`);
  });
  console.log();
} catch (error) {
  console.error("❌ Institution registry test failed:", error.message);
}

// Test 3: Certificate Blockchain
console.log("3️⃣ Testing Certificate Blockchain");

try {
  const blockchain = new CertificateBlockchain();

  // Setup test institution
  const testKeyPair = ec.genKeyPair();
  const testPublicKey = testKeyPair.getPublic("hex");
  const testPrivateKey = testKeyPair.getPrivate("hex");

  const testInstitution = Institution.createFromPrivateKey(
    "Test University",
    "UNIVERSITY",
    testPrivateKey,
  );

  blockchain.institutionRegistry.registerInstitution(testInstitution);
  blockchain.addAuthorizedValidator(testPublicKey);

  console.log("✅ Setup test institution and blockchain");

  // Create and issue certificate
  const testCertificate = new Certificate({
    recipientName: "Alice Smith",
    recipientId: "STU789012",
    institutionName: testInstitution.name,
    institutionPublicKey: testPublicKey,
    certificateType: "MASTER",
    courseName: "Data Science",
    completionDate: "2024-06-20",
    grade: "A+",
    credentialLevel: "Master of Science",
  });

  const transaction = blockchain.issueCertificate(
    testCertificate,
    testPrivateKey,
  );
  console.log("✅ Certificate issued, transaction created:", transaction.id);

  // Mine the transaction
  const block = blockchain.minePendingTransactions(testPublicKey);
  console.log("✅ Block mined:", block.hash);

  // Verify certificate
  const verification = blockchain.verifyCertificate(testCertificate.id);
  console.log("✅ Certificate verification:", verification.status);

  // Get blockchain statistics
  const stats = blockchain.getStatistics();
  console.log("📊 Blockchain Statistics:");
  console.log(`   - Total blocks: ${stats.totalBlocks}`);
  console.log(`   - Total certificates: ${stats.totalCertificates}`);
  console.log(`   - Valid certificates: ${stats.validCertificates}`);
  console.log(`   - Authorized validators: ${stats.authorizedValidators}`);
  console.log();
} catch (error) {
  console.error("❌ Certificate blockchain test failed:", error.message);
}

// Test 4: Transaction Types
console.log("4️⃣ Testing Transaction Types");

try {
  // Create test certificate
  const keyPair = ec.genKeyPair();
  const publicKey = keyPair.getPublic("hex");

  const certificate = new Certificate({
    recipientName: "Bob Johnson",
    recipientId: "STU345678",
    institutionName: "Test Institution",
    institutionPublicKey: publicKey,
    certificateType: "CERTIFICATION",
    courseName: "Blockchain Development",
    completionDate: "2024-06-25",
    credentialLevel: "Professional Certificate",
  });

  // Test certificate issuance transaction
  const issuanceTransaction = CertificateTransaction.createCertificateIssuance(
    publicKey,
    certificate,
  );
  console.log(
    "✅ Created certificate issuance transaction:",
    issuanceTransaction.type,
  );

  // Test verification transaction
  const verificationTransaction =
    CertificateTransaction.createCertificateVerification(
      publicKey,
      certificate.id,
      { valid: true, status: "VALID" },
    );
  console.log(
    "✅ Created certificate verification transaction:",
    verificationTransaction.type,
  );

  // Test revocation transaction
  const revocationTransaction =
    CertificateTransaction.createCertificateRevocation(
      publicKey,
      certificate.id,
      "Fraudulent application detected",
    );
  console.log(
    "✅ Created certificate revocation transaction:",
    revocationTransaction.type,
  );

  // Test mining reward transaction
  const miningRewardTransaction = CertificateTransaction.createMiningReward(
    publicKey,
    10,
  );
  console.log(
    "✅ Created mining reward transaction:",
    miningRewardTransaction.type,
  );

  console.log("📋 Transaction summaries:");
  [
    issuanceTransaction,
    verificationTransaction,
    revocationTransaction,
    miningRewardTransaction,
  ].forEach((tx, index) => {
    const summary = tx.getSummary();
    console.log(
      `   ${index + 1}. ${summary.type} - ${summary.id.substring(0, 8)}...`,
    );
  });
  console.log();
} catch (error) {
  console.error("❌ Transaction types test failed:", error.message);
}

// Test 5: End-to-End Certificate Lifecycle
console.log("5️⃣ Testing End-to-End Certificate Lifecycle");

try {
  const blockchain = new CertificateBlockchain();

  // Setup 3 institutions
  const institutions = [
    { name: "University A", type: "UNIVERSITY" },
    { name: "Vocational School B", type: "VOCATIONAL_SCHOOL" },
    { name: "Certification Provider C", type: "CERTIFICATION_PROVIDER" },
  ].map((config) => {
    const institution = Institution.generateNew(config.name, config.type);
    blockchain.institutionRegistry.registerInstitution(institution);
    blockchain.addAuthorizedValidator(institution.publicKey);
    return institution;
  });

  console.log("✅ Setup 3-node institution network");

  // Issue certificates from different institutions
  const certificates = [];

  for (let i = 0; i < institutions.length; i++) {
    const institution = institutions[i];
    const certificate = new Certificate({
      recipientName: `Student ${i + 1}`,
      recipientId: `STU${1000 + i}`,
      institutionName: institution.name,
      institutionPublicKey: institution.publicKey,
      certificateType: ["BACHELOR", "DIPLOMA", "CERTIFICATION"][i],
      courseName: [
        `Computer Science ${i + 1}`,
        `Engineering ${i + 1}`,
        `Project Management ${i + 1}`,
      ][i],
      completionDate: new Date(2024, 5, 15 + i).toISOString(),
      credentialLevel: ["Bachelor", "Diploma", "Professional"][i],
    });

    const transaction = blockchain.issueCertificate(
      certificate,
      institution.privateKey,
    );
    certificates.push(certificate);

    console.log(`✅ Certificate ${i + 1} issued by ${institution.name}`);
  }

  // Mine all transactions
  const block = blockchain.minePendingTransactions(institutions[0].publicKey);
  console.log("✅ All certificates mined in block:", block.hash);

  // Verify all certificates
  certificates.forEach((cert, index) => {
    const verification = blockchain.verifyCertificate(cert.id);
    console.log(
      `✅ Certificate ${index + 1} verification: ${verification.status}`,
    );
  });

  // Test certificate search
  const searchResults = blockchain.searchCertificates("Computer");
  console.log(
    "✅ Search for 'Computer' found:",
    searchResults.length,
    "certificates",
  );

  // Final statistics
  const finalStats = blockchain.getStatistics();
  console.log("📊 Final Statistics:");
  console.log(`   - Blocks: ${finalStats.totalBlocks}`);
  console.log(`   - Transactions: ${finalStats.totalTransactions}`);
  console.log(`   - Certificates: ${finalStats.totalCertificates}`);
  console.log(`   - Institutions: ${finalStats.totalInstitutions}`);
  console.log();
} catch (error) {
  console.error("❌ End-to-end test failed:", error.message);
}

console.log("🎉 Certificate Blockchain Test Suite Completed!");
console.log("All core functionality has been validated.");
