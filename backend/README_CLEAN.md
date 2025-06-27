# Educational Certificate Blockchain - Backend

## Overview

This is a specialized blockchain system designed specifically for managing educational certificates using **Proof of Authority (PoA)** consensus. The system is optimized for certificate issuance, verification, and management rather than cryptocurrency transactions.

## Key Features

### 🎓 Certificate Management

- **Certificate Issuance**: Authorized institutions can issue digital certificates
- **Certificate Verification**: Real-time verification of certificate authenticity
- **Certificate Revocation**: Institutions can revoke certificates when necessary
- **Certificate Ownership**: Track certificate ownership via wallet addresses

### 🏛️ Institution Management

- **Proof of Authority**: Only authorized institutions can process transactions
- **Multi-Institution Network**: Support for universities, vocational schools, and certification providers
- **Institution Registry**: Centralized registry of authorized educational institutions

### 🔒 Security & Trust

- **Digital Signatures**: All certificates are cryptographically signed
- **Immutable Records**: Certificate data cannot be altered once recorded
- **Decentralized Verification**: No single point of failure
- **Consensus Mechanism**: 2-of-3 validator consensus for network decisions

## Architecture

### Core Components

1. **CertificateBlockchain**: Main blockchain implementation for certificates
2. **CertificateTransaction**: Specialized transactions for certificate operations
3. **Certificate**: Digital certificate data structure
4. **Institution**: Educational institution management
5. **CertificateNode**: Network node for certificate processing

### Transaction Types

- `CERTIFICATE_ISSUANCE`: Issue a new certificate
- `CERTIFICATE_VERIFICATION`: Record certificate verification
- `CERTIFICATE_REVOCATION`: Revoke an existing certificate

### Deprecated Components

The following files are deprecated and should not be used:

- `Blockchain.js` - Generic blockchain with currency features
- `Transaction.js` - Generic transaction with amounts/fees
- `networkNode.js` - General purpose node with balance tracking

## Getting Started

### Installation

```bash
npm install
```

### Running the Network

Start all three institution nodes:

```bash
npm run nodes
```

Or start individual nodes:

```bash
# University Node (Port 3001)
npm run university

# Vocational School Node (Port 3002)
npm run vocational

# Certification Provider Node (Port 3003)
npm run certification
```

### Testing

```bash
# Run certificate-specific tests
npm test

# Run API tests
npm run test:api
```

## API Endpoints

### Certificate Operations

- `POST /certificates` - Issue a new certificate
- `GET /certificates/:id` - Get certificate by ID
- `POST /certificates/:id/verify` - Verify a certificate
- `POST /certificates/:id/revoke` - Revoke a certificate
- `GET /certificates` - Search certificates

### Blockchain Operations

- `GET /blockchain` - Get entire blockchain
- `GET /blocks` - Get all blocks
- `GET /statistics` - Get blockchain statistics
- `POST /mine` - Process pending transactions
- `GET /validate` - Validate blockchain

### Institution Management

- `GET /institutions` - Get all institutions
- `GET /institution` - Get current node's institution

### Wallet Operations

- `POST /wallets` - Create new wallet
- `GET /wallets` - Get all wallets
- `GET /wallets/:publicKey` - Get wallet details
- `GET /wallets/:publicKey/certificates` - Get wallet's certificates

### Network Management

- `GET /network` - Get network status
- `POST /initialize-network` - Initialize complete network
- `GET /consensus` - Run consensus algorithm

## Configuration

### Institution Types

- `UNIVERSITY`: Traditional universities
- `VOCATIONAL_SCHOOL`: Vocational and technical schools
- `CERTIFICATION_PROVIDER`: Professional certification organizations

### Network Ports

- Port 3001: University of Technology
- Port 3002: Professional Vocational School
- Port 3003: Global Certification Provider

## Important Differences from Cryptocurrency Blockchains

This blockchain system is **NOT** a cryptocurrency and deliberately excludes:

❌ **No Currency Features**:

- No coin/token balances
- No transaction fees
- No mining rewards
- No wallet balances

✅ **Certificate-Focused Features**:

- Certificate ownership tracking
- Institution authorization
- Document verification
- Academic credential management

## Development Notes

- Use `CertificateBlockchain.js` instead of `Blockchain.js`
- Use `CertificateTransaction.js` instead of `Transaction.js`
- Use `CertificateNode.js` instead of `networkNode.js`
- Focus on certificate use cases, not financial transactions

## License

ISC License
