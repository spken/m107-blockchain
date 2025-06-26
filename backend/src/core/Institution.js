const EC = require("elliptic").ec;
const crypto = require("crypto");
const ec = new EC("secp256k1");

/**
 * Institution class representing educational institutions in the network
 * Each institution can issue and verify certificates
 */
class Institution {
  constructor(name, type, publicKey, authorized = false) {
    this.name = name;
    this.type = type; // UNIVERSITY, VOCATIONAL_SCHOOL, CERTIFICATION_PROVIDER
    this.publicKey = publicKey;
    this.authorized = authorized; // Whether this institution is authorized to issue certificates
    this.registrationDate = new Date().toISOString();
    this.certificatesIssued = 0;
    this.lastActivity = new Date().toISOString();
  }

  /**
   * Create an institution from a private key
   */
  static createFromPrivateKey(name, type, privateKey) {
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic("hex");
    const institution = new Institution(name, type, publicKey, true);
    institution.privateKey = privateKey; // Store the private key
    return institution;
  }

  /**
   * Generate a new institution with a random key pair
   */
  static generateNew(name, type) {
    const keyPair = ec.genKeyPair();
    const publicKey = keyPair.getPublic("hex");
    const privateKey = keyPair.getPrivate("hex");
    
    const institution = new Institution(name, type, publicKey, true);
    institution.privateKey = privateKey; // Store for initial setup only
    return institution;
  }

  /**
   * Verify if institution is authorized to issue certificates
   */
  canIssueCertificates() {
    return this.authorized;
  }

  /**
   * Update institution activity
   */
  updateActivity() {
    this.lastActivity = new Date().toISOString();
  }

  /**
   * Increment certificates issued counter
   */
  incrementCertificatesIssued() {
    this.certificatesIssued++;
    this.updateActivity();
  }

  /**
   * Get institution info for display
   */
  getInfo() {
    return {
      name: this.name,
      type: this.type,
      publicKey: this.publicKey,
      authorized: this.authorized,
      registrationDate: this.registrationDate,
      certificatesIssued: this.certificatesIssued,
      lastActivity: this.lastActivity
    };
  }

  /**
   * Validate institution data
   */
  isValid() {
    return (
      this.name &&
      this.name.length > 0 &&
      this.type &&
      ["UNIVERSITY", "VOCATIONAL_SCHOOL", "CERTIFICATION_PROVIDER"].includes(this.type) &&
      this.publicKey &&
      this.publicKey.length === 130
    );
  }
}

/**
 * Registry for managing authorized institutions
 */
class InstitutionRegistry {
  constructor() {
    this.institutions = new Map();
    this.initializeDefaultInstitutions();
  }

  /**
   * Initialize default institutions for the 3-node network
   */
  initializeDefaultInstitutions() {
    // These would be the predefined authorized institutions
    const defaultInstitutions = [
      {
        name: "University of Technology",
        type: "UNIVERSITY",
        // This would be a real public key in production
        publicKey: "049c9...example..." // Placeholder
      },
      {
        name: "Professional Vocational School",
        type: "VOCATIONAL_SCHOOL",
        publicKey: "04abc...example..." // Placeholder
      },
      {
        name: "Global Certification Provider",
        type: "CERTIFICATION_PROVIDER",
        publicKey: "04def...example..." // Placeholder
      }
    ];

    // In a real implementation, these would be loaded from configuration
    // For now, we'll add them when institutions register themselves
  }

  /**
   * Register a new institution
   */
  registerInstitution(institution) {
    if (!institution.isValid()) {
      throw new Error("Invalid institution data");
    }

    this.institutions.set(institution.publicKey, institution);
    return true;
  }

  /**
   * Get institution by public key
   */
  getInstitution(publicKey) {
    return this.institutions.get(publicKey);
  }

  /**
   * Check if institution is authorized
   */
  isAuthorized(publicKey) {
    const institution = this.institutions.get(publicKey);
    return institution && institution.authorized;
  }

  /**
   * Get all institutions
   */
  getAllInstitutions() {
    return Array.from(this.institutions.values()).map(inst => inst.getInfo());
  }

  /**
   * Authorize an institution (admin function)
   */
  authorizeInstitution(publicKey) {
    const institution = this.institutions.get(publicKey);
    if (institution) {
      institution.authorized = true;
      return true;
    }
    return false;
  }

  /**
   * Revoke institution authorization
   */
  revokeAuthorization(publicKey) {
    const institution = this.institutions.get(publicKey);
    if (institution) {
      institution.authorized = false;
      return true;
    }
    return false;
  }

  /**
   * Get institutions by type
   */
  getInstitutionsByType(type) {
    return Array.from(this.institutions.values())
      .filter(inst => inst.type === type)
      .map(inst => inst.getInfo());
  }

  /**
   * Update institution activity
   */
  updateInstitutionActivity(publicKey) {
    const institution = this.institutions.get(publicKey);
    if (institution) {
      institution.updateActivity();
    }
  }

  /**
   * Increment certificates issued for institution
   */
  incrementCertificatesIssued(publicKey) {
    const institution = this.institutions.get(publicKey);
    if (institution) {
      institution.incrementCertificatesIssued();
    }
  }
}

module.exports = { Institution, InstitutionRegistry };
