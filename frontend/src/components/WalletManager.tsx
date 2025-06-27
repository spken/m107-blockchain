import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Wallet as WalletIcon,
  Plus,
  Copy,
  Eye,
  History,
  Award,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
} from "lucide-react";
import type {
  Wallet,
  WalletDetails,
  Certificate,
  WalletTransaction,
} from "@/types/certificates";
import { useWallets, useWalletDetails } from "@/hooks/useWallets";
import { useCertificateHelpers } from "@/hooks/useCertificates";

interface WalletManagerProps {
  onSelectCertificate?: (certificate: Certificate) => void;
}

const WalletManager: React.FC<WalletManagerProps> = ({
  onSelectCertificate,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [newWalletLabel, setNewWalletLabel] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWalletPublicKey, setSelectedWalletPublicKey] = useState<
    string | null
  >(null);

  const { wallets, loading, error, createWallet, selectWallet } = useWallets();
  const { wallet: selectedWalletDetails, loading: detailsLoading } =
    useWalletDetails(selectedWalletPublicKey);
  const { formatDate, getTypeLabel } = useCertificateHelpers();

  const handleCreateWallet = async () => {
    try {
      await createWallet(newWalletLabel || undefined);
      setNewWalletLabel("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create wallet:", error);
    }
  };

  const handleSelectWallet = (wallet: Wallet) => {
    selectWallet(wallet);
    setSelectedWalletPublicKey(wallet.publicKey);
    setActiveTab("details");
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log(`${label} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const getTransactionIcon = (transaction: WalletTransaction) => {
    if (transaction.status === "PENDING") {
      return <Clock className="h-4 w-4 text-orange-500" />;
    }
    return transaction.type === "SENT" ? (
      <ArrowUpRight className="h-4 w-4 text-red-500" />
    ) : (
      <ArrowDownLeft className="h-4 w-4 text-green-500" />
    );
  };

  const getTransactionColor = (transaction: WalletTransaction) => {
    if (transaction.status === "PENDING") return "text-orange-600";
    return transaction.type === "SENT" ? "text-red-600" : "text-green-600";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <WalletIcon className="h-8 w-8" />
            Wallet Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your wallets and certificates
          </p>
        </div>

        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Wallet
        </Button>
      </div>

      {/* Create Wallet Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Wallet label (optional)"
                value={newWalletLabel}
                onChange={(e) => setNewWalletLabel(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleCreateWallet} disabled={loading}>
                {loading ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Wallet Overview</TabsTrigger>
          <TabsTrigger value="details">Wallet Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading wallets...</p>
            </div>
          ) : wallets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <WalletIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Wallets Found</h3>
                <p className="text-gray-600 mb-4">
                  Create your first wallet to start managing certificates.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Wallet
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map((wallet) => (
                <Card
                  key={wallet.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectWallet(wallet)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{wallet.label}</span>
                      {wallet.type && (
                        <Badge variant="secondary">{wallet.type}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span className="text-sm">
                          {wallet.certificateCount} certificates
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          Created {formatDate(wallet.created)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono truncate flex-1">
                          {wallet.publicKey}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(wallet.publicKey, "Public Key");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {selectedWalletDetails ? (
            <WalletDetailsView
              wallet={selectedWalletDetails}
              loading={detailsLoading}
              onSelectCertificate={onSelectCertificate}
              formatDate={formatDate}
              getTypeLabel={getTypeLabel}
              copyToClipboard={copyToClipboard}
              getTransactionIcon={getTransactionIcon}
              getTransactionColor={getTransactionColor}
            />
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Wallet Selected</h3>
                <p className="text-gray-600">
                  Select a wallet from the overview to view its details.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface WalletDetailsViewProps {
  wallet: WalletDetails;
  loading: boolean;
  onSelectCertificate?: (certificate: Certificate) => void;
  formatDate: (date: string) => string;
  getTypeLabel: (type: string) => string;
  copyToClipboard: (text: string, label: string) => void;
  getTransactionIcon: (transaction: WalletTransaction) => React.ReactNode;
  getTransactionColor: (transaction: WalletTransaction) => string;
}

const WalletDetailsView: React.FC<WalletDetailsViewProps> = ({
  wallet,
  loading,
  onSelectCertificate,
  formatDate,
  getTypeLabel,
  copyToClipboard,
  getTransactionIcon,
  getTransactionColor,
}) => {
  const [detailsTab, setDetailsTab] = useState("info");

  if (loading) {
    return (
      <div className="text-center py-8">
        <p>Loading wallet details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WalletIcon className="h-6 w-6" />
              <div>
                <h2 className="text-xl">{wallet.label || "Unnamed Wallet"}</h2>
                <p className="text-sm text-gray-600">
                  {wallet.isInstitution
                    ? "Institution Wallet"
                    : "Individual Wallet"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">
                {wallet.certificateCount}
              </p>
              <p className="text-sm text-gray-600">certificates</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">
                Public Key
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all flex-1">
                  {wallet.publicKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(wallet.publicKey, "Public Key")
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">
                Created
              </label>
              <p className="text-sm mt-1">{formatDate(wallet.created)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Details Tabs */}
      <Tabs value={detailsTab} onValueChange={setDetailsTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="certificates">
            Certificates ({wallet.certificates.length})
          </TabsTrigger>
          <TabsTrigger value="transactions">
            Transactions ({wallet.transactions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          {wallet.certificates.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Certificates</h3>
                <p className="text-gray-600">
                  This wallet doesn't own any certificates yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {wallet.certificates.map((certificate) => (
                <Card
                  key={certificate.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onSelectCertificate?.(certificate)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {certificate.recipientName}
                        </h3>
                        <p className="text-gray-600">
                          {certificate.courseName}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary">
                            {getTypeLabel(certificate.certificateType)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDate(certificate.issueDate)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {certificate.institutionName}
                        </p>
                        {certificate.grade && (
                          <p className="font-semibold text-blue-600">
                            {certificate.grade}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {wallet.transactions.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Transactions</h3>
                <p className="text-gray-600">
                  This wallet has no transaction history yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {wallet.transactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(transaction)}
                        <div>
                          <p className="font-medium">
                            {transaction.type === "SENT" ? "Sent" : "Received"}{" "}
                            Transaction
                          </p>
                          <p className="text-sm text-gray-600">
                            {transaction.type === "SENT" ? "To" : "From"}:{" "}
                            <code className="bg-gray-100 px-1 rounded text-xs">
                              {transaction.type === "SENT"
                                ? transaction.toAddress
                                : transaction.fromAddress}
                            </code>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${getTransactionColor(transaction)}`}
                        >
                          {transaction.type === "SENT" ? "-" : "+"}
                          {transaction.amount} coins
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(transaction.timestamp)}
                        </p>
                        {transaction.status && (
                          <Badge
                            variant={
                              transaction.status === "PENDING"
                                ? "outline"
                                : "default"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalletManager;
