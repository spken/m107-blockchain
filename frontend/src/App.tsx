import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import CertificateDashboard from "@/components/certificates/CertificateDashboard";
import CertificateIssuanceForm from "@/components/certificates/CertificateIssuanceForm";
import CertificateViewer from "@/components/certificates/CertificateViewer";
import { BlockchainOverview } from "@/components/BlockchainOverview";
import { NetworkManager } from "@/components/NetworkManager";
import MempoolViewer from "@/components/MempoolViewer";
import {
  useBlocks,
  useInstitution,
  useConsensus,
  useConnectionStatus,
  useNetwork,
} from "@/hooks/useBlockchain";
import { useCertificates, useCertificateIssuance, useCertificateVerification } from "@/hooks/useCertificates";
import type { Certificate, CertificateFormData } from "@/types/certificates";
import {
  Award,
  Plus,
  Search,
  Network,
  Blocks,
  Shield,
  RefreshCw,
  Home,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [isAutoInitializing, setIsAutoInitializing] = useState(false);
  
  // Blockchain and network state
  const {
    blocks,
    loading: blocksLoading,
    refetch: refetchBlocks,
  } = useBlocks();
  
  const { runConsensus } = useConsensus();
  const connectionStatus = useConnectionStatus();
  const { isConnected, isChecking, error: connectionError, retry: retryConnection } = connectionStatus;
  const { institution } = useInstitution();
  
  // Network management for auto-initialization
  const {
    networkStatus,
    institutions,
    initializeNetwork,
    loading: networkLoading,
    refresh: refreshNetworkData,
  } = useNetwork();
  
  // Certificate state
  const {
    certificates,
    loading: certificatesLoading,
    searchCertificates,
    refresh: refreshCertificates,
  } = useCertificates();

  // Certificate issuance
  const { 
    issueCertificate, 
    loading: issuingCertificate, 
    error: issuanceError, 
    success: issuanceSuccess,
    clearStatus: clearIssuanceStatus 
  } = useCertificateIssuance();

  // Auto-initialize network when connection is established
  useEffect(() => {
    let initializationTimeout: NodeJS.Timeout;

    const attemptNetworkInitialization = async () => {
      if (isAutoInitializing) {
        console.log("Auto-initialization already in progress, skipping");
        return;
      }

      try {
        console.log("Connection established, checking if network needs initialization...");
        setIsAutoInitializing(true);
        
        // First, refresh network data to get current status
        await refreshNetworkData();
        
        // Wait a moment for the data to be updated - we'll check in the next effect cycle
        
      } catch (error) {
        console.log("Error refreshing network data:", error);
        setIsAutoInitializing(false);
      }
    };

    if (isConnected && !isChecking) {
      // Wait a moment after connection is established before trying to initialize
      initializationTimeout = setTimeout(attemptNetworkInitialization, 1000);
    }

    return () => {
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, [isConnected, isChecking, refreshNetworkData]);

  // Separate effect to check for initialization after network data is loaded
  useEffect(() => {
    const checkAndInitialize = async () => {
      if (!isConnected || !isAutoInitializing || networkLoading) {
        return;
      }

      try {
        // Check if network needs initialization (multiple indicators)
        const hasNoNetworkNodes = !networkStatus?.networkNodes || networkStatus.networkNodes.length === 0;
        const hasNoInstitution = !networkStatus?.institution;
        const hasNoInstitutions = institutions.length === 0;
        const hasOnlyGenesisBlock = !blocks || blocks.length <= 1;
        
        const needsInit = !networkStatus || hasNoNetworkNodes || hasNoInstitution || (hasNoInstitutions && hasOnlyGenesisBlock);
        
        console.log("Network initialization check:", {
          needsInit,
          hasNetworkStatus: !!networkStatus,
          networkNodesCount: networkStatus?.networkNodes?.length || 0,
          hasInstitution: !hasNoInstitution,
          institutionsLength: institutions.length,
          blocksCount: blocks?.length || 0,
          reasons: {
            hasNoNetworkNodes,
            hasNoInstitution,
            hasNoInstitutions,
            hasOnlyGenesisBlock
          }
        });

        if (needsInit) {
          console.log("Network appears uninitialized, attempting automatic initialization...");
          const success = await initializeNetwork();
          if (success) {
            console.log("Network automatically initialized successfully");
            // Refresh data after successful initialization
            refetchBlocks();
            refreshCertificates();
          } else {
            console.log("Automatic network initialization failed");
          }
        } else {
          console.log("Network appears to be already initialized, skipping auto-init");
        }
      } catch (error) {
        console.log("Error during automatic network initialization:", error);
      } finally {
        setIsAutoInitializing(false);
      }
    };

    // Only run if we're in auto-initialization mode and network data is loaded
    if (isAutoInitializing && !networkLoading) {
      checkAndInitialize();
    }
  }, [isAutoInitializing, networkLoading, networkStatus, institutions, blocks, isConnected, initializeNetwork, refetchBlocks, refreshCertificates]);

  // Periodic consensus to keep the blockchain synchronized (only when connected)
  useEffect(() => {
    if (!isConnected) {
      return; // Don't run consensus when not connected
    }

    const runPeriodicConsensus = async () => {
      try {
        const result = await runConsensus();
        if (result.note && result.note.includes("ersetzt")) {
          console.log("Blockchain synchronized via periodic consensus");
          // Refresh data if blockchain was updated
          refetchBlocks();
          refreshCertificates();
        }
      } catch (error) {
        console.log("Periodic consensus failed:", error);
      }
    };

    // Run consensus every 30 seconds to keep nodes synchronized
    const consensusInterval = setInterval(runPeriodicConsensus, 30000);

    // Also run consensus on initial connection
    runPeriodicConsensus();

    return () => clearInterval(consensusInterval);
  }, [runConsensus, refetchBlocks, refreshCertificates, isConnected]);

  // Auto-refresh certificates when switching to dashboard
  useEffect(() => {
    if (activeTab === "dashboard") {
      refreshCertificates();
    } else if (activeTab === "issue") {
      // Clear any previous issuance status when opening the form
      clearIssuanceStatus();
    }
  }, [activeTab, refreshCertificates, clearIssuanceStatus]);

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateModal(true);
  };

  const handleCertificateIssue = async (data: CertificateFormData) => {
    console.log('Attempting to issue certificate with data:', data);
    try {
      const result = await issueCertificate(data);
      console.log('Certificate issuance result:', result);
      if (result) {
        console.log('Certificate issued successfully, redirecting to mempool...');
        // Switch to mempool to show the new pending transaction
        setActiveTab("mempool");
        await refreshCertificates();
        console.log('Data refreshed, new transaction should be visible in mempool');
      } else {
        console.error('Certificate issuance failed - no result returned');
      }
    } catch (error) {
      console.error('Failed to issue certificate:', error);
      // TODO: Show error message to user
    }
  };

  const handleSearch = (query: string) => {
    searchCertificates({ q: query });
  };

  const { verifyCertificate } = useCertificateVerification();
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifyingId, setVerifyingId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyCertificate = async (certificateId: string) => {
    if (!certificateId.trim()) return;
    
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const result = await verifyCertificate(certificateId);
      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        status: 'ERROR',
        message: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  CertiChain
                </h1>
                <p className="text-sm text-gray-500">
                  Decentralized Educational Certificate Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Institution Badge */}
              {institution && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {institution.name}
                  </Badge>
                </div>
              )}
              
              {/* Network Status */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isChecking || isAutoInitializing
                      ? "bg-yellow-500 animate-pulse"
                      : isConnected
                        ? "bg-green-500 animate-pulse"
                        : "bg-red-500"
                  }`}
                ></div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">
                    {isChecking
                      ? "Connecting..."
                      : isAutoInitializing
                        ? "Initializing Network..."
                        : isConnected
                          ? "Network Online & Synchronized"
                          : "Network Offline, run backend?"}
                  </span>
                  {connectionError && !isConnected && (
                    <span className="text-xs text-red-500 max-w-xs truncate" title={connectionError}>
                      {connectionError}
                    </span>
                  )}
                  {isAutoInitializing && (
                    <span className="text-xs text-blue-600">
                      Setting up blockchain network...
                    </span>
                  )}
                </div>
                {!isConnected && !isChecking && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={retryConnection}
                    className="text-xs px-2 py-1 h-6"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Connection Error Banner */}
      {connectionError && !isConnected && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Network Connection Error
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {connectionError}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={retryConnection}
                className="bg-white border-red-300 text-red-700 hover:bg-red-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Connection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Initialization Banner */}
      {isAutoInitializing && isConnected && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-blue-400 mr-3 animate-spin" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Initializing Blockchain Network
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Setting up peer connections and network configuration...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="issue" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Issue Certificate</span>
            </TabsTrigger>
            <TabsTrigger value="verify" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Verify Certificate</span>
            </TabsTrigger>
            <TabsTrigger value="mempool" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Mempool</span>
            </TabsTrigger>
            <TabsTrigger value="blockchain" className="flex items-center gap-2">
              <Blocks className="w-4 h-4" />
              <span className="hidden sm:inline">Blockchain</span>
              {blocks.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800"
                >
                  {blocks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">Network</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Certificate Dashboard
                </h2>
                <p className="text-gray-600">
                  Manage and view all certificates in the network
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshCertificates}
                disabled={certificatesLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${certificatesLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            
            <ErrorBoundary>
              <CertificateDashboard 
                certificates={certificates}
                loading={certificatesLoading}
                onSearch={handleSearch}
                onViewCertificate={handleViewCertificate}
                onVerifyCertificate={handleVerifyCertificate}
              />
            </ErrorBoundary>
          </TabsContent>

          {/* Issue Certificate Tab */}
          <TabsContent value="issue" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Issue New Certificate
              </h2>
              <p className="text-gray-600">
                Create and issue a new educational certificate
              </p>
            </div>
            <ErrorBoundary>
              <CertificateIssuanceForm 
                onSubmit={handleCertificateIssue}
                loading={issuingCertificate}
              />
              {issuanceError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <strong>Error:</strong> {issuanceError}
                  </p>
                </div>
              )}
              {issuanceSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm">
                    <strong>Success:</strong> Certificate issued successfully!
                  </p>
                </div>
              )}
            </ErrorBoundary>
          </TabsContent>

          {/* Verify Certificate Tab */}
          <TabsContent value="verify" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Verify Certificate
              </h2>
              <p className="text-gray-600">
                Enter a certificate ID to verify its authenticity and status
              </p>
            </div>
            <ErrorBoundary>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Certificate Verification
                  </CardTitle>
                  <CardDescription>
                    Enter the certificate ID to check its validity and status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter certificate ID (e.g., cert_1234567890)"
                      value={verifyingId}
                      onChange={(e) => setVerifyingId(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => handleVerifyCertificate(verifyingId)}
                      disabled={isVerifying || !verifyingId.trim()}
                      className="px-6"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                  
                  {verificationResult && (
                    <div className="mt-6">
                      {verificationResult.status === 'ERROR' ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 text-red-800">
                            <XCircle className="w-5 h-5" />
                            <span className="font-medium">Verification Failed</span>
                          </div>
                          <p className="text-red-700 mt-1">{verificationResult.message}</p>
                        </div>
                      ) : (
                        <div className={`border rounded-lg p-4 ${
                          verificationResult.valid 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className={`flex items-center gap-2 ${
                            verificationResult.valid ? 'text-green-800' : 'text-red-800'
                          }`}>
                            {verificationResult.valid ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                              {verificationResult.valid ? 'Certificate Valid' : 'Certificate Invalid'}
                            </span>
                          </div>
                          <p className={`mt-1 ${
                            verificationResult.valid ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {verificationResult.message || 'Verification completed'}
                          </p>
                          
                          {verificationResult.certificate && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h4 className="font-medium text-gray-900 mb-2">Certificate Details</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-600">Recipient:</span>
                                  <div className="font-medium">{verificationResult.certificate.recipientName}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Institution:</span>
                                  <div className="font-medium">{verificationResult.certificate.institutionName}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Course:</span>
                                  <div className="font-medium">{verificationResult.certificate.courseName}</div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Issue Date:</span>
                                  <div className="font-medium">
                                    {new Date(verificationResult.certificate.issueDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <Button 
                                className="mt-3"
                                variant="outline"
                                onClick={() => {
                                  setSelectedCertificate(verificationResult.certificate);
                                  setActiveTab('dashboard');
                                }}
                              >
                                View Full Details
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </ErrorBoundary>
          </TabsContent>

          {/* Mempool Tab */}
          <TabsContent value="mempool" className="space-y-6">
            <ErrorBoundary>
              <MempoolViewer />
            </ErrorBoundary>
          </TabsContent>

          {/* Blockchain Tab */}
          <TabsContent value="blockchain" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Blockchain Overview
                </h2>
                <p className="text-gray-600">
                  View blockchain structure and network consensus
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refetchBlocks}
                disabled={blocksLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${blocksLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
            <ErrorBoundary>
              <BlockchainOverview />
            </ErrorBoundary>
          </TabsContent>

          {/* Network Tab */}
          <TabsContent value="network" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Network Management
              </h2>
              <p className="text-gray-600">
                Manage network connections and institution registry
              </p>
            </div>
            <ErrorBoundary>
              <NetworkManager />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
        </div>
      </main>

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Certificate Details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCertificateModal(false)}
                >
                  ×
                </Button>
              </div>
              <CertificateViewer 
                certificate={selectedCertificate}
                onClose={() => setShowCertificateModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>
              © 2025 CertiChain. All rights reserved.
            </p>
            <p className="mt-2">
              Connected to certificate network on{" "}
              <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                {import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}
              </code>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
