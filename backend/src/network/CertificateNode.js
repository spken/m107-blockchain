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

// Auto-processing configuration for certificate transactions
let autoProcessingEnabled = true;
let autoProcessingInterval = null;
const PROCESSING_INTERVAL_MS = 15000; // 15 seconds

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

// Wallet storage (In production, this would be a database)
const walletStorage = new Map();

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
    
    // Start auto-processing for this node
    setTimeout(() => {
      startAutoProcessing();
    }, 2000); // Wait 2 seconds after initialization
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
      recipientWalletAddress,
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

    if (!recipientWalletAddress) {
      return res.status(400).json({ error: "Recipient wallet address is required" });
    }

    // Create certificate with issuer as the institution and recipient ID as the wallet address
    const certificate = new Certificate({
      recipientName,
      recipientId: recipientWalletAddress, // Use wallet address as the recipient ID
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

    // Store the recipient wallet address in certificate metadata
    if (!certificate.metadata) {
      certificate.metadata = {};
    }
    certificate.metadata.recipientWalletAddress = recipientWalletAddress;

    // Issue certificate (creates and signs transaction)
    const transaction = certificateBlockchain.issueCertificate(
      certificate, 
      nodeInstitution.privateKey,
      recipientWalletAddress
    );

    // Add transaction to mempool for immediate availability
    mempool.addTransaction(transaction);

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
    message: "Certificate transaction created and broadcast to mempool",
    certificate: certificate,
    transaction: transaction.getSummary(),
    note: "Transaction is pending. Use the block processing interface to process certificate transactions."
  });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get certificate by ID
 */
app.get("/certificates/:id", (req, res) => {
  try {
    const certificate = certificateBlockchain.getCertificateById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.json(certificate);
  } catch (error) {
    Logger.log(`Error fetching certificate ${req.params.id}: ${error.message}`);
    res.status(500).json({ error: "Failed to retrieve certificate" });
  }
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
  try {
    const query = req.query.q;
    const institutionKey = req.query.institution;
    const recipientId = req.query.recipient;

    let certificates = [];

    if (query || institutionKey || recipientId) {
      // Use search criteria
      const searchCriteria = {};
      if (query) searchCriteria.recipientName = query;
      if (institutionKey) searchCriteria.institutionPublicKey = institutionKey;
      if (recipientId) searchCriteria.recipientId = recipientId;
      
      certificates = certificateBlockchain.searchCertificates(searchCriteria);
    } else {
      // Get all certificates
      certificates = certificateBlockchain.getAllCertificates() || [];
    }

    res.json(certificates);
  } catch (error) {
    Logger.log(`Error searching certificates: ${error.message}`);
    res.status(500).json({ error: "Failed to search certificates" });
  }
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
      note: "Certificate block processed successfully and broadcast to network",
      block: newBlock,
      institution: nodeInstitution.name,
      certificatesProcessed: newBlock.transactions.length
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

// ==================== AUTO-PROCESSING ENDPOINTS ====================

/**
 * Get auto-processing status
 */
app.get("/auto-mining/status", (req, res) => {
  res.json({
    enabled: autoProcessingEnabled,
    interval: PROCESSING_INTERVAL_MS,
    active: autoProcessingInterval !== null,
    pendingTransactions: certificateBlockchain.getPendingTransactions().length
  });
});

/**
 * Enable auto-processing
 */
app.post("/auto-mining/enable", (req, res) => {
  autoProcessingEnabled = true;
  startAutoProcessing();
  res.json({
    message: "Auto-processing enabled",
    interval: PROCESSING_INTERVAL_MS
  });
});

/**
 * Disable auto-processing
 */
app.post("/auto-mining/disable", (req, res) => {
  autoProcessingEnabled = false;
  stopAutoProcessing();
  res.json({
    message: "Auto-processing disabled"
  });
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
      
      // Rebuild wallet data to ensure consistency
      certificateBlockchain.rebuildWalletData();
      
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

// ==================== WALLET ENDPOINTS ====================

// Create a new wallet
app.post("/wallets", (req, res) => {
  try {
    const { label } = req.body;
    const wallet = new Wallet();
    
    const walletResponse = {
      id: uuidv4(),
      label: label || "Unnamed Wallet",
      publicKey: wallet.getPublicKey(),
      privateKey: wallet.getPrivateKey(),
      certificateCount: 0,
      type: "INDIVIDUAL",
      created: new Date().toISOString()
    };
    
    // Store wallet in memory (in production, use database)
    walletStorage.set(walletResponse.publicKey, walletResponse);
    
    Logger.log(`Created new wallet: ${walletResponse.id} (${walletResponse.label})`);
    
    res.json({
      success: true,
      wallet: walletResponse,
      message: "Wallet created successfully"
    });
  } catch (error) {
    Logger.log(`Error creating wallet: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get all wallets with their balances and certificate counts
app.get("/wallets", (req, res) => {
  try {
    const allWallets = [];
    
    // Add institution wallet if available
    if (nodeInstitution) {
      allWallets.push({
        id: "institution-wallet",
        label: `${nodeInstitution.name} Wallet`,
        publicKey: nodeInstitution.publicKey,
        certificateCount: 0,
        type: "INSTITUTION",
        created: new Date().toISOString()
      });
    }
    
    // Add all created user wallets from storage
    for (const [publicKey, wallet] of walletStorage.entries()) {
      allWallets.push(wallet);
    }
    
    // If no user wallets exist, add some demo wallets for testing
    if (walletStorage.size === 0) {
      const demoWallets = [
        {
          id: "demo-wallet-1",
          label: "Demo Student Wallet",
          publicKey: "04a1b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890ab1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          certificateCount: 0,
          type: "INDIVIDUAL",
          created: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: "demo-wallet-2", 
          label: "Demo Graduate Wallet",
          publicKey: "04b2c3d4e5f6789abcdef1234567890abcdef1234567890abcdef1234567890abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1",
          certificateCount: 0,
          type: "INDIVIDUAL",
          created: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      
      // Store demo wallets
      demoWallets.forEach(wallet => {
        walletStorage.set(wallet.publicKey, wallet);
        allWallets.push(wallet);
      });
    }
    
    // Add certificate counts for each wallet safely
    try {
      const allCertificates = certificateBlockchain.getAllCertificates() || [];
      allWallets.forEach(wallet => {
        wallet.certificateCount = allCertificates.filter(cert => {
          if (!cert) return false;
          
          // Count certificates issued by this wallet (institution)
          if (cert.institutionPublicKey === wallet.publicKey) {
            return true;
          }
          
          // Count certificates assigned to this wallet address  
          if (cert.metadata && cert.metadata.recipientWalletAddress === wallet.publicKey) {
            return true;
          }
          
          // Also check recipientId field for backward compatibility
          if (cert.recipientId === wallet.publicKey) {
            return true;
          }
          
          return false;
        }).length;
      });
    } catch (certError) {
      Logger.log(`Warning: Could not load certificates for wallet counts: ${certError.message}`);
      // Continue with 0 certificate counts
    }
    
    res.json({
      success: true,
      wallets: allWallets
    });
  } catch (error) {
    Logger.log(`Error fetching wallets: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get wallet by public key
app.get("/wallets/:publicKey", (req, res) => {
  try {
    const { publicKey } = req.params;
    
    // Check if wallet exists in storage or institution registry
    let walletInfo = walletStorage.get(publicKey);
    
    // Check if it's an institution wallet
    if (!walletInfo && nodeInstitution && nodeInstitution.publicKey === publicKey) {
      walletInfo = {
        id: "institution-wallet",
        label: `${nodeInstitution.name} Wallet`,
        publicKey: nodeInstitution.publicKey,
        type: "INSTITUTION",
        created: new Date().toISOString()
      };
    }
    
    // If wallet not found, create a basic info object
    if (!walletInfo) {
      walletInfo = {
        id: `unknown-${publicKey.slice(0, 8)}`,
        label: "Unknown Wallet",
        publicKey: publicKey,
        type: "INDIVIDUAL",
        created: new Date().toISOString()
      };
    }
    
    // Get certificates for this wallet safely using blockchain methods
    let walletCertificates = [];
    let walletStats = { totalCertificates: 0, issuedCertificates: 0, receivedCertificates: 0 };
    
    try {
      // Use blockchain methods for better performance and accuracy
      if (typeof certificateBlockchain.getWalletCertificates === 'function') {
        walletCertificates = certificateBlockchain.getWalletCertificates(publicKey);
      }
      if (typeof certificateBlockchain.getWalletStats === 'function') {
        walletStats = certificateBlockchain.getWalletStats(publicKey);
      }
    } catch (certError) {
      Logger.log(`Warning: Could not load certificates for wallet ${publicKey}: ${certError.message}`);
      // Fallback to manual search if blockchain methods fail
      try {
        const allCertificates = certificateBlockchain.getAllCertificates() || [];
        walletCertificates = allCertificates.filter(cert => {
          if (!cert) return false;
          
          // Include certificates issued by this wallet (institution)
          if (cert.institutionPublicKey === publicKey) {
            return true;
          }
          
          // Include certificates assigned to this wallet address
          if (cert.metadata && cert.metadata.recipientWalletAddress === publicKey) {
            return true;
          }
          
          // Also check recipientId field for backward compatibility
          if (cert.recipientId === publicKey) {
            return true;
          }
          
          return false;
        });
        walletStats.totalCertificates = walletCertificates.length;
      } catch (fallbackError) {
        Logger.log(`Warning: Fallback certificate loading also failed for wallet ${publicKey}: ${fallbackError.message}`);
      }
    }
    
    // Get transactions for this wallet
    const allTransactions = [];
    try {
      certificateBlockchain.chain.forEach(block => {
        if (block.transactions) {
          block.transactions.forEach(tx => {
            if (tx && (tx.fromAddress === publicKey || tx.toAddress === publicKey)) {
              allTransactions.push({
                ...tx,
                blockHash: block.hash,
                blockIndex: block.index,
                timestamp: block.timestamp
              });
            }
          });
        }
      });
    } catch (txError) {
      Logger.log(`Warning: Could not load transactions for wallet ${publicKey}: ${txError.message}`);
    }
    
    const walletResponse = {
      ...walletInfo,
      ...walletStats,
      certificates: walletCertificates,
      transactions: allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      isInstitution: publicKey === (nodeInstitution ? nodeInstitution.publicKey : null)
    };
    
    res.json({
      success: true,
      wallet: walletResponse
    });
  } catch (error) {
    Logger.log(`Error fetching wallet ${req.params.publicKey}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get certificates owned by a wallet
app.get("/wallets/:publicKey/certificates", (req, res) => {
  try {
    const { publicKey } = req.params;
    
    let walletCertificates = [];
    try {
      // Use blockchain method for better performance and accuracy
      walletCertificates = certificateBlockchain.getWalletCertificates(publicKey);
    } catch (certError) {
      Logger.log(`Warning: Could not load certificates for wallet ${publicKey}: ${certError.message}`);
      // Fallback to manual search if blockchain method fails
      const allCertificates = certificateBlockchain.getAllCertificates() || [];
      walletCertificates = allCertificates.filter(cert => {
        if (!cert) return false;
        
        // Include certificates issued by this wallet (institution)
        if (cert.institutionPublicKey === publicKey) {
          return true;
        }
        
        // Include certificates assigned to this wallet address
        if (cert.metadata && cert.metadata.recipientWalletAddress === publicKey) {
          return true;
        }
        
        return false;
      });
    }
    
    res.json({
      success: true,
      certificates: walletCertificates,
      count: walletCertificates.length
    });
  } catch (error) {
    Logger.log(`Error fetching certificates for wallet ${req.params.publicKey}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction history for a wallet
app.get("/wallets/:publicKey/transactions", (req, res) => {
  try {
    const { publicKey } = req.params;
    const transactions = [];
    
    // Get all transactions involving this wallet
    certificateBlockchain.chain.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.fromAddress === publicKey || tx.toAddress === publicKey) {
          transactions.push({
            ...tx,
            blockHash: block.hash,
            blockIndex: block.index,
            blockTimestamp: block.timestamp,
            type: tx.fromAddress === publicKey ? 'SENT' : 'RECEIVED'
          });
        }
      });
    });
    
    // Also include pending transactions
    const pendingTransactions = mempool.getAllTransactions()
      .filter(tx => tx.fromAddress === publicKey || tx.toAddress === publicKey)
      .map(tx => ({
        ...tx,
        status: 'PENDING',
        type: tx.fromAddress === publicKey ? 'SENT' : 'RECEIVED'
      }));
    
    const allTransactions = [...transactions, ...pendingTransactions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      transactions: allTransactions
    });
  } catch (error) {
    Logger.log(`Error fetching transactions for wallet ${req.params.publicKey}: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== SERVER STARTUP ====================

Logger.log("Certificate Blockchain Node starting...");
app.listen(port, () => {
  Logger.log(`Certificate Blockchain Node running on port ${port}`);
  Logger.log(`Node URL: ${currentNodeUrl}`);
  if (nodeInstitution) {
    Logger.log(`Institution: ${nodeInstitution.name} (${nodeInstitution.type})`);
  }
});

// Auto-processing function for certificate transactions
const performAutoProcessing = async () => {
  try {
    // Only process if there are pending transactions and node is configured
    if (!nodeInstitution || certificateBlockchain.getPendingTransactions().length === 0) {
      return;
    }

    Logger.log(`Auto-processing: Found ${certificateBlockchain.getPendingTransactions().length} pending certificate transactions`);
    
    const newBlock = certificateBlockchain.minePendingTransactions(nodeInstitution.publicKey);
    Logger.log(`Auto-processing: Certificate block processed successfully - ${newBlock.hash}`);

    // Broadcast new block to network
    const requestPromises = certificateBlockchain.networkNodes.map((networkNodeUrl) => {
      return rp({
        uri: networkNodeUrl + "/receive-new-block",
        method: "POST",
        body: { newBlock },
        json: true,
        timeout: 5000
      }).catch(err => Logger.log(`Auto-processing: Failed to broadcast block to ${networkNodeUrl}:`, err.message));
    });

    await Promise.all(requestPromises);
    Logger.log(`Auto-processing: Block broadcast completed`);
    
  } catch (error) {
    Logger.log(`Auto-processing error: ${error.message}`);
  }
};

// Start auto-processing when node is ready
const startAutoProcessing = () => {
  if (autoProcessingInterval) {
    clearInterval(autoProcessingInterval);
  }
  
  if (autoProcessingEnabled && nodeInstitution) {
    Logger.log(`Auto-processing started: Processing every ${PROCESSING_INTERVAL_MS/1000} seconds`);
    autoProcessingInterval = setInterval(performAutoProcessing, PROCESSING_INTERVAL_MS);
  }
};

// Stop auto-processing
const stopAutoProcessing = () => {
  if (autoProcessingInterval) {
    clearInterval(autoProcessingInterval);
    autoProcessingInterval = null;
    Logger.log("Auto-processing stopped");
  }
};

module.exports = app;
