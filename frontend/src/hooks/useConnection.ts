import { useState, useEffect } from "react";
import { blockchainAPI } from "@/services/api";

export interface ConnectionStatus {
  isConnected: boolean;
  isChecking: boolean;
  error: string | null;
  lastChecked: Date | null;
  retryAttempts: number;
}

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isChecking: true,
    error: null,
    lastChecked: null,
    retryAttempts: 0,
  });

  const checkConnection = async (isAutomatic = false) => {
    setStatus(prev => ({ 
      ...prev, 
      isChecking: true, 
      error: isAutomatic ? prev.error : null 
    }));

    try {
      // Try to get blockchain info to test connection
      await blockchainAPI.getBlockchain();
      setStatus(prev => ({
        ...prev,
        isConnected: true,
        isChecking: false,
        error: null,
        lastChecked: new Date(),
        retryAttempts: 0,
      }));
    } catch (error) {
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

      setStatus(prev => ({
        ...prev,
        isConnected: false,
        isChecking: false,
        error: friendlyError,
        lastChecked: new Date(),
        retryAttempts: prev.retryAttempts + 1,
      }));
    }
  };

  // Manual retry function
  const retry = () => {
    checkConnection(false);
  };

  useEffect(() => {
    // Initial connection check
    checkConnection(false);

    // Auto-retry with exponential backoff when disconnected
    const intervalId = setInterval(() => {
      if (!status.isConnected) {
        // Exponential backoff: 5s, 10s, 20s, then 30s max
        const backoffDelay = Math.min(5000 * Math.pow(2, status.retryAttempts), 30000);
        setTimeout(() => checkConnection(true), backoffDelay);
      } else {
        // Regular health check every 30 seconds when connected
        checkConnection(true);
      }
    }, status.isConnected ? 30000 : 5000);

    return () => clearInterval(intervalId);
  }, [status.isConnected, status.retryAttempts]);

  return { 
    ...status,
    retry,
    // Legacy compatibility
    isConnected: status.isConnected,
    isChecking: status.isChecking,
  };
}
