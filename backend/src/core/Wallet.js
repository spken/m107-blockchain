const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
const Logger = require("../utils/Logger");

class Wallet {
  constructor() {
    this.keyPair = ec.genKeyPair();
    this.publicKey = this.keyPair.getPublic("hex");
    this.privateKey = this.keyPair.getPrivate("hex");
  }

  // KORREKT!
  static fromPrivateKey(privateKey) {
    const wallet = new Wallet();
    wallet.keyPair = ec.keyFromPrivate(privateKey);
    wallet.publicKey = wallet.keyPair.getPublic("hex"); // WICHTIG!
    wallet.privateKey = privateKey;
    return wallet;
  }

  getPublicKey() {
    return this.publicKey;
  }

  getPrivateKey() {
    return this.privateKey;
  }

  signTransaction(transaction) {
    Logger.log(
      "DEBUG wallet: transaction.fromAddress:",
      transaction.fromAddress,
    );
    Logger.log("DEBUG wallet: this.publicKey:", this.publicKey);
    Logger.log(
      "DEBUG wallet: Gleich?",
      transaction.fromAddress === this.publicKey,
    );
    if (transaction.fromAddress !== this.publicKey) {
      throw new Error("You cannot sign transactions for other wallets!");
    }
    transaction.signTransaction(this.keyPair);
  }
}

module.exports = Wallet;
