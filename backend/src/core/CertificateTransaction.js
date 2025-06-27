const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const { v4: uuidv4 } = require("uuid");

/**
 * Enhanced Transaction class for educational certificate blockchain
 * Supports certificate issuance, verification, and other certificate-related operations
 */
class CertificateTransaction {
  constructor({
    id = null,
    type,
    fromAddress,
    toAddress = null,
    payload = null,
    fee = 0,
    timestamp = null,
  }) {
    this.id = id || uuidv4();
    this.type = type; // CERTIFICATE_ISSUANCE, CERTIFICATE_VERIFICATION, CERTIFICATE_REVOCATION
    this.fromAddress = fromAddress; // Institution's public key
    this.toAddress = toAddress; // Recipient's address (optional for some transaction types)
    this.payload = payload; // Certificate data or other relevant data
    this.fee = fee;
    this.timestamp = timestamp || new Date().toISOString();
    this.signature = null;
    this.hash = this.calculateHash();
  }

  /**
   * Calculate transaction hash
   */
  calculateHash() {
    const data = {
      id: this.id,
      type: this.type,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      payload: this.payload,
      fee: this.fee,
      timestamp: this.timestamp,
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }

  /**
   * Sign transaction with institution's private key
   */
  signTransaction(signingKey) {
    if (!signingKey) {
      throw new Error("Signing key is required");
    }

    // For certificate transactions, we verify the signing key matches fromAddress
    if (this.fromAddress && signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("Cannot sign transaction for other institutions");
    }

    const transactionHash = this.calculateHash();
    const sig = signingKey.sign(transactionHash, "base64");
    this.signature = sig.toDER("hex");
  }

  /**
   * Verify transaction signature
   */
  isValid() {
    // System transactions (like mining rewards) don't need signatures
    if (this.fromAddress === null) {
      return true;
    }

    if (!this.signature || this.signature.length === 0) {
      throw new Error("Transaction has no signature");
    }

    try {
      const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
      return publicKey.verify(this.calculateHash(), this.signature);
    } catch (error) {
      throw new Error("Invalid transaction signature: " + error.message);
    }
  }

  /**
   * Validate transaction data based on type
   */
  validateTransactionData() {
    const errors = [];

    // Basic validation
    if (
      !this.type ||
      ![
        "CERTIFICATE_ISSUANCE",
        "CERTIFICATE_VERIFICATION",
        "CERTIFICATE_REVOCATION",
        "MINING_REWARD",
      ].includes(this.type)
    ) {
      errors.push("Invalid transaction type");
    }

    if (
      this.type !== "MINING_REWARD" &&
      (!this.fromAddress || this.fromAddress.length !== 130)
    ) {
      errors.push("Invalid fromAddress format");
    }

    // Type-specific validation
    switch (this.type) {
      case "CERTIFICATE_ISSUANCE":
        if (!this.payload || !this.payload.certificate) {
          errors.push(
            "Certificate issuance requires certificate data in payload",
          );
        }
        break;

      case "CERTIFICATE_VERIFICATION":
        if (!this.payload || !this.payload.certificateId) {
          errors.push(
            "Certificate verification requires certificateId in payload",
          );
        }
        break;

      case "CERTIFICATE_REVOCATION":
        if (
          !this.payload ||
          !this.payload.certificateId ||
          !this.payload.reason
        ) {
          errors.push(
            "Certificate revocation requires certificateId and reason in payload",
          );
        }
        break;
    }

    return errors;
  }

  /**
   * Create certificate issuance transaction
   */
  static createCertificateIssuance(institutionPublicKey, certificate) {
    return new CertificateTransaction({
      type: "CERTIFICATE_ISSUANCE",
      fromAddress: institutionPublicKey,
      toAddress: certificate.recipientId,
      payload: certificate.toTransactionPayload(),
      fee: 0, // No fee for certificate issuance
    });
  }

  /**
   * Create certificate verification transaction
   */
  static createCertificateVerification(
    verifierPublicKey,
    certificateId,
    verificationResult,
  ) {
    return new CertificateTransaction({
      type: "CERTIFICATE_VERIFICATION",
      fromAddress: verifierPublicKey,
      payload: {
        certificateId,
        verificationResult,
        verifiedAt: new Date().toISOString(),
      },
      fee: 0,
    });
  }

  /**
   * Create certificate revocation transaction
   */
  static createCertificateRevocation(
    institutionPublicKey,
    certificateId,
    reason,
  ) {
    return new CertificateTransaction({
      type: "CERTIFICATE_REVOCATION",
      fromAddress: institutionPublicKey,
      payload: {
        certificateId,
        reason,
        revokedAt: new Date().toISOString(),
      },
      fee: 0,
    });
  }

  /**
   * Get transaction summary for display
   */
  getSummary() {
    const summary = {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      hash: this.hash,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      fee: this.fee,
      isValid: false,
    };

    try {
      summary.isValid = this.isValid();
    } catch (error) {
      summary.validationError = error.message;
    }

    // Add type-specific summary data
    switch (this.type) {
      case "CERTIFICATE_ISSUANCE":
        if (this.payload && this.payload.certificate) {
          summary.certificate = {
            id: this.payload.certificate.id,
            recipientName: this.payload.certificate.recipientName,
            institutionName: this.payload.certificate.institutionName,
            certificateType: this.payload.certificate.certificateType,
            courseName: this.payload.certificate.courseName,
          };
        }
        break;

      case "CERTIFICATE_VERIFICATION":
        if (this.payload) {
          summary.verification = {
            certificateId: this.payload.certificateId,
            result: this.payload.verificationResult,
          };
        }
        break;

      case "CERTIFICATE_REVOCATION":
        if (this.payload) {
          summary.revocation = {
            certificateId: this.payload.certificateId,
            reason: this.payload.reason,
          };
        }
        break;
    }

    return summary;
  }

  /**
   * Convert to legacy Transaction format for compatibility
   */
  toLegacyTransaction() {
    return {
      id: this.id,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amount: 0, // Certificate transactions don't involve monetary amounts
      fee: this.fee,
      timestamp: this.timestamp,
      payload: this.payload,
      signature: this.signature,
    };
  }

  /**
   * Create from legacy Transaction format
   */
  static fromLegacyTransaction(legacyTx) {
    const type = legacyTx.payload?.type || "UNKNOWN";

    return new CertificateTransaction({
      id: legacyTx.id,
      type: type,
      fromAddress: legacyTx.fromAddress,
      toAddress: legacyTx.toAddress,
      payload: legacyTx.payload,
      fee: legacyTx.fee,
      timestamp: legacyTx.timestamp,
    });
  }
}

module.exports = CertificateTransaction;
