import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePendingTransactions, useAutoMining } from "@/hooks/useCertificates";
import { useConsensus } from "@/hooks/useBlockchain";
import type { CertificateTransaction } from "@/types/certificates";
import {
  Clock,
  RefreshCw,
  Pickaxe,
  User,
  Building,
  BookOpen,
  Calendar,
  Hash,
  AlertCircle,
} from "lucide-react";

export const MempoolViewer: React.FC = () => {
  const { pendingTransactions, loading, error, refresh } =
    usePendingTransactions();
  const { runConsensus } = useConsensus();
  const {
    status: autoMiningStatus,
    enableAutoMining,
    disableAutoMining,
    refresh: refreshAutoMining,
  } = useAutoMining();
  const [miningLoading, setMiningLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 5 seconds when enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refresh();
      refreshAutoMining();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, refresh, refreshAutoMining]);

  const formatTransactionType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case "CERTIFICATE_ISSUANCE":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "CERTIFICATE_VERIFICATION":
        return "bg-green-100 text-green-800 border-green-200";
      case "CERTIFICATE_REVOCATION":
        return "bg-red-100 text-red-800 border-red-200";
      case "MINING_REWARD":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCertificateInfo = (transaction: CertificateTransaction) => {
    // Fix: Access certificate data from payload.certificate
    if (
      transaction.type === "CERTIFICATE_ISSUANCE" &&
      transaction.payload?.certificate
    ) {
      const cert = transaction.payload.certificate;
      return {
        recipientName: cert.recipientName || "Unknown Recipient",
        institutionName: cert.institutionName || "Unknown Institution",
        courseName: cert.courseName || "N/A",
        certificateType: cert.certificateType || "Unknown",
      };
    }

    // For other transaction types, try to extract what we can
    if (transaction.certificate) {
      return {
        recipientName:
          transaction.certificate.recipientName || "Unknown Recipient",
        institutionName:
          transaction.certificate.institutionName || "Unknown Institution",
        courseName: transaction.certificate.courseName || "N/A",
        certificateType: transaction.certificate.certificateType || "Unknown",
      };
    }

    return {
      recipientName: "Unknown Recipient",
      institutionName: "Unknown Institution",
      courseName: "N/A",
      certificateType: "Unknown",
    };
  };

  const handleMineTransactions = async () => {
    setMiningLoading(true);
    try {
      await runConsensus();
      // Refresh after mining
      setTimeout(() => refresh(), 1000);
    } catch (error) {
      console.error("Mining failed:", error);
    } finally {
      setMiningLoading(false);
    }
  };

  if (loading && pendingTransactions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading mempool...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mempool</h1>
            <p className="text-gray-600 mt-2">
              View pending transactions waiting to be mined into blocks
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`}
              />
              Auto Refresh {autoRefresh ? "On" : "Off"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={handleMineTransactions}
              disabled={miningLoading || pendingTransactions.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Pickaxe className="h-4 w-4 mr-2" />
              {miningLoading ? "Mining..." : "Mine Block"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Transactions
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingTransactions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Hash className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Total Transaction Fees
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingTransactions.reduce(
                      (sum, tx) => sum + (tx.fee || 0),
                      0,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Pickaxe className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">
                    Ready to Mine
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pendingTransactions.length > 0 ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <RefreshCw
                    className={`h-8 w-8 ${autoMiningStatus?.active ? "text-green-600 animate-spin" : "text-gray-400"}`}
                  />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">
                      Auto-Mining
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {autoMiningStatus?.enabled ? "Enabled" : "Disabled"}
                    </p>
                    {autoMiningStatus?.enabled && (
                      <p className="text-xs text-gray-500">
                        Every {autoMiningStatus.interval / 1000}s
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={
                    autoMiningStatus?.enabled ? "destructive" : "default"
                  }
                  onClick={
                    autoMiningStatus?.enabled
                      ? disableAutoMining
                      : enableAutoMining
                  }
                  className="ml-2"
                >
                  {autoMiningStatus?.enabled ? "Stop" : "Start"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      {pendingTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Pending Transactions
            </h3>
            <p className="text-gray-600">
              The mempool is empty. New transactions will appear here when
              certificates are issued or other operations are performed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingTransactions.map((transaction) => {
            const certInfo = getCertificateInfo(transaction);

            return (
              <Card
                key={transaction.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={getTransactionTypeColor(transaction.type)}
                      >
                        {formatTransactionType(transaction.type)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      {transaction.id.substring(0, 8)}...
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {transaction.type === "CERTIFICATE_ISSUANCE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Recipient</p>
                          <p className="font-medium">
                            {certInfo.recipientName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Institution</p>
                          <p className="font-medium">
                            {certInfo.institutionName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Course</p>
                          <p className="font-medium">{certInfo.courseName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="font-medium">
                            {certInfo.certificateType}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {transaction.type !== "CERTIFICATE_ISSUANCE" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">From Address</p>
                        <p className="font-mono text-sm">
                          {transaction.fromAddress
                            ? `${transaction.fromAddress.substring(0, 16)}...`
                            : "System"}
                        </p>
                      </div>

                      {transaction.toAddress && (
                        <div>
                          <p className="text-xs text-gray-500">To Address</p>
                          <p className="font-mono text-sm">
                            {transaction.toAddress.substring(0, 16)}...
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {transaction.fee > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Transaction Fee:{" "}
                        <span className="font-medium">{transaction.fee}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MempoolViewer;
