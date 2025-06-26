import { useState, useEffect, useCallback } from 'react';
import type { 
  Block, 
  NetworkStatus, 
  Institution,
  UseBlockchainState,
  UseInstitutionState,
  CertificateTransaction
} from '@/types/certificates';
import { api } from '@/services/certificateApi';

/**
 * Hook for managing blockchain data
 */
export const useBlockchain = () => {
  const [state, setState] = useState<UseBlockchainState>({
    blocks: [],
    stats: null,
    loading: false,
    error: null,
    lastUpdate: null,
  });

  // Fetch blocks
  const fetchBlocks = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const blocks = await api.getBlocks();
      setState(prev => ({ 
        ...prev, 
        blocks, 
        loading: false,
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch blocks'
      }));
    }
  }, []);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const stats = await api.getStatistics();
      setState(prev => ({ ...prev, stats }));
    } catch (error) {
      console.error('Failed to fetch blockchain stats:', error);
    }
  }, []);

  // Fetch all blockchain data
  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [blocks, stats] = await Promise.all([
        api.getBlocks(),
        api.getStatistics(),
      ]);
      
      setState(prev => ({ 
        ...prev, 
        blocks, 
        stats,
        loading: false,
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch blockchain data'
      }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchAll();
  }, []);

  return {
    ...state,
    fetchBlocks,
    fetchStats,
    fetchAll,
    refresh: fetchAll,
    clearError,
  };
};

/**
 * Hook for managing institution data
 */
export const useInstitution = () => {
  const [state, setState] = useState<UseInstitutionState>({
    institution: null,
    networkStatus: null,
    loading: false,
    error: null,
  });

  // Fetch current institution
  const fetchInstitution = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const [institution, networkStatus] = await Promise.all([
        api.getCurrentInstitution(),
        api.getNetworkStatus(),
      ]);
      
      setState(prev => ({ 
        ...prev, 
        institution, 
        networkStatus,
        loading: false
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch institution data'
      }));
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInstitution();
  }, []);

  return {
    ...state,
    refresh: fetchInstitution,
    clearError,
  };
};

/**
 * Hook for managing mining operations
 */
export const useMining = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [lastBlock, setLastBlock] = useState<Block | null>(null);

  const mineBlock = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await api.mineBlock();
      setSuccess(true);
      setLastBlock(result.block || null);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to mine block');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearStatus = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return {
    loading,
    error,
    success,
    lastBlock,
    mineBlock,
    clearStatus,
  };
};

/**
 * Hook for managing pending transactions
 */
export const usePendingTransactions = () => {
  const [transactions, setTransactions] = useState<CertificateTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const transactions = await api.getPendingTransactions();
      setTransactions(transactions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch pending transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    refresh: fetchPendingTransactions,
    clearError,
  };
};

/**
 * Hook for network management
 */
export const useNetwork = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworkData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [status, institutions] = await Promise.all([
        api.getNetworkStatus(),
        api.getInstitutions(),
      ]);
      
      setNetworkStatus(status);
      setInstitutions(institutions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch network data');
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeNetwork = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      await api.initializeNetwork();
      await fetchNetworkData(); // Refresh after initialization
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to initialize network');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchNetworkData]);

  const runConsensus = useCallback(async () => {
    try {
      const result = await api.runConsensus();
      return result;
    } catch (error) {
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchNetworkData();
  }, []);

  return {
    networkStatus,
    institutions,
    loading,
    error,
    refresh: fetchNetworkData,
    initializeNetwork,
    runConsensus,
    clearError,
  };
};

/**
 * Hook for connection status monitoring with enhanced error handling
 */
export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const checkConnection = useCallback(async (isAutomatic = false) => {
    setIsChecking(true);
    if (!isAutomatic) {
      setError(null);
    }
    
    try {
      const connected = await api.ping();
      setIsConnected(connected);
      setLastCheck(new Date().toISOString());
      setError(null);
      setRetryAttempts(0);
    } catch (error) {
      setIsConnected(false);
      setLastCheck(new Date().toISOString());
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let friendlyError = 'Connection failed';
      
      // Provide user-friendly error messages
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
        friendlyError = 'Backend server is not running. Please start the backend service.';
      } else if (errorMessage.includes('ERR_NETWORK')) {
        friendlyError = 'Network error. Please check your internet connection.';
      } else if (errorMessage.includes('timeout')) {
        friendlyError = 'Connection timeout. The backend server may be overloaded.';
      } else if (errorMessage.includes('404')) {
        friendlyError = 'Backend API not found. Please check the server configuration.';
      } else if (errorMessage.includes('500')) {
        friendlyError = 'Backend server error. Please check the server logs.';
      } else {
        friendlyError = `Connection error: ${errorMessage}`;
      }
      
      setError(friendlyError);
      setRetryAttempts(prev => prev + 1);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check connection on mount and periodically with smart retry logic
  useEffect(() => {
    checkConnection(false);
    
    const getRetryInterval = () => {
      if (isConnected) {
        return 30000; // 30 seconds when connected
      } else {
        // Exponential backoff: 5s, 10s, 20s, then 30s max when disconnected
        return Math.min(5000 * Math.pow(2, retryAttempts), 30000);
      }
    };
    
    const interval = setInterval(() => {
      checkConnection(true);
    }, getRetryInterval());
    
    return () => clearInterval(interval);
  }, [checkConnection, isConnected, retryAttempts]);

  const retry = useCallback(() => {
    checkConnection(false);
  }, [checkConnection]);

  return {
    isConnected,
    isChecking,
    error,
    lastCheck,
    retryAttempts,
    checkConnection,
    retry,
  };
};

/**
 * Hook for auto-refreshing blockchain data
 */
export const useAutoRefresh = (intervalMs: number = 60000) => {
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const blockchain = useBlockchain();
  const pendingTransactions = usePendingTransactions();

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        blockchain.refresh(),
        pendingTransactions.refresh(),
      ]);
      setLastRefresh(new Date().toISOString());
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, [blockchain, pendingTransactions]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(refreshAll, intervalMs);
    
    return () => clearInterval(interval);
  }, [refreshAll, intervalMs, autoRefreshEnabled]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled(prev => !prev);
  }, []);

  return {
    lastRefresh,
    autoRefreshEnabled,
    toggleAutoRefresh,
    refreshAll,
    blockchain,
    pendingTransactions,
  };
};

/**
 * Hook for blockchain validation
 */
export const useBlockchainValidation = () => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastValidation, setLastValidation] = useState<string | null>(null);

  const validateBlockchain = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.validateBlockchain();
      setIsValid(result.valid);
      setLastValidation(new Date().toISOString());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to validate blockchain');
      setIsValid(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isValid,
    loading,
    error,
    lastValidation,
    validateBlockchain,
    clearError,
  };
};

// Legacy hooks for backward compatibility with existing components
export const useBlocks = () => {
  const blockchain = useBlockchain();
  
  return {
    blocks: blockchain.blocks,
    loading: blockchain.loading,
    error: blockchain.error,
    refetch: blockchain.fetchBlocks,
  };
};

export const useMempool = () => {
  const pendingTx = usePendingTransactions();
  
  return {
    mempool: pendingTx.transactions,
    loading: pendingTx.loading,
    error: pendingTx.error,
    refetch: pendingTx.refresh,
  };
};

export const useConsensus = () => {
  const network = useNetwork();
  
  return {
    runConsensus: network.runConsensus,
  };
};

export const useAutoNetworkSetup = () => {
  const network = useNetwork();
  
  return {
    runAutoNetworkSetup: network.initializeNetwork,
  };
};
