const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const { v4: uuidv4 } = require("uuid");

/**
 * Certificate class for educational certificates
 * Represents a digital certificate stored on the blockchain
 */
class Certificate {
  constructor({
    id = null,
    recipientName,
    recipientId,
    institutionName,
    institutionPublicKey,
    certificateType,
    courseName,
    issueDate,
    completionDate,
    grade = null,
    credentialLevel,
    expirationDate = null,
    metadata = {}
  }) {
    this.id = id || uuidv4();
    this.recipientName = recipientName;
    this.recipientId = recipientId; // Recipient's wallet address
    this.institutionName = institutionName;
    this.institutionPublicKey = institutionPublicKey; // Institution's blockchain address
    this.certificateType = certificateType; // BACHELOR, MASTER, PHD, DIPLOMA, CERTIFICATION
    this.courseName = courseName;
    this.issueDate = issueDate || new Date().toISOString();
    this.completionDate = completionDate;
    this.grade = grade;
    this.credentialLevel = credentialLevel; // Bachelor, Master, Professional, etc.
    this.expirationDate = expirationDate;
    this.metadata = metadata; // Additional custom fields
    this.timestamp = new Date().toISOString();
    this.signature = null;
    this.hash = this.calculateHash();
  }

  /**
   * Calculate the hash of the certificate
   */
  calculateHash() {
    const data = {
      id: this.id,
      recipientName: this.recipientName,
      recipientId: this.recipientId,
      institutionName: this.institutionName,
      institutionPublicKey: this.institutionPublicKey,
      certificateType: this.certificateType,
      courseName: this.courseName,
      issueDate: this.issueDate,
      completionDate: this.completionDate,
      grade: this.grade,
      credentialLevel: this.credentialLevel,
      expirationDate: this.expirationDate,
      metadata: this.metadata
    };

    return crypto
      .createHash("sha256")
      .update(JSON.stringify(data))
      .digest("hex");
  }

  /**
   * Sign the certificate with institution's private key
   */
  signCertificate(institutionPrivateKey) {
    if (!institutionPrivateKey) {
      throw new Error("Institution private key is required for signing");
    }

    // Verify the private key matches the institution's public key
    const keyPair = ec.keyFromPrivate(institutionPrivateKey);
    const publicKeyFromPrivate = keyPair.getPublic("hex");
    
    if (publicKeyFromPrivate !== this.institutionPublicKey) {
      throw new Error("Private key does not match institution's public key");
    }

    const certificateHash = this.calculateHash();
    const sig = keyPair.sign(certificateHash, "base64");
    this.signature = sig.toDER("hex");
  }

  /**
   * Verify the certificate signature
   */
  isValid() {
    if (!this.signature || this.signature.length === 0) {
      throw new Error("Certificate has no signature");
    }

    try {
      const publicKey = ec.keyFromPublic(this.institutionPublicKey, "hex");
      const certificateHash = this.calculateHash();
      return publicKey.verify(certificateHash, this.signature);
    } catch (error) {
      throw new Error("Invalid certificate signature: " + error.message);
    }
  }

  /**
   * Check if certificate is expired
   */
  isExpired() {
    if (!this.expirationDate) {
      return false; // No expiration date means it never expires
    }
    return new Date() > new Date(this.expirationDate);
  }

  /**
   * Get certificate status
   */
  getStatus() {
    if (this.isExpired()) {
      return "EXPIRED";
    }
    
    try {
      return this.isValid() ? "VALID" : "INVALID";
    } catch (error) {
      return "INVALID";
    }
  }

  /**
   * Convert certificate to transaction payload
   */
  toTransactionPayload() {
    return {
      type: "CERTIFICATE_ISSUANCE",
      certificate: {
        id: this.id,
        recipientName: this.recipientName,
        recipientId: this.recipientId,
        institutionName: this.institutionName,
        institutionPublicKey: this.institutionPublicKey,
        certificateType: this.certificateType,
        courseName: this.courseName,
        issueDate: this.issueDate,
        completionDate: this.completionDate,
        grade: this.grade,
        credentialLevel: this.credentialLevel,
        expirationDate: this.expirationDate,
        metadata: this.metadata,
        hash: this.hash,
        signature: this.signature
      }
    };
  }

  /**
   * Create certificate from transaction payload
   */
  static fromTransactionPayload(payload) {
    if (!payload.certificate) {
      throw new Error("Invalid certificate payload");
    }

    const cert = new Certificate(payload.certificate);
    cert.hash = payload.certificate.hash;
    cert.signature = payload.certificate.signature;
    return cert;
  }

  /**
   * Validate certificate data
   */
  validateData() {
    const errors = [];

    if (!this.recipientName || this.recipientName.trim().length < 2) {
      errors.push("Recipient name must be at least 2 characters long");
    }

    if (!this.recipientId || this.recipientId.trim().length < 1) {
      errors.push("Recipient ID is required");
    }

    if (!this.institutionName || this.institutionName.trim().length < 2) {
      errors.push("Institution name must be at least 2 characters long");
    }

    if (!this.institutionPublicKey || this.institutionPublicKey.length !== 130) {
      errors.push("Invalid institution public key format");
    }

    if (!this.certificateType || !["BACHELOR", "MASTER", "PHD", "DIPLOMA", "CERTIFICATION", "PROFESSIONAL"].includes(this.certificateType)) {
      errors.push("Invalid certificate type");
    }

    if (!this.courseName || this.courseName.trim().length < 2) {
      errors.push("Course name must be at least 2 characters long");
    }

    if (!this.credentialLevel || this.credentialLevel.trim().length < 2) {
      errors.push("Credential level is required");
    }

    if (this.completionDate && new Date(this.completionDate) > new Date()) {
      errors.push("Completion date cannot be in the future");
    }

    if (this.expirationDate && new Date(this.expirationDate) <= new Date()) {
      errors.push("Expiration date must be in the future");
    }

    return errors;
  }
}

module.exports = Certificate;
