const crypto = require("crypto");
const Logger = require("../utils/Logger");

class Block {
  constructor(index, timestamp, transactions, previousHash = "") {
    this.index = index;
    this.timestamp = new Date(timestamp).toISOString();
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.transactions) +
          this.nonce,
      )
      .digest("hex");
  }

  mineBlock(difficulty) {
    if (difficulty < 1 || difficulty > 6) {
      throw new Error("Mining difficulty must be between 1 and 6.");
    }

    const target = Array(difficulty + 1).join("0");

    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    Logger.info(`Block mined: ${this.hash}`);
  }

  isValid() {
    if (this.hash !== this.calculateHash()) {
      return false;
    }

    for (const tx of this.transactions) {
      if (typeof tx.isValid === "function" && !tx.isValid()) {
        return false;
      }
    }

    return true;
  }
}

module.exports = Block;
