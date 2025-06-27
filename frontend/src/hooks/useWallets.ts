import { useState, useEffect, useCallback } from "react";
import type {
  Wallet,
  UseWalletsState,
  UseWalletDetailsState,
} from "@/types/certificates";
import { api } from "@/services/certificateApi";

/**
 * Hook for managing wallets
 */
export const useWallets = () => {
  const [state, setState] = useState<UseWalletsState>({
    wallets: [],
    selectedWallet: null,
    loading: false,
    error: null,
  });

  // Fetch all wallets
  const fetchWallets = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.getWallets();
      setState((prev) => ({
        ...prev,
        wallets: response.wallets,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch wallets",
      }));
    }
  }, []);

  // Create new wallet
  const createWallet = useCallback(async (label?: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.createWallet(label);
      if (response.success && response.wallet) {
        setState((prev) => ({
          ...prev,
          wallets: [...prev.wallets, response.wallet!],
          loading: false,
        }));
        return response.wallet;
      } else {
        throw new Error(response.message || "Failed to create wallet");
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to create wallet",
      }));
      throw error;
    }
  }, []);

  // Select wallet
  const selectWallet = useCallback((wallet: Wallet | null) => {
    setState((prev) => ({ ...prev, selectedWallet: wallet }));
  }, []);

  // Initialize - fetch wallets on mount
  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  return {
    wallets: state.wallets,
    selectedWallet: state.selectedWallet,
    loading: state.loading,
    error: state.error,
    fetchWallets,
    createWallet,
    selectWallet,
  };
};

/**
 * Hook for managing wallet details
 */
export const useWalletDetails = (publicKey: string | null) => {
  const [state, setState] = useState<UseWalletDetailsState>({
    wallet: null,
    loading: false,
    error: null,
  });

  // Fetch wallet details
  const fetchWalletDetails = useCallback(async (walletPublicKey: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await api.getWallet(walletPublicKey);
      setState((prev) => ({
        ...prev,
        wallet: response.wallet,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch wallet details",
      }));
    }
  }, []);

  // Refresh wallet data
  const refreshWallet = useCallback(() => {
    if (publicKey) {
      fetchWalletDetails(publicKey);
    }
  }, [publicKey, fetchWalletDetails]);

  // Fetch details when publicKey changes
  useEffect(() => {
    if (publicKey) {
      fetchWalletDetails(publicKey);
    } else {
      setState({ wallet: null, loading: false, error: null });
    }
  }, [publicKey, fetchWalletDetails]);

  return {
    wallet: state.wallet,
    loading: state.loading,
    error: state.error,
    refreshWallet,
  };
};
