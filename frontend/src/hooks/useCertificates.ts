import { useState, useEffect, useCallback } from 'react';
import type { 
  Certificate, 
  CertificateFormData, 
  CertificateVerification,
  CertificateSearchParams,
  UseCertificatesState 
} from '@/types/certificates';
import { api } from '@/services/certificateApi';

/**
 * Hook for managing certificates
 */
export const useCertificates = (initialSearchParams: CertificateSearchParams = {}) => {
  const [state, setState] = useState<UseCertificatesState>({
    certificates: [],
    loading: false,
    error: null,
    searchParams: initialSearchParams,
    filters: {
      status: [],
      types: [],
      institutions: [],
    },
    sort: {
      field: 'issueDate',
      direction: 'desc',
    },
  });

  // Fetch certificates
  const fetchCertificates = useCallback(async (params?: CertificateSearchParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const searchParams = params || state.searchParams;
      const certificates = await api.searchCertificates(searchParams);
      setState(prev => ({ 
        ...prev, 
        certificates, 
        loading: false,
        searchParams 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch certificates'
      }));
    }
  }, [state.searchParams]);

  // Search certificates
  const searchCertificates = useCallback((searchParams: CertificateSearchParams) => {
    fetchCertificates(searchParams);
  }, [fetchCertificates]);

  // Refresh certificates
  const refresh = useCallback(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCertificates();
  }, []);

  return {
    ...state,
    searchCertificates,
    refresh,
    clearError,
  };
};

/**
 * Hook for managing a single certificate
 */
export const useCertificate = (certificateId?: string) => {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const cert = await api.getCertificate(id);
      setCertificate(cert);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch certificate');
      setCertificate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (certificateId) {
      fetchCertificate(certificateId);
    }
  }, [certificateId, fetchCertificate]);

  return {
    certificate,
    loading,
    error,
    fetchCertificate,
    clearError,
  };
};

/**
 * Hook for certificate verification
 */
export const useCertificateVerification = () => {
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyCertificate = useCallback(async (certificateId: string) => {
    setLoading(true);
    setError(null);
    setVerification(null);
    
    try {
      const result = await api.verifyCertificate(certificateId);
      setVerification(result);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearVerification = useCallback(() => {
    setVerification(null);
    setError(null);
  }, []);

  return {
    verification,
    loading,
    error,
    verifyCertificate,
    clearVerification,
  };
};

/**
 * Hook for issuing certificates
 */
export const useCertificateIssuance = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const issueCertificate = useCallback(async (certificateData: CertificateFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await api.issueCertificate(certificateData);
      setSuccess(true);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to issue certificate');
      return false;
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
    issueCertificate,
    clearStatus,
  };
};

/**
 * Hook for certificate revocation
 */
export const useCertificateRevocation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const revokeCertificate = useCallback(async (certificateId: string, reason: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      await api.revokeCertificate(certificateId, reason);
      setSuccess(true);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to revoke certificate');
      return false;
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
    revokeCertificate,
    clearStatus,
  };
};

/**
 * Hook for real-time certificate verification (auto-refresh)
 */
export const useRealtimeCertificateVerification = (certificateId: string, intervalMs: number = 30000) => {
  const [verification, setVerification] = useState<CertificateVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const verifyAndUpdate = useCallback(async () => {
    if (!certificateId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.verifyCertificate(certificateId);
      setVerification(result);
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  }, [certificateId]);

  useEffect(() => {
    if (!certificateId) return;

    // Initial verification
    verifyAndUpdate();

    // Set up interval for periodic verification
    const interval = setInterval(verifyAndUpdate, intervalMs);

    return () => clearInterval(interval);
  }, [certificateId, intervalMs, verifyAndUpdate]);

  return {
    verification,
    loading,
    error,
    lastUpdated,
    refresh: verifyAndUpdate,
  };
};

/**
 * Utility hook for certificate status helpers
 */
export const useCertificateHelpers = () => {
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'VALID':
        return 'green';
      case 'EXPIRED':
        return 'orange';
      case 'REVOKED':
      case 'INVALID':
        return 'red';
      case 'NOT_FOUND':
        return 'gray';
      default:
        return 'gray';
    }
  }, []);

  const getTypeLabel = useCallback((type: string) => {
    const labels: Record<string, string> = {
      'BACHELOR': 'Bachelor Degree',
      'MASTER': 'Master Degree', 
      'PHD': 'PhD Degree',
      'DIPLOMA': 'Diploma',
      'CERTIFICATION': 'Certification',
      'PROFESSIONAL': 'Professional Certificate',
    };
    return labels[type] || type;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }, []);

  const isExpired = useCallback((certificate: Certificate) => {
    if (!certificate.expirationDate) return false;
    return new Date() > new Date(certificate.expirationDate);
  }, []);

  const getDaysUntilExpiration = useCallback((certificate: Certificate) => {
    if (!certificate.expirationDate) return null;
    
    const now = new Date();
    const expiration = new Date(certificate.expirationDate);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }, []);

  return {
    getStatusColor,
    getTypeLabel,
    formatDate,
    isExpired,
    getDaysUntilExpiration,
  };
};
