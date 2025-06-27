import type {
  Certificate,
  CertificateFormData,
  CertificateVerification,
  Block,
  BlockchainStats,
  NetworkStatus,
  Institution,
  CertificateApiResponse,
  BlockApiResponse,
  ConsensusResponse,
  CertificateSearchParams,
  CertificateTransaction,
  WalletApiResponse,
  WalletsApiResponse,
  WalletDetailsApiResponse,
  WalletCertificatesApiResponse,
  WalletTransactionsApiResponse,
} from "@/types/certificates";

const API_BASE_URL = "http://localhost:3001";

class CertificateAPI {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetchAPI<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, config);

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Enhanced error handling for network issues
      if (
        error instanceof TypeError &&
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          "ERR_CONNECTION_REFUSED: Cannot connect to backend server",
        );
      } else if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout: Backend server is not responding");
      } else if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network request failed");
    }
  }

  // ==================== CERTIFICATE ENDPOINTS ====================

  /**
   * Issue a new certificate
   */
  async issueCertificate(
    certificateData: CertificateFormData,
  ): Promise<CertificateApiResponse> {
    return this.fetchAPI<CertificateApiResponse>("/certificates", {
      method: "POST",
      body: JSON.stringify(certificateData),
    });
  }

  /**
   * Get certificate by ID
   */
  async getCertificate(id: string): Promise<Certificate> {
    return this.fetchAPI<Certificate>(`/certificates/${id}`);
  }

  /**
   * Search and filter certificates
   */
  async searchCertificates(
    params: CertificateSearchParams = {},
  ): Promise<Certificate[]> {
    const searchParams = new URLSearchParams();

    if (params.q) searchParams.append("q", params.q);
    if (params.institution)
      searchParams.append("institution", params.institution);
    if (params.recipient) searchParams.append("recipient", params.recipient);

    const endpoint =
      "/certificates" +
      (searchParams.toString() ? `?${searchParams.toString()}` : "");
    return this.fetchAPI<Certificate[]>(endpoint);
  }

  /**
   * Verify a certificate
   */
  async verifyCertificate(id: string): Promise<CertificateVerification> {
    return this.fetchAPI<CertificateVerification>(
      `/certificates/${id}/verify`,
      {
        method: "POST",
      },
    );
  }

  /**
   * Revoke a certificate
   */
  async revokeCertificate(
    id: string,
    reason: string,
  ): Promise<CertificateApiResponse> {
    return this.fetchAPI<CertificateApiResponse>(`/certificates/${id}/revoke`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  // ==================== BLOCKCHAIN ENDPOINTS ====================

  /**
   * Get all blocks
   */
  async getBlocks(): Promise<Block[]> {
    return this.fetchAPI<Block[]>("/blocks");
  }

  /**
   * Get block by hash
   */
  async getBlock(hash: string): Promise<Block> {
    return this.fetchAPI<Block>(`/blocks/${hash}`);
  }

  /**
   * Get blockchain statistics
   */
  async getStatistics(): Promise<BlockchainStats> {
    return this.fetchAPI<BlockchainStats>("/statistics");
  }

  /**
   * Validate blockchain
   */
  async validateBlockchain(): Promise<{ valid: boolean }> {
    return this.fetchAPI<{ valid: boolean }>("/validate");
  }

  /**
   * Mine pending transactions
   */
  async mineBlock(): Promise<BlockApiResponse> {
    return this.fetchAPI<BlockApiResponse>("/mine", {
      method: "POST",
    });
  }

  // ==================== TRANSACTION ENDPOINTS ====================

  /**
   * Get pending transactions
   */
  async getPendingTransactions(): Promise<CertificateTransaction[]> {
    return this.fetchAPI<CertificateTransaction[]>("/transactions/pending");
  }

  // ==================== AUTO-MINING ENDPOINTS ====================

  /**
   * Get auto-mining status
   */
  async getAutoMiningStatus(): Promise<{
    enabled: boolean;
    interval: number;
    active: boolean;
    pendingTransactions: number;
  }> {
    return this.fetchAPI("/auto-mining/status");
  }

  /**
   * Enable auto-mining
   */
  async enableAutoMining(): Promise<{ message: string; interval: number }> {
    return this.fetchAPI("/auto-mining/enable", { method: "POST" });
  }

  /**
   * Disable auto-mining
   */
  async disableAutoMining(): Promise<{ message: string }> {
    return this.fetchAPI("/auto-mining/disable", { method: "POST" });
  }

  // ==================== INSTITUTION ENDPOINTS ====================

  /**
   * Get all institutions
   */
  async getInstitutions(): Promise<Institution[]> {
    return this.fetchAPI<Institution[]>("/institutions");
  }

  /**
   * Get current node's institution info
   */
  async getCurrentInstitution(): Promise<Institution> {
    return this.fetchAPI<Institution>("/institution");
  }

  // ==================== NETWORK ENDPOINTS ====================

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<NetworkStatus> {
    return this.fetchAPI<NetworkStatus>("/network");
  }

  /**
   * Initialize network
   */
  async initializeNetwork(): Promise<{
    note: string;
    nodeUrls: string[];
    institution?: Institution;
  }> {
    return this.fetchAPI("/initialize-network", {
      method: "POST",
    });
  }

  /**
   * Register node with network
   */
  async registerNode(nodeUrl: string): Promise<{ note: string }> {
    return this.fetchAPI("/register-and-broadcast-node", {
      method: "POST",
      body: JSON.stringify({ newNodeUrl: nodeUrl }),
    });
  }

  // ==================== CONSENSUS ENDPOINTS ====================

  /**
   * Run consensus algorithm
   */
  async runConsensus(): Promise<ConsensusResponse> {
    return this.fetchAPI<ConsensusResponse>("/consensus");
  }

  // ==================== WALLET ENDPOINTS ====================

  /**
   * Create a new wallet
   */
  async createWallet(label?: string): Promise<WalletApiResponse> {
    return this.fetchAPI<WalletApiResponse>("/wallets", {
      method: "POST",
      body: JSON.stringify({ label }),
    });
  }

  /**
   * Get all wallets
   */
  async getWallets(): Promise<WalletsApiResponse> {
    return this.fetchAPI<WalletsApiResponse>("/wallets");
  }

  /**
   * Get wallet by public key
   */
  async getWallet(publicKey: string): Promise<WalletDetailsApiResponse> {
    return this.fetchAPI<WalletDetailsApiResponse>(`/wallets/${publicKey}`);
  }

  /**
   * Get certificates owned by a wallet
   */
  async getWalletCertificates(
    publicKey: string,
  ): Promise<WalletCertificatesApiResponse> {
    return this.fetchAPI<WalletCertificatesApiResponse>(
      `/wallets/${publicKey}/certificates`,
    );
  }

  /**
   * Get transaction history for a wallet
   */
  async getWalletTransactions(
    publicKey: string,
  ): Promise<WalletTransactionsApiResponse> {
    return this.fetchAPI<WalletTransactionsApiResponse>(
      `/wallets/${publicKey}/transactions`,
    );
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if API is reachable
   */
  async ping(): Promise<boolean> {
    try {
      await this.fetchAPI("/network");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get API health status
   */
  async getHealth(): Promise<{
    status: "healthy" | "unhealthy";
    timestamp: string;
    network: boolean;
    blockchain: boolean;
  }> {
    try {
      const [networkStatus, stats] = await Promise.all([
        this.getNetworkStatus(),
        this.getStatistics(),
      ]);

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        network: networkStatus.networkNodes.length > 0,
        blockchain: stats.totalBlocks > 0,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        network: false,
        blockchain: false,
      };
    }
  }

  /**
   * Set API base URL (for connecting to different nodes)
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Get current API base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Create default API instance
export const certificateAPI = new CertificateAPI();

// Export class for creating multiple instances
export { CertificateAPI };

// Export convenience functions for common operations
export const api = {
  // Certificates
  issueCertificate: (data: CertificateFormData) =>
    certificateAPI.issueCertificate(data),
  getCertificate: (id: string) => certificateAPI.getCertificate(id),
  searchCertificates: (params?: CertificateSearchParams) =>
    certificateAPI.searchCertificates(params),
  verifyCertificate: (id: string) => certificateAPI.verifyCertificate(id),
  revokeCertificate: (id: string, reason: string) =>
    certificateAPI.revokeCertificate(id, reason),

  // Blockchain
  getBlocks: () => certificateAPI.getBlocks(),
  getStatistics: () => certificateAPI.getStatistics(),
  mineBlock: () => certificateAPI.mineBlock(),
  validateBlockchain: () => certificateAPI.validateBlockchain(),

  // Transactions
  getPendingTransactions: () => certificateAPI.getPendingTransactions(),

  // Auto-mining
  getAutoMiningStatus: () => certificateAPI.getAutoMiningStatus(),
  enableAutoMining: () => certificateAPI.enableAutoMining(),
  disableAutoMining: () => certificateAPI.disableAutoMining(),

  // Institutions
  getInstitutions: () => certificateAPI.getInstitutions(),
  getCurrentInstitution: () => certificateAPI.getCurrentInstitution(),

  // Network
  getNetworkStatus: () => certificateAPI.getNetworkStatus(),
  initializeNetwork: () => certificateAPI.initializeNetwork(),
  runConsensus: () => certificateAPI.runConsensus(),

  // Health
  ping: () => certificateAPI.ping(),
  getHealth: () => certificateAPI.getHealth(),

  // Wallets
  createWallet: (label?: string) => certificateAPI.createWallet(label),
  getWallets: () => certificateAPI.getWallets(),
  getWallet: (publicKey: string) => certificateAPI.getWallet(publicKey),
  getWalletCertificates: (publicKey: string) =>
    certificateAPI.getWalletCertificates(publicKey),
  getWalletTransactions: (publicKey: string) =>
    certificateAPI.getWalletTransactions(publicKey),
};
