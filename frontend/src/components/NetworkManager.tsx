import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorFallback, LoadingSpinner } from "@/components/ui/error-fallback";
import { useNetwork } from "@/hooks/useBlockchain";
import { useState } from "react";
import { RefreshCw, Network, Users, Shield } from "lucide-react";

function NetworkManager() {
  const {
    networkStatus,
    institutions,
    loading,
    error,
    refresh,
    initializeNetwork,
    runConsensus,
  } = useNetwork();

  const [isInitializing, setIsInitializing] = useState(false);
  const [isRunningConsensus, setIsRunningConsensus] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error') => {
    setFeedbackMessage(message);
    setFeedbackType(type);
    setTimeout(() => {
      setFeedbackMessage(null);
      setFeedbackType(null);
    }, 5000);
  };

  const handleInitializeNetwork = async () => {
    try {
      setIsInitializing(true);
      const result = await initializeNetwork();
      if (result) {
        showFeedback("Network initialized successfully!", "success");
        await refresh();
      } else {
        showFeedback("Network initialization failed. Check if all nodes are running.", "error");
      }
    } catch (error) {
      console.error("Failed to initialize network:", error);
      const errorMessage = error instanceof Error ? error.message : "Network initialization failed";
      showFeedback(errorMessage, "error");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRunConsensus = async () => {
    try {
      setIsRunningConsensus(true);
      const result = await runConsensus();
      if (result) {
        showFeedback(
          result.note || "Consensus completed successfully!", 
          "success"
        );
        await refresh();
      }
    } catch (error) {
      console.error("Failed to run consensus:", error);
      const errorMessage = error instanceof Error ? error.message : "Consensus failed";
      showFeedback(errorMessage, "error");
    } finally {
      setIsRunningConsensus(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorFallback error={error} onRetry={refresh} />;
  }

  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {feedbackMessage && (
        <div className={`p-4 rounded-lg ${
          feedbackType === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {feedbackMessage}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Network Management</h2>
        <div className="flex gap-2">
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button
            onClick={handleInitializeNetwork}
            variant="outline"
            size="sm"
            disabled={isInitializing}
          >
            <Network className="w-4 h-4 mr-1" />
            {isInitializing ? "Initializing..." : "Initialize Network"}
          </Button>
          <Button
            onClick={handleRunConsensus}
            variant="outline"
            size="sm"
            disabled={isRunningConsensus}
          >
            <Shield className="w-4 h-4 mr-1" />
            {isRunningConsensus ? "Running..." : "Run Consensus"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Node</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">
              {networkStatus?.currentNodeUrl || "Unknown"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Connected Peers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {networkStatus?.connectedPeers ?? 0} / {networkStatus?.totalPeers ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{institutions.length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Network Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Node ID:</span>
              <span className="font-mono text-xs">
                {networkStatus?.nodeId || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Current Institution:
              </span>
              <span className="text-sm">
                {networkStatus?.institution?.name || "None"}
              </span>
            </div>
            {networkStatus?.institution && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Institution Type:</span>
                <Badge variant="outline">
                  {networkStatus.institution.type}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Registered Institutions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {institutions.length > 0 ? (
                institutions.map((institution, index) => (
                  <div
                    key={institution.publicKey || index}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <div>
                      <div className="font-medium">{institution.name}</div>
                      <div className="text-xs text-gray-500">
                        {institution.type}
                      </div>
                    </div>
                    <Badge
                      variant={institution.authorized ? "default" : "secondary"}
                    >
                      {institution.authorized ? "Authorized" : "Pending"}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No institutions registered
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {networkStatus?.networkNodes && networkStatus.networkNodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Network Nodes</CardTitle>
            <CardDescription>
              Connected nodes in the blockchain network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {/* Current node */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center gap-3">
                  <Badge variant="default">Current</Badge>
                  <div>
                    <div className="font-mono text-sm">
                      {networkStatus.currentNodeUrl}
                    </div>
                    <div className="text-xs text-gray-500">This node</div>
                  </div>
                </div>
                <Badge variant="default">Online</Badge>
              </div>

              {/* Other nodes with actual status */}
              {networkStatus.networkNodes.map((nodeUrl, index) => {
                const peerStatus = networkStatus.peerStatuses?.find(peer => peer.url === nodeUrl);
                const statusVariant = 
                  peerStatus?.status === "Online" ? "default" : 
                  peerStatus?.status === "Offline" ? "secondary" : "destructive";
                
                return (
                  <div
                    key={nodeUrl}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">Node {index + 1}</Badge>
                      <div>
                        <div className="font-mono text-sm">{nodeUrl}</div>
                        <div className="text-xs text-gray-500">
                          {peerStatus?.lastCheck ? 
                            `Last checked: ${new Date(peerStatus.lastCheck).toLocaleTimeString()}` :
                            "Network peer"
                          }
                        </div>
                        {peerStatus?.error && (
                          <div className="text-xs text-red-500" title={peerStatus.error}>
                            Connection error
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusVariant}>
                      {peerStatus?.status || "Checking..."}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export { NetworkManager };
