const Block = require("./Block");
const CertificateTransaction = require("./CertificateTransaction");
const Certificate = require("./Certificate");
const { InstitutionRegistry } = require("./Institution");

/**
 * Educational Certificate Blockchain
 * Specialized blockchain for managing educational certificates with Proof of Authority consensus
 *
 * This blockchain is designed specifically for certificate management and does not include
 * currency-like features such as balances, amounts, or transaction fees.
 */
class CertificateBlockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.difficulty = 2; // Lower difficulty for faster consensus in PoA
    this.currentNodeUrl = "";
    this.networkNodes = [];
    this.institutionRegistry = new InstitutionRegistry();

    // Certificate-specific data structures
    this.certificates = new Map(); // certificateId -> certificate
    this.revokedCertificates = new Set(); // Set of revoked certificate IDs
    this.verificationHistory = new Map(); // certificateId -> verification records

    // Wallet-specific data structures for certificate ownership tracking
    this.walletCertificates = new Map(); // walletAddress -> Set of certificate IDs
    this.walletIssuedCertificates = new Map(); // walletAddress -> Set of certificate IDs (as issuer)
    this.walletReceivedCertificates = new Map(); // walletAddress -> Set of certificate IDs (as recipient)

    // Proof of Authority settings
    this.authorizedValidators = new Set(); // Authorized institution addresses
    this.consensusThreshold = 2; // 2 out of 3 validators required
  }

  /**
   * Create the genesis block
   */
  createGenesisBlock() {
    const genesisBlock = new Block(0, Date.now(), [], "0");
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
   * In a certificate blockchain, "mining" is simply processing pending certificate transactions
   */
  minePendingTransactions(validatorAddress) {
    // Only authorized validators can process blocks
    if (!this.isAuthorizedValidator(validatorAddress)) {
      throw new Error(
        "Only authorized institutions can process certificate blocks",
      );
    }

    // Create new block without mining rewards (not applicable for certificates)
    const block = new Block(
      this.chain.length, // Index is the current chain length
      Date.now(),
      this.pendingTransactions.map((tx) => tx.toLegacyTransaction()),
      this.getLatestBlock().hash,
    );

    // Light processing for PoA (no energy-intensive mining)
    block.mineBlock(this.difficulty);

    // Process transactions after block creation
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
        console.error(
          `Error processing transaction ${transaction.id}:`,
          error.message,
        );
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

    // Track wallet ownership of certificates
    const issuerWallet = certificate.institutionPublicKey;
    const recipientWallet =
      transaction.payload.recipientWalletAddress ||
      (certificate.metadata && certificate.metadata.recipientWalletAddress);

    // Track issued certificates for the issuer wallet (institution)
    if (issuerWallet) {
      if (!this.walletIssuedCertificates.has(issuerWallet)) {
        this.walletIssuedCertificates.set(issuerWallet, new Set());
      }
      this.walletIssuedCertificates.get(issuerWallet).add(certificate.id);

      // Also add to general wallet certificates map
      if (!this.walletCertificates.has(issuerWallet)) {
        this.walletCertificates.set(issuerWallet, new Set());
      }
      this.walletCertificates.get(issuerWallet).add(certificate.id);
    }

    // Track received certificates for the recipient wallet
    if (recipientWallet && recipientWallet !== issuerWallet) {
      if (!this.walletReceivedCertificates.has(recipientWallet)) {
        this.walletReceivedCertificates.set(recipientWallet, new Set());
      }
      this.walletReceivedCertificates.get(recipientWallet).add(certificate.id);

      // Also add to general wallet certificates map
      if (!this.walletCertificates.has(recipientWallet)) {
        this.walletCertificates.set(recipientWallet, new Set());
      }
      this.walletCertificates.get(recipientWallet).add(certificate.id);
    }

    // Update institution statistics
    this.institutionRegistry.incrementCertificatesIssued(
      transaction.fromAddress,
    );
  }

  /**
   * Process certificate verification transaction
   */
  processCertificateVerification(transaction) {
    const { certificateId, verificationResult, verifiedAt } =
      transaction.payload;

    if (!this.verificationHistory.has(certificateId)) {
      this.verificationHistory.set(certificateId, []);
    }

    this.verificationHistory.get(certificateId).push({
      verifier: transaction.fromAddress,
      result: verificationResult,
      timestamp: verifiedAt,
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
  issueCertificate(
    certificate,
    institutionPrivateKey,
    recipientWalletAddress = null,
  ) {
    // Validate institution authorization
    if (!this.isAuthorizedValidator(certificate.institutionPublicKey)) {
      throw new Error("Institution is not authorized to issue certificates");
    }

    // Sign the certificate
    certificate.signCertificate(institutionPrivateKey);

    // Create transaction
    const transaction = CertificateTransaction.createCertificateIssuance(
      certificate.institutionPublicKey,
      certificate,
    );

    // Add recipient wallet address to transaction payload if provided
    if (recipientWalletAddress) {
      transaction.payload.recipientWalletAddress = recipientWalletAddress;
    }

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
      throw new Error(
        "Transaction validation failed: " + validationErrors.join(", "),
      );
    }

    this.pendingTransactions.push(transaction);
  }

  /**
   * Get all certificates
   */
  getAllCertificates() {
    return Array.from(this.certificates.values());
  }

  /**
   * Get certificate by ID
   */
  getCertificateById(certificateId) {
    return this.certificates.get(certificateId);
  }

  /**
   * Search certificates by various criteria
   */
  searchCertificates(criteria = {}) {
    const allCertificates = this.getAllCertificates();

    return allCertificates.filter((cert) => {
      // Filter by recipient name
      if (
        criteria.recipientName &&
        !cert.recipientName
          .toLowerCase()
          .includes(criteria.recipientName.toLowerCase())
      ) {
        return false;
      }

      // Filter by institution
      if (
        criteria.institutionName &&
        !cert.institutionName
          .toLowerCase()
          .includes(criteria.institutionName.toLowerCase())
      ) {
        return false;
      }

      // Filter by institution public key
      if (
        criteria.institutionPublicKey &&
        cert.institutionPublicKey !== criteria.institutionPublicKey
      ) {
        return false;
      }

      // Filter by recipient ID
      if (criteria.recipientId && cert.recipientId !== criteria.recipientId) {
        return false;
      }

      // Filter by certificate type
      if (
        criteria.certificateType &&
        cert.certificateType !== criteria.certificateType
      ) {
        return false;
      }

      // Filter by course name
      if (
        criteria.courseName &&
        !cert.courseName
          .toLowerCase()
          .includes(criteria.courseName.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
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
      totalTransactions: this.chain.reduce(
        (sum, block) => sum + block.transactions.length,
        0,
      ),
      totalCertificates,
      validCertificates,
      revokedCertificates: revokedCount,
      totalInstitutions: institutionStats.length,
      authorizedValidators: this.authorizedValidators.size,
      institutionStats,
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
          const transaction =
            CertificateTransaction.fromLegacyTransaction(legacyTx);
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
          const transaction =
            CertificateTransaction.fromLegacyTransaction(legacyTx);
          this.processTransaction(transaction);
        } catch (error) {
          console.error("Error rebuilding from transaction:", error);
        }
      }
    }
  }

  /**
   * Rebuild wallet data structures from the entire blockchain
   * Useful for ensuring data consistency after blockchain operations
   */
  rebuildWalletData() {
    // Clear existing wallet data
    this.walletCertificates.clear();
    this.walletIssuedCertificates.clear();
    this.walletReceivedCertificates.clear();

    // Rebuild from all certificates
    for (const certificate of this.certificates.values()) {
      if (!certificate || !certificate.id) continue;

      const issuerWallet = certificate.institutionPublicKey;
      const recipientWallet =
        certificate.metadata && certificate.metadata.recipientWalletAddress;

      // Track issued certificates for the issuer wallet (institution)
      if (issuerWallet) {
        if (!this.walletIssuedCertificates.has(issuerWallet)) {
          this.walletIssuedCertificates.set(issuerWallet, new Set());
        }
        this.walletIssuedCertificates.get(issuerWallet).add(certificate.id);

        // Also add to general wallet certificates map
        if (!this.walletCertificates.has(issuerWallet)) {
          this.walletCertificates.set(issuerWallet, new Set());
        }
        this.walletCertificates.get(issuerWallet).add(certificate.id);
      }

      // Track received certificates for the recipient wallet
      if (recipientWallet && recipientWallet !== issuerWallet) {
        if (!this.walletReceivedCertificates.has(recipientWallet)) {
          this.walletReceivedCertificates.set(recipientWallet, new Set());
        }
        this.walletReceivedCertificates
          .get(recipientWallet)
          .add(certificate.id);

        // Also add to general wallet certificates map
        if (!this.walletCertificates.has(recipientWallet)) {
          this.walletCertificates.set(recipientWallet, new Set());
        }
        this.walletCertificates.get(recipientWallet).add(certificate.id);
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
    return this.chain.find((block) => block.hash === hash);
  }

  /**
   * Get certificates owned by a wallet (both issued and received)
   */
  getWalletCertificates(walletAddress) {
    const certificateIds =
      this.walletCertificates.get(walletAddress) || new Set();
    const certificates = [];

    for (const certId of certificateIds) {
      const certificate = this.certificates.get(certId);
      if (certificate) {
        certificates.push(certificate);
      }
    }

    return certificates;
  }

  /**
   * Get certificates issued by a wallet (institution)
   */
  getWalletIssuedCertificates(walletAddress) {
    const certificateIds =
      this.walletIssuedCertificates.get(walletAddress) || new Set();
    const certificates = [];

    for (const certId of certificateIds) {
      const certificate = this.certificates.get(certId);
      if (certificate) {
        certificates.push(certificate);
      }
    }

    return certificates;
  }

  /**
   * Get certificates received by a wallet
   */
  getWalletReceivedCertificates(walletAddress) {
    const certificateIds =
      this.walletReceivedCertificates.get(walletAddress) || new Set();
    const certificates = [];

    for (const certId of certificateIds) {
      const certificate = this.certificates.get(certId);
      if (certificate) {
        certificates.push(certificate);
      }
    }

    return certificates;
  }

  /**
   * Get wallet certificate statistics
   */
  getWalletStats(walletAddress) {
    const issuedCount = (
      this.walletIssuedCertificates.get(walletAddress) || new Set()
    ).size;
    const receivedCount = (
      this.walletReceivedCertificates.get(walletAddress) || new Set()
    ).size;
    const totalCount = (this.walletCertificates.get(walletAddress) || new Set())
      .size;

    return {
      totalCertificates: totalCount,
      issuedCertificates: issuedCount,
      receivedCertificates: receivedCount,
    };
  }

  /**
   * Verify a certificate by ID
   */
  verifyCertificate(certificateId) {
    try {
      // Get certificate from blockchain
      const certificate = this.getCertificateById(certificateId);

      if (!certificate) {
        return {
          valid: false,
          status: "NOT_FOUND",
          message: "Certificate not found on the blockchain",
          certificate: null,
        };
      }

      // Check if certificate is revoked
      if (this.revokedCertificates.has(certificateId)) {
        return {
          valid: false,
          status: "REVOKED",
          message: "Certificate has been revoked",
          certificate: certificate,
        };
      }

      // Check if certificate is expired
      if (certificate.isExpired()) {
        return {
          valid: false,
          status: "EXPIRED",
          message: "Certificate has expired",
          certificate: certificate,
        };
      }

      // Verify certificate signature and integrity
      try {
        const signatureValid = certificate.isValid();
        if (!signatureValid) {
          return {
            valid: false,
            status: "INVALID",
            message: "Certificate signature is invalid",
            certificate: certificate,
          };
        }
      } catch (error) {
        return {
          valid: false,
          status: "INVALID",
          message: "Certificate validation failed: " + error.message,
          certificate: certificate,
        };
      }

      // Check if issuing institution is authorized
      if (!this.isAuthorizedValidator(certificate.institutionPublicKey)) {
        return {
          valid: false,
          status: "INVALID",
          message: "Certificate was issued by an unauthorized institution",
          certificate: certificate,
        };
      }

      // Certificate is valid
      const verificationHistory = this.verificationHistory.get(certificateId) || [];
      
      // Clean verification history to avoid circular references
      const cleanHistory = verificationHistory.map(record => ({
        verifier: record.verifier,
        status: record.result?.status || 'UNKNOWN',
        message: record.result?.message || 'No message',
        timestamp: record.timestamp
      }));

      return {
        valid: true,
        status: "VALID",
        message: "Certificate is valid and authentic",
        certificate: certificate,
        verificationHistory: cleanHistory,
      };
    } catch (error) {
      return {
        valid: false,
        status: "ERROR",
        message: "Verification error: " + error.message,
        certificate: null,
      };
    }
  }
}

module.exports = CertificateBlockchain;
