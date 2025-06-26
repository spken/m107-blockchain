const Block = require("./Block");
const CertificateTransaction = require("./CertificateTransaction");
const Certificate = require("./Certificate");
const { InstitutionRegistry } = require("./Institution");

/**
 * Educational Certificate Blockchain
 * Specialized blockchain for managing educational certificates with Proof of Authority consensus
 */
class CertificateBlockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 2; // Lower difficulty for faster consensus
    this.miningReward = 10; // Small reward for maintaining the network
    this.currentNodeUrl = "";
    this.networkNodes = [];
    this.institutionRegistry = new InstitutionRegistry();
    
    // Certificate-specific data structures
    this.certificates = new Map(); // certificateId -> certificate
    this.revokedCertificates = new Set(); // Set of revoked certificate IDs
    this.verificationHistory = new Map(); // certificateId -> verification records
    
    // Proof of Authority settings
    this.authorizedValidators = new Set(); // Authorized institution addresses
    this.consensusThreshold = 2; // 2 out of 3 validators required
  }

  /**
   * Create the genesis block
   */
  createGenesisBlock() {
    const genesisBlock = new Block(Date.now(), [], "0");
    genesisBlock.hash = genesisBlock.calculateHash();
    return genesisBlock;
  }

  /**
   * Get the latest block in the chain
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add an authorized validator (institution)
   */
  addAuthorizedValidator(institutionPublicKey) {
    this.authorizedValidators.add(institutionPublicKey);
    this.institutionRegistry.authorizeInstitution(institutionPublicKey);
  }

  /**
   * Check if an address is an authorized validator
   */
  isAuthorizedValidator(address) {
    return this.authorizedValidators.has(address);
  }

  /**
   * Mine pending transactions (Proof of Authority)
   */
  minePendingTransactions(miningRewardAddress) {
    // Only authorized validators can mine
    if (!this.isAuthorizedValidator(miningRewardAddress)) {
      throw new Error("Only authorized institutions can mine blocks");
    }

    // Add mining reward
    const rewardTransaction = CertificateTransaction.createMiningReward(
      miningRewardAddress,
      this.miningReward
    );
    this.pendingTransactions.push(rewardTransaction);

    // Create new block
    const block = new Block(
      Date.now(),
      this.pendingTransactions.map(tx => tx.toLegacyTransaction()),
      this.getLatestBlock().hash
    );
    
    // Lighter mining for PoA
    block.mineBlock(this.difficulty);

    // Process transactions after mining
    this.processPendingTransactions();

    // Add block to chain
    this.chain.push(block);
    this.pendingTransactions = [];

    return block;
  }

  /**
   * Process pending transactions to update certificate registry
   */
  processPendingTransactions() {
    for (const transaction of this.pendingTransactions) {
      try {
        this.processTransaction(transaction);
      } catch (error) {
        console.error(`Error processing transaction ${transaction.id}:`, error.message);
      }
    }
  }

  /**
   * Process a single transaction
   */
  processTransaction(transaction) {
    switch (transaction.type) {
      case "CERTIFICATE_ISSUANCE":
        this.processCertificateIssuance(transaction);
        break;
      case "CERTIFICATE_VERIFICATION":
        this.processCertificateVerification(transaction);
        break;
      case "CERTIFICATE_REVOCATION":
        this.processCertificateRevocation(transaction);
        break;
      case "MINING_REWARD":
        // Mining rewards don't need special processing
        break;
      default:
        console.warn(`Unknown transaction type: ${transaction.type}`);
    }
  }

  /**
   * Process certificate issuance transaction
   */
  processCertificateIssuance(transaction) {
    if (!this.isAuthorizedValidator(transaction.fromAddress)) {
      throw new Error("Only authorized institutions can issue certificates");
    }

    const certificateData = transaction.payload.certificate;
    const certificate = Certificate.fromTransactionPayload(transaction.payload);
    
    // Validate certificate
    if (!certificate.isValid()) {
      throw new Error("Invalid certificate signature");
    }

    // Store certificate
    this.certificates.set(certificate.id, certificate);
    
    // Update institution statistics
    this.institutionRegistry.incrementCertificatesIssued(transaction.fromAddress);
  }

  /**
   * Process certificate verification transaction
   */
  processCertificateVerification(transaction) {
    const { certificateId, verificationResult, verifiedAt } = transaction.payload;
    
    if (!this.verificationHistory.has(certificateId)) {
      this.verificationHistory.set(certificateId, []);
    }
    
    this.verificationHistory.get(certificateId).push({
      verifier: transaction.fromAddress,
      result: verificationResult,
      timestamp: verifiedAt
    });
  }

  /**
   * Process certificate revocation transaction
   */
  processCertificateRevocation(transaction) {
    if (!this.isAuthorizedValidator(transaction.fromAddress)) {
      throw new Error("Only authorized institutions can revoke certificates");
    }

    const { certificateId, reason, revokedAt } = transaction.payload;
    
    // Check if the institution has authority to revoke this certificate
    const certificate = this.certificates.get(certificateId);
    if (!certificate) {
      throw new Error("Certificate not found");
    }

    if (certificate.institutionPublicKey !== transaction.fromAddress) {
      throw new Error("Institution can only revoke certificates it issued");
    }

    this.revokedCertificates.add(certificateId);
  }

  /**
   * Create and add a certificate transaction
   */
  issueCertificate(certificate, institutionPrivateKey) {
    // Validate institution authorization
    if (!this.isAuthorizedValidator(certificate.institutionPublicKey)) {
      throw new Error("Institution is not authorized to issue certificates");
    }

    // Sign the certificate
    certificate.signCertificate(institutionPrivateKey);

    // Create transaction
    const transaction = CertificateTransaction.createCertificateIssuance(
      certificate.institutionPublicKey,
      certificate
    );

    // Sign transaction
    const EC = require("elliptic").ec;
    const ec = new EC("secp256k1");
    const keyPair = ec.keyFromPrivate(institutionPrivateKey);
    transaction.signTransaction(keyPair);

    // Add to pending transactions
    this.addTransaction(transaction);

    return transaction;
  }

  /**
   * Add a transaction to pending transactions
   */
  addTransaction(transaction) {
    // Validate transaction
    if (!transaction.isValid()) {
      throw new Error("Invalid transaction signature");
    }

    // Validate transaction data
    const validationErrors = transaction.validateTransactionData();
    if (validationErrors.length > 0) {
      throw new Error("Transaction validation failed: " + validationErrors.join(", "));
    }

    this.pendingTransactions.push(transaction);
  }

  /**
   * Get certificate by ID
   */
  getCertificate(certificateId) {
    return this.certificates.get(certificateId);
  }

  /**
   * Verify certificate authenticity
   */
  verifyCertificate(certificateId) {
    const certificate = this.certificates.get(certificateId);
    
    if (!certificate) {
      return {
        valid: false,
        status: "NOT_FOUND",
        message: "Certificate not found on blockchain"
      };
    }

    if (this.revokedCertificates.has(certificateId)) {
      return {
        valid: false,
        status: "REVOKED",
        message: "Certificate has been revoked",
        certificate
      };
    }

    if (certificate.isExpired()) {
      return {
        valid: false,
        status: "EXPIRED",
        message: "Certificate has expired",
        certificate
      };
    }

    try {
      const isSignatureValid = certificate.isValid();
      const isInstitutionAuthorized = this.isAuthorizedValidator(certificate.institutionPublicKey);

      if (isSignatureValid && isInstitutionAuthorized) {
        return {
          valid: true,
          status: "VALID",
          message: "Certificate is valid and authentic",
          certificate
        };
      } else {
        return {
          valid: false,
          status: "INVALID",
          message: "Certificate signature invalid or institution not authorized",
          certificate
        };
      }
    } catch (error) {
      return {
        valid: false,
        status: "ERROR",
        message: "Error verifying certificate: " + error.message,
        certificate
      };
    }
  }

  /**
   * Get all certificates issued by an institution
   */
  getCertificatesByInstitution(institutionPublicKey) {
    return Array.from(this.certificates.values())
      .filter(cert => cert.institutionPublicKey === institutionPublicKey);
  }

  /**
   * Get all certificates for a recipient
   */
  getCertificatesByRecipient(recipientId) {
    return Array.from(this.certificates.values())
      .filter(cert => cert.recipientId === recipientId);
  }

  /**
   * Get verification history for a certificate
   */
  getCertificateVerificationHistory(certificateId) {
    return this.verificationHistory.get(certificateId) || [];
  }

  /**
   * Search certificates
   */
  searchCertificates(query) {
    const searchTerm = query.toLowerCase();
    return Array.from(this.certificates.values())
      .filter(cert => 
        cert.recipientName.toLowerCase().includes(searchTerm) ||
        cert.institutionName.toLowerCase().includes(searchTerm) ||
        cert.courseName.toLowerCase().includes(searchTerm) ||
        cert.certificateType.toLowerCase().includes(searchTerm)
      );
  }

  /**
   * Get blockchain statistics
   */
  getStatistics() {
    const totalCertificates = this.certificates.size;
    const revokedCount = this.revokedCertificates.size;
    const validCertificates = totalCertificates - revokedCount;
    
    const institutionStats = this.institutionRegistry.getAllInstitutions();
    
    return {
      totalBlocks: this.chain.length,
      totalTransactions: this.chain.reduce((sum, block) => sum + block.transactions.length, 0),
      totalCertificates,
      validCertificates,
      revokedCertificates: revokedCount,
      totalInstitutions: institutionStats.length,
      authorizedValidators: this.authorizedValidators.size,
      institutionStats
    };
  }

  /**
   * Validate the entire blockchain
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Validate block hash
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      // Validate previous block link
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Validate transactions in block
      for (const legacyTx of currentBlock.transactions) {
        try {
          const transaction = CertificateTransaction.fromLegacyTransaction(legacyTx);
          if (!transaction.isValid()) {
            return false;
          }
        } catch (error) {
          console.error("Transaction validation error:", error);
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Rebuild certificate registry from blockchain
   */
  rebuildCertificateRegistry() {
    // Clear existing data
    this.certificates.clear();
    this.revokedCertificates.clear();
    this.verificationHistory.clear();

    // Process all transactions in the blockchain
    for (const block of this.chain) {
      for (const legacyTx of block.transactions) {
        try {
          const transaction = CertificateTransaction.fromLegacyTransaction(legacyTx);
          this.processTransaction(transaction);
        } catch (error) {
          console.error("Error rebuilding from transaction:", error);
        }
      }
    }
  }

  /**
   * Get all blocks
   */
  getAllBlocks() {
    return this.chain;
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions() {
    return this.pendingTransactions;
  }

  /**
   * Get block by hash
   */
  getBlockByHash(hash) {
    return this.chain.find(block => block.hash === hash);
  }
}

module.exports = CertificateBlockchain;
