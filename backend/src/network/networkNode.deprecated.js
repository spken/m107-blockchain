/**
 * DEPRECATED: General Purpose Blockchain Network Node
 *
 * This file implements a general purpose blockchain node with currency-like features
 * (balances, amounts, fees, faucet, etc.) which are not relevant for the educational
 * certificate blockchain system.
 *
 * This file has been moved to .deprecated.js and should not be used in production.
 * Use CertificateNode.js instead for the certificate management system.
 *
 * The certificate blockchain focuses on:
 * - Certificate issuance
 * - Certificate verification
 * - Certificate revocation
 * - Institution management
 * - Proof of Authority consensus
 *
 * It does NOT include currency features like balances, mining rewards, or transaction fees.
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const Blockchain = require("../core/Blockchain");
const Transaction = require("../core/Transaction");
const Wallet = require("../core/Wallet");
const Mempool = require("./Mempool");
const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");

const app = express();
const port = process.argv[2] || 3001;
const currentNodeUrl = process.argv[3] || `http://localhost:${port}`;

console.warn(
  "DEPRECATED: This node implementation is deprecated. Use CertificateNode.js instead.",
);

// Rest of the deprecated implementation...
// (Original networkNode.js code would go here but it's not needed for the certificate system)

module.exports = app;
