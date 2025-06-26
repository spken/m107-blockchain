const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const CertificateBlockchain = require("../core/CertificateBlockchain");
const CertificateTransaction = require("../core/CertificateTransaction");
const Certificate = require("../core/Certificate");
const { Institution } = require("../core/Institution");
const Wallet = require("../core/Wallet");
const Mempool = require("./Mempool");
const { v4: uuidv4 } = require("uuid");
const rp = require("request-promise");
const EC = require("elliptic").ec;
const Logger = require("../utils/Logger");
const ec = new EC("secp256k1");

const app = express();
const port = process.argv[2] || 3001;
const currentNodeUrl = process.argv[3] || `http://localhost:${port}`;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

// Initialize blockchain and components
const certificateBlockchain = new CertificateBlockchain();
const mempool = new Mempool();
const nodeAddress = uuidv4().split("-").join("");

certificateBlockchain.currentNodeUrl = currentNodeUrl;
certificateBlockchain.networkNodes = [];

// Node institution configuration (would be loaded from config in production)
let nodeInstitution = null;

// Initialize default institutions for the 3-node network
const initializeDefaultInstitutions = () => {
  const institutions = [
    {
      name: "University of Technology",
      type: "UNIVERSITY",
      port: 3001,
      // Generate a consistent key pair for demo purposes
      privateKey: "a1b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890ab"
    },
    {
      name: "Professional Vocational School", 
      type: "VOCATIONAL_SCHOOL",
      port: 3002,
      privateKey: "b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890abc1"
    },
    {
      name: "Global Certification Provider",
      type: "CERTIFICATION_PROVIDER", 
      port: 3003,
      privateKey: "c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890abc12"
    }
  ];

  // Find and configure this node's institution
  const institutionConfig = institutions.find(inst => inst.port === parseInt(port));
  
  if (institutionConfig) {
    const keyPair = ec.keyFromPrivate(institutionConfig.privateKey);
    const publicKey = keyPair.getPublic("hex");
    
    nodeInstitution = Institution.createFromPrivateKey(
      institutionConfig.name,
      institutionConfig.type,
      institutionConfig.privateKey
    );
    
    // Register institution in blockchain
    certificateBlockchain.institutionRegistry.registerInstitution(nodeInstitution);
    certificateBlockchain.addAuthorizedValidator(publicKey);
    
    Logger.info(`Node initialized as: ${nodeInstitution.name} (${nodeInstitution.type})`);
    Logger.info(`Public Key: ${publicKey}`);
  }
};

// Initialize institutions
initializeDefaultInstitutions();

// ==================== NETWORK MANAGEMENT ====================

/**
 * Register and broadcast node to the network
 */
app.post("/register-and-broadcast-node", async (req, res) => {
  try {
    const newNodeUrl = req.body.newNodeUrl;
    
    if (!certificateBlockchain.networkNodes.includes(newNodeUrl)) {
      certificateBlockchain.networkNodes.push(newNodeUrl);
    }

    const regNodesPromises = certificateBlockchain.networkNodes.map((networkNodeUrl) => {
      return rp({
        uri: networkNodeUrl + "/register-node",
        method: "POST",
        body: { newNodeUrl },
        json: true,
        timeout: 5000
      }).catch(err => Logger.warn(`Failed to register with ${networkNodeUrl}:`, err.message));
    });

    await Promise.all(regNodesPromises);

    await rp({
      uri: newNodeUrl + "/register-nodes-bulk",
      method: "POST",
      body: {
        allNetworkNodes: [...certificateBlockchain.networkNodes, certificateBlockchain.currentNodeUrl]
      },
      json: true,
      timeout: 5000
    });

    res.json({ 
      note: "Node successfully registered in certificate blockchain network",
      institution: nodeInstitution ? nodeInstitution.getInfo() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register single node
 */
app.post("/register-node", (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  
  if (!certificateBlockchain.networkNodes.includes(newNodeUrl) && 
      certificateBlockchain.currentNodeUrl !== newNodeUrl) {
    certificateBlockchain.networkNodes.push(newNodeUrl);
  }
  
  res.json({ 
    note: "Node registered successfully",
    institution: nodeInstitution ? nodeInstitution.getInfo() : null
  });
});

/**
 * Register multiple nodes
 */
app.post("/register-nodes-bulk", (req, res) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  
  allNetworkNodes.forEach((networkNodeUrl) => {
    if (!certificateBlockchain.networkNodes.includes(networkNodeUrl) && 
        certificateBlockchain.currentNodeUrl !== networkNodeUrl) {
      certificateBlockchain.networkNodes.push(networkNodeUrl);
    }
  });
  
  res.json({ note: "Bulk node registration successful" });
});

// ==================== BLOCKCHAIN ENDPOINTS ====================

/**
 * Get entire blockchain
 */
app.get("/blockchain", (req, res) => {
  res.json(certificateBlockchain);
});

/**
 * Get all blocks
 */
app.get("/blocks", (req, res) => {
  res.json(certificateBlockchain.getAllBlocks());
});

/**
 * Get block by hash
 */
app.get("/blocks/:hash", (req, res) => {
  const block = certificateBlockchain.getBlockByHash(req.params.hash);
  if (block) {
    res.json(block);
  } else {
    res.status(404).json({ error: "Block not found" });
  }
});

/**
 * Get blockchain statistics
 */
app.get("/statistics", (req, res) => {
  res.json(certificateBlockchain.getStatistics());
});

/**
 * Validate blockchain
 */
app.get("/validate", (req, res) => {
  try {
    const valid = certificateBlockchain.isChainValid();
    res.json({ valid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== CERTIFICATE ENDPOINTS ====================

/**
 * Issue a new certificate
 */
app.post("/certificates", async (req, res) => {
  try {
    const {
      recipientName,
      recipientId,
      certificateType,
      courseName,
      completionDate,
      grade,
      credentialLevel,
      expirationDate,
      metadata
    } = req.body;

    if (!nodeInstitution) {
      return res.status(400).json({ error: "Node is not configured as an authorized institution" });
    }

    // Create certificate
    const certificate = new Certificate({
      recipientName,
      recipientId,
      institutionName: nodeInstitution.name,
      institutionPublicKey: nodeInstitution.publicKey,
      certificateType,
      courseName,
      completionDate,
      grade,
      credentialLevel,
      expirationDate,
      metadata
    });

    // Validate certificate data
    const validationErrors = certificate.validateData();
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: "Certificate validation failed", 
        details: validationErrors 
      });
    }

    // Issue certificate (creates and signs transaction)
    const transaction = certificateBlockchain.issueCertificate(
      certificate, 
      nodeInstitution.privateKey
    );

    // Broadcast transaction to network
    const broadcastPromises = certificateBlockchain.networkNodes.map((networkNodeUrl) => {
      return rp({
        uri: networkNodeUrl + "/transactions",
        method: "POST",
        body: transaction,
        json: true,
        timeout: 5000
      }).catch(err => Logger.log(`Failed to broadcast to ${networkNodeUrl}:`, err.message));
    });

    await Promise.all(broadcastPromises);

    res.json({
      message: "Certificate issued successfully",
      certificate: certificate,
      transaction: transaction.getSummary()
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get certificate by ID
 */
app.get("/certificates/:id", (req, res) => {
  const certificate = certificateBlockchain.getCertificate(req.params.id);
  
  if (!certificate) {
    return res.status(404).json({ error: "Certificate not found" });
  }

  res.json(certificate);
});

/**
 * Verify certificate
 */
app.post("/certificates/:id/verify", async (req, res) => {
  try {
    const certificateId = req.params.id;
    const verificationResult = certificateBlockchain.verifyCertificate(certificateId);

    // Create verification transaction if we have an institution
    if (nodeInstitution && verificationResult.certificate) {
      const verificationTx = CertificateTransaction.createCertificateVerification(
        nodeInstitution.publicKey,
        certificateId,
        verificationResult
      );

      const keyPair = ec.keyFromPrivate(nodeInstitution.privateKey);
      verificationTx.signTransaction(keyPair);
      
      certificateBlockchain.addTransaction(verificationTx);

      // Broadcast verification
      const broadcastPromises = certificateBlockchain.networkNodes.map((networkNodeUrl) => {
        return rp({
          uri: networkNodeUrl + "/transactions",
          method: "POST",
          body: verificationTx,
          json: true,
          timeout: 5000
        }).catch(err => Logger.log(`Failed to broadcast verification to ${networkNodeUrl}:`, err.message));
      });

      await Promise.all(broadcastPromises);
    }

    res.json(verificationResult);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Search certificates
 */
app.get("/certificates", (req, res) => {
  const query = req.query.q;
  const institutionKey = req.query.institution;
  const recipientId = req.query.recipient;

  let certificates;

  if (query) {
    certificates = certificateBlockchain.searchCertificates(query);
  } else if (institutionKey) {
    certificates = certificateBlockchain.getCertificatesByInstitution(institutionKey);
  } else if (recipientId) {
    certificates = certificateBlockchain.getCertificatesByRecipient(recipientId);
  } else {
    certificates = Array.from(certificateBlockchain.certificates.values());
  }

  res.json(certificates);
});

/**
 * Revoke certificate
 */
app.post("/certificates/:id/revoke", async (req, res) => {
  try {
    const certificateId = req.params.id;
    const { reason } = req.body;

    if (!nodeInstitution) {
      return res.status(400).json({ error: "Node is not configured as an authorized institution" });
    }

    if (!reason) {
      return res.status(400).json({ error: "Revocation reason is required" });
    }

    // Create revocation transaction
    const revocationTx = CertificateTransaction.createCertificateRevocation(
      nodeInstitution.publicKey,
      certificateId,
      reason
    );

    const keyPair = ec.keyFromPrivate(nodeInstitution.privateKey);
    revocationTx.signTransaction(keyPair);
    
    certificateBlockchain.addTransaction(revocationTx);

    // Broadcast revocation
    const broadcastPromises = certificateBlockchain.networkNodes.map((networkNodeUrl) => {
      return rp({
        uri: networkNodeUrl + "/transactions",
        method: "POST",
        body: revocationTx,
        json: true,
        timeout: 5000
      }).catch(err => Logger.log(`Failed to broadcast revocation to ${networkNodeUrl}:`, err.message));
    });

    await Promise.all(broadcastPromises);

    res.json({
      message: "Certificate revoked successfully",
      transaction: revocationTx.getSummary()
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== TRANSACTION ENDPOINTS ====================

/**
 * Receive transaction from other nodes
 */
app.post("/transactions", (req, res) => {
  try {
    const transactionData = req.body;
    
    // Convert to CertificateTransaction
    const transaction = new CertificateTransaction(transactionData);
    transaction.signature = transactionData.signature;

    if (!transaction.isValid()) {
      throw new Error("Invalid transaction signature");
    }

    certificateBlockchain.addTransaction(transaction);
    
    res.json({ 
      message: "Transaction received successfully",
      transaction: transaction.getSummary()
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get pending transactions
 */
app.get("/transactions/pending", (req, res) => {
  res.json(certificateBlockchain.getPendingTransactions());
});

// ==================== MINING ENDPOINTS ====================

/**
 * Mine pending transactions
 */
app.post("/mine", async (req, res) => {
  try {
    if (!nodeInstitution) {
      return res.status(400).json({ error: "Node is not configured as an authorized institution" });
    }

    const newBlock = certificateBlockchain.minePendingTransactions(nodeInstitution.publicKey);

    // Broadcast new block to network
    const requestPromises = certificateBlockchain.networkNodes.map((networkNodeUrl) => {
      return rp({
        uri: networkNodeUrl + "/receive-new-block",
        method: "POST",
        body: { newBlock },
        json: true,
        timeout: 5000
      }).catch(err => Logger.log(`Failed to broadcast block to ${networkNodeUrl}:`, err.message));
    });

    await Promise.all(requestPromises);

    res.json({
      note: "Block mined successfully and broadcast to network",
      block: newBlock,
      institution: nodeInstitution.name
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Receive new block from other nodes
 */
app.post("/receive-new-block", (req, res) => {
  try {
    const newBlock = req.body.newBlock;
    const lastBlock = certificateBlockchain.getLatestBlock();

    const correctHash = lastBlock.hash === newBlock.previousHash;
    const correctIndex = (lastBlock.index || certificateBlockchain.chain.length - 1) + 1 === (newBlock.index || certificateBlockchain.chain.length);

    if (correctHash) {
      certificateBlockchain.chain.push(newBlock);
      certificateBlockchain.pendingTransactions = [];
      
      // Rebuild certificate registry to include new transactions
      certificateBlockchain.rebuildCertificateRegistry();
      
      res.json({
        note: "New block accepted and added to chain",
        block: newBlock
      });
    } else {
      res.status(400).json({ 
        note: "Block rejected - hash chain broken",
        block: newBlock 
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ==================== INSTITUTION ENDPOINTS ====================

/**
 * Get all institutions
 */
app.get("/institutions", (req, res) => {
  res.json(certificateBlockchain.institutionRegistry.getAllInstitutions());
});

/**
 * Get current node's institution info
 */
app.get("/institution", (req, res) => {
  if (nodeInstitution) {
    res.json(nodeInstitution.getInfo());
  } else {
    res.status(404).json({ error: "Node is not configured as an institution" });
  }
});

// ==================== CONSENSUS ENDPOINTS ====================

/**
 * Run consensus algorithm
 */
app.get("/consensus", async (req, res) => {
  try {
    const requestPromises = certificateBlockchain.networkNodes.map((networkNodeUrl) => {
      return rp({
        uri: networkNodeUrl + "/blockchain",
        method: "GET",
        json: true,
        timeout: 5000
      });
    });

    const blockchains = await Promise.all(requestPromises);

    let maxLength = certificateBlockchain.chain.length;
    let newLongestChain = null;

    blockchains.forEach((remoteBlockchain) => {
      if (remoteBlockchain.chain && 
          remoteBlockchain.chain.length > maxLength && 
          isValidChain(remoteBlockchain.chain)) {
        maxLength = remoteBlockchain.chain.length;
        newLongestChain = remoteBlockchain.chain;
      }
    });

    if (newLongestChain) {
      certificateBlockchain.chain = newLongestChain;
      certificateBlockchain.pendingTransactions = [];
      
      // Rebuild certificate registry from new chain
      certificateBlockchain.rebuildCertificateRegistry();
      
      res.json({
        note: "Blockchain replaced by consensus mechanism",
        chain: certificateBlockchain.chain
      });
    } else {
      res.json({
        note: "Current blockchain was already the longest valid chain",
        chain: certificateBlockchain.chain
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== UTILITY ENDPOINTS ====================

/**
 * Get network status
 */
app.get("/network", (req, res) => {
  res.json({
    currentNodeUrl: certificateBlockchain.currentNodeUrl,
    networkNodes: certificateBlockchain.networkNodes,
    institution: nodeInstitution ? nodeInstitution.getInfo() : null,
    nodeId: nodeAddress
  });
});

/**
 * Initialize complete network (for development)
 */
app.post("/initialize-network", async (req, res) => {
  try {
    const nodeUrls = [
      "http://localhost:3001",
      "http://localhost:3002", 
      "http://localhost:3003"
    ];

    // Register all nodes with each other
    for (let nodeUrl of nodeUrls) {
      if (nodeUrl !== certificateBlockchain.currentNodeUrl) {
        await rp({
          uri: nodeUrl + "/register-nodes-bulk",
          method: "POST",
          body: {
            allNetworkNodes: nodeUrls.filter(url => url !== nodeUrl)
          },
          json: true,
          timeout: 5000
        }).catch(err => Logger.log(`Failed to initialize ${nodeUrl}:`, err.message));
      }
    }

    // Update local network nodes
    certificateBlockchain.networkNodes = nodeUrls.filter(url => url !== certificateBlockchain.currentNodeUrl);

    res.json({
      note: "Certificate blockchain network initialized successfully",
      nodeUrls,
      institution: nodeInstitution ? nodeInstitution.getInfo() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate blockchain chain
 */
function isValidChain(chain) {
  try {
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const prevBlock = chain[i - 1];
      
      if (currentBlock.previousHash !== prevBlock.hash) {
        return false;
      }
    }
    return true;
  } catch (error) {
    return false;
  }
}

// ==================== SERVER STARTUP ====================

Logger.log("Certificate Blockchain Node starting...");
app.listen(port, () => {
  Logger.log(`Certificate Blockchain Node running on port ${port}`);
  Logger.log(`Node URL: ${currentNodeUrl}`);
  if (nodeInstitution) {
    Logger.log(`Institution: ${nodeInstitution.name} (${nodeInstitution.type})`);
  }
});

module.exports = app;
