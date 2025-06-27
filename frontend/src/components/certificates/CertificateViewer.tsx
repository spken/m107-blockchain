import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Hash,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Award,
  Clock,
} from "lucide-react";
import type {
  Certificate,
  CertificateVerification,
} from "@/types/certificates";
import { useCertificateHelpers } from "@/hooks/useCertificates";

interface CertificateViewerProps {
  certificate: Certificate | null;
  verification?: CertificateVerification;
  onVerify?: () => void;
  onClose?: () => void;
  verifying?: boolean;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({
  certificate,
  verification,
  onVerify,
  onClose,
  verifying = false,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const { getTypeLabel, formatDate, isExpired, getDaysUntilExpiration } =
    useCertificateHelpers();

  const getVerificationStatusIcon = useMemo(() => {
    if (!verification) return null;

    switch (verification.status) {
      case "VALID":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "EXPIRED":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "REVOKED":
      case "INVALID":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "NOT_FOUND":
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  }, [verification]);

  const getVerificationStatusColor = useMemo(():
    | "default"
    | "secondary"
    | "destructive"
    | "outline" => {
    if (!verification) return "outline";

    switch (verification.status) {
      case "VALID":
        return "default"; // Will show as green with custom styling
      case "EXPIRED":
        return "secondary"; // Will show as orange with custom styling
      case "REVOKED":
      case "INVALID":
        return "destructive";
      default:
        return "outline";
    }
  }, [verification]);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here if available
      console.log(`${label} copied to clipboard`);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  // Safety check for certificate
  if (!certificate) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Certificate Not Found
          </h3>
          <p className="text-gray-600">
            The requested certificate could not be loaded.
          </p>
          {onClose && (
            <Button onClick={onClose} className="mt-4">
              Close
            </Button>
          )}
        </div>
      </div>
    );
  }

  const certificateExpired = isExpired(certificate);
  const daysUntilExpiration = getDaysUntilExpiration(certificate);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{certificate.recipientName}</h1>
          <p className="text-lg text-gray-600">{certificate.institutionName}</p>
        </div>

        <div className="flex items-center gap-2">
          {verification && (
            <div className="flex items-center gap-2">
              {getVerificationStatusIcon}
              <Badge
                variant={getVerificationStatusColor}
                className={
                  verification.status === "VALID"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : verification.status === "EXPIRED"
                      ? "bg-orange-100 text-orange-800 border-orange-200"
                      : ""
                }
              >
                {verification.status}
              </Badge>
            </div>
          )}

          {onVerify && (
            <Button
              onClick={onVerify}
              disabled={verifying}
              variant="outline"
              aria-label={
                verifying
                  ? "Verifying certificate..."
                  : "Verify certificate authenticity"
              }
            >
              {verifying ? "Verifying..." : "Verify Certificate"}
            </Button>
          )}

          {onClose && (
            <Button
              onClick={onClose}
              variant="outline"
              aria-label="Close certificate viewer"
            >
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Certificate Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Certificate Details</TabsTrigger>
          <TabsTrigger value="technical">Technical Info</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          {/* Main Certificate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certificate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Recipient Name
                  </label>
                  <p className="text-lg font-semibold">
                    {certificate.recipientName}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Recipient Wallet Address
                  </label>
                  <p className="font-mono text-sm bg-gray-50 px-2 py-1 rounded border break-all">
                    {certificate.recipientId}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Certificate Type
                  </label>
                  <Badge variant="secondary" className="mt-1">
                    {getTypeLabel(certificate.certificateType)}
                  </Badge>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Course Name
                  </label>
                  <p className="text-lg">{certificate.courseName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Credential Level
                  </label>
                  <p className="text-lg">{certificate.credentialLevel}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Issuing Institution
                  </label>
                  <p className="text-lg font-semibold">
                    {certificate.institutionName}
                  </p>
                </div>

                {certificate.grade && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Grade
                    </label>
                    <p className="text-lg font-bold text-blue-600">
                      {certificate.grade}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Issue Date
                  </label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(certificate.issueDate)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Completion Date
                  </label>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(certificate.completionDate)}
                  </p>
                </div>

                {certificate.expirationDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Expiration Date
                    </label>
                    <div className="flex items-center gap-2">
                      <p className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(certificate.expirationDate)}
                      </p>
                      {certificateExpired && (
                        <Badge variant="destructive">Expired</Badge>
                      )}
                      {!certificateExpired &&
                        daysUntilExpiration !== null &&
                        daysUntilExpiration <= 30 && (
                          <Badge
                            variant="outline"
                            className="text-orange-600 border-orange-600"
                          >
                            Expires in {daysUntilExpiration} days
                          </Badge>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Metadata */}
          {certificate.metadata &&
            Object.keys(certificate.metadata).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(certificate.metadata).map(
                      ([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-600 capitalize">
                            {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </label>
                          <p className="text-sm">{String(value)}</p>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Blockchain Information
              </CardTitle>
              <CardDescription>
                Technical details about this certificate on the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Certificate ID
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                    {certificate.id}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(certificate.id, "Certificate ID")
                    }
                    aria-label="Copy certificate ID to clipboard"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Certificate Hash
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                    {certificate.hash}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(certificate.hash, "Certificate Hash")
                    }
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Institution Public Key
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                    {certificate.institutionPublicKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        certificate.institutionPublicKey,
                        "Institution Public Key",
                      )
                    }
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Digital Signature
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono break-all">
                    {certificate.signature}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        certificate.signature,
                        "Digital Signature",
                      )
                    }
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">
                  Timestamp
                </label>
                <p className="text-sm font-mono bg-gray-50 px-2 py-1 rounded border">
                  {formatDate(certificate.timestamp)}
                </p>
              </div>

              {/* Wallet Ownership Information */}
              {certificate.metadata?.recipientWalletAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Recipient Wallet Address
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-green-100 px-2 py-1 rounded text-sm font-mono break-all">
                      {certificate.metadata.recipientWalletAddress}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          certificate.metadata?.recipientWalletAddress || "",
                          "Recipient Wallet Address",
                        )
                      }
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    This certificate is assigned to the above wallet address
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Verification Status
              </CardTitle>
              <CardDescription>
                Current verification status of this certificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verification ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg border">
                    {getVerificationStatusIcon}
                    <div>
                      <p className="font-medium">
                        Status:{" "}
                        <span
                          className={
                            verification.status === "VALID"
                              ? "text-green-600"
                              : verification.status === "EXPIRED"
                                ? "text-orange-600"
                                : verification.status === "REVOKED" ||
                                    verification.status === "INVALID"
                                  ? "text-red-600"
                                  : "text-gray-600"
                          }
                        >
                          {verification.status}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600">
                        {verification.message}
                      </p>
                    </div>
                  </div>

                  {verification.valid && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <p className="font-medium text-green-800">
                          Certificate Verified
                        </p>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        This certificate has been successfully verified on the
                        blockchain and is authentic.
                      </p>
                    </div>
                  )}

                  {!verification.valid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-500" />
                        <p className="font-medium text-red-800">
                          Verification Failed
                        </p>
                      </div>
                      <p className="text-sm text-red-700 mt-1">
                        {verification.message}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Verification Data
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click "Verify Certificate" to check the authenticity of this
                    certificate.
                  </p>
                  {onVerify && (
                    <Button onClick={onVerify} disabled={verifying}>
                      {verifying ? "Verifying..." : "Verify Certificate"}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CertificateViewer;
