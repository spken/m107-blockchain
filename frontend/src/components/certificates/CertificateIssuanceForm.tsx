import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Save,
  X,
  AlertCircle,
  Plus,
  Wallet,
  Building,
} from "lucide-react";
import type {
  CertificateFormData,
  CertificateType,
  CertificateFormErrors,
} from "@/types/certificates";
import { useWallets } from "@/hooks/useWallets";
import { useInstitution } from "@/hooks/useBlockchain";

interface CertificateIssuanceFormProps {
  onSubmit: (data: CertificateFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  errors?: CertificateFormErrors;
  initialData?: Partial<CertificateFormData>;
}

const CertificateIssuanceForm: React.FC<CertificateIssuanceFormProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  initialData = {},
}) => {
  const [formData, setFormData] = useState<CertificateFormData>({
    recipientName: initialData.recipientName || "",
    recipientId: initialData.recipientId || "",
    recipientWalletAddress: initialData.recipientWalletAddress || "",
    certificateType: initialData.certificateType || "CERTIFICATION",
    courseName: initialData.courseName || "",
    completionDate: initialData.completionDate || "",
    grade: initialData.grade || "",
    credentialLevel: initialData.credentialLevel || "",
    expirationDate: initialData.expirationDate || "",
    metadata: initialData.metadata || {},
  });

  const [metadataKey, setMetadataKey] = useState("");
  const [metadataValue, setMetadataValue] = useState("");

  const certificateTypes: { value: CertificateType; label: string }[] = [
    { value: "BACHELOR", label: "Bachelor Degree" },
    { value: "MASTER", label: "Master Degree" },
    { value: "PHD", label: "PhD Degree" },
    { value: "DIPLOMA", label: "Diploma" },
    { value: "CERTIFICATION", label: "Certification" },
    { value: "PROFESSIONAL", label: "Professional Certificate" },
  ];

  // Hooks
  const { wallets } = useWallets();
  const { institution } = useInstitution();

  // Filter to get only individual wallets for recipient selection
  const recipientWallets = wallets.filter(
    (wallet) => wallet.type !== "INSTITUTION",
  );

  const handleInputChange = (
    field: keyof CertificateFormData,
    value: string,
  ) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };

      // Automatically sync recipientId with recipientWalletAddress
      if (field === "recipientWalletAddress") {
        updated.recipientId = value;
      }

      return updated;
    });
  };

  const handleAddMetadata = () => {
    if (metadataKey.trim() && metadataValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey.trim()]: metadataValue.trim(),
        },
      }));
      setMetadataKey("");
      setMetadataValue("");
    }
  };

  const handleRemoveMetadata = (key: string) => {
    setFormData((prev) => {
      const newMetadata = { ...prev.metadata };
      delete newMetadata[key];
      return {
        ...prev,
        metadata: newMetadata,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clean up form data - remove empty optional fields
    const cleanedData: CertificateFormData = {
      ...formData,
      grade: formData.grade?.trim() || undefined,
      expirationDate: formData.expirationDate || undefined,
      metadata:
        Object.keys(formData.metadata || {}).length > 0
          ? formData.metadata
          : undefined,
    };

    await onSubmit(cleanedData);
  };

  const getFieldError = (field: string) => errors[field];
  const hasError = (field: string) => !!getFieldError(field);

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Issue New Certificate
          </CardTitle>
          <CardDescription>
            Create a new educational certificate on the blockchain
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issuer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Issuing Institution
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {institution?.name || "Unknown Institution"}
                    </p>
                    <p className="text-sm text-blue-700">
                      {institution?.type || "Institution Type Unknown"}
                    </p>
                    {institution?.publicKey && (
                      <p className="text-xs text-blue-600 font-mono mt-1">
                        {institution.publicKey.slice(0, 20)}...
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Recipient Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Recipient Information
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label
                    htmlFor="recipientName"
                    className="block text-sm font-medium mb-2"
                  >
                    Recipient Name *
                  </label>
                  <Input
                    id="recipientName"
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) =>
                      handleInputChange("recipientName", e.target.value)
                    }
                    placeholder="Enter full name"
                    className={
                      hasError("recipientName") ? "border-red-500" : ""
                    }
                    required
                  />
                  {hasError("recipientName") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("recipientName")}
                    </p>
                  )}
                </div>
              </div>

              {/* Recipient Wallet Selection */}
              <div className="col-span-full">
                <label
                  htmlFor="recipientWalletAddress"
                  className="block text-sm font-medium mb-2"
                >
                  <Wallet className="inline h-4 w-4 mr-1" />
                  Recipient Wallet *
                </label>

                {recipientWallets.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      id="recipientWalletAddress"
                      value={formData.recipientWalletAddress}
                      onChange={(e) =>
                        handleInputChange(
                          "recipientWalletAddress",
                          e.target.value,
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md bg-white ${hasError("recipientWalletAddress") ? "border-red-500" : "border-gray-300"}`}
                      required
                    >
                      <option value="">Select a recipient wallet...</option>
                      {recipientWallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.publicKey}>
                          {wallet.label} ({wallet.publicKey.slice(0, 15)}...)
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-600">
                      Select from available wallets or enter a custom address
                      below
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-2">
                    No recipient wallets found. You can enter a custom wallet
                    address below.
                  </p>
                )}

                {/* Manual wallet address input as fallback */}
                <div className="mt-2">
                  <Input
                    type="text"
                    value={formData.recipientWalletAddress}
                    onChange={(e) =>
                      handleInputChange(
                        "recipientWalletAddress",
                        e.target.value,
                      )
                    }
                    placeholder="Or enter custom wallet public key address"
                    className={
                      hasError("recipientWalletAddress") ? "border-red-500" : ""
                    }
                  />
                </div>

                {hasError("recipientWalletAddress") && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("recipientWalletAddress")}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  The certificate will be issued to this wallet address
                </p>
              </div>
            </div>

            {/* Step 2: Certificate Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Certificate Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="certificateType"
                    className="block text-sm font-medium mb-2"
                  >
                    Certificate Type *
                  </label>
                  <select
                    id="certificateType"
                    value={formData.certificateType}
                    onChange={(e) =>
                      handleInputChange("certificateType", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md bg-white ${hasError("certificateType") ? "border-red-500" : "border-gray-300"}`}
                    required
                  >
                    {certificateTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {hasError("certificateType") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("certificateType")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="credentialLevel"
                    className="block text-sm font-medium mb-2"
                  >
                    Credential Level *
                  </label>
                  <Input
                    id="credentialLevel"
                    type="text"
                    value={formData.credentialLevel}
                    onChange={(e) =>
                      handleInputChange("credentialLevel", e.target.value)
                    }
                    placeholder="e.g., Bachelor of Science, Master of Arts"
                    className={
                      hasError("credentialLevel") ? "border-red-500" : ""
                    }
                    required
                  />
                  {hasError("credentialLevel") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("credentialLevel")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="courseName"
                  className="block text-sm font-medium mb-2"
                >
                  Course/Program Name *
                </label>
                <Input
                  id="courseName"
                  type="text"
                  value={formData.courseName}
                  onChange={(e) =>
                    handleInputChange("courseName", e.target.value)
                  }
                  placeholder="e.g., Computer Science, Data Science, Business Administration"
                  className={hasError("courseName") ? "border-red-500" : ""}
                  required
                />
                {hasError("courseName") && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("courseName")}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="completionDate"
                    className="block text-sm font-medium mb-2"
                  >
                    Completion Date *
                  </label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={(e) =>
                      handleInputChange("completionDate", e.target.value)
                    }
                    className={
                      hasError("completionDate") ? "border-red-500" : ""
                    }
                    required
                  />
                  {hasError("completionDate") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("completionDate")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="grade"
                    className="block text-sm font-medium mb-2"
                  >
                    Grade (Optional)
                  </label>
                  <Input
                    id="grade"
                    type="text"
                    value={formData.grade || ""}
                    onChange={(e) => handleInputChange("grade", e.target.value)}
                    placeholder="e.g., A+, 95%, Distinction"
                    className={hasError("grade") ? "border-red-500" : ""}
                  />
                  {hasError("grade") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("grade")}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="expirationDate"
                    className="block text-sm font-medium mb-2"
                  >
                    Expiration Date (Optional)
                  </label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate || ""}
                    onChange={(e) =>
                      handleInputChange("expirationDate", e.target.value)
                    }
                    className={
                      hasError("expirationDate") ? "border-red-500" : ""
                    }
                  />
                  {hasError("expirationDate") && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError("expirationDate")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Additional Metadata */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Additional Information (Optional)
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Field name (e.g., Honors, Specialization)"
                    value={metadataKey}
                    onChange={(e) => setMetadataKey(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    placeholder="Value"
                    value={metadataValue}
                    onChange={(e) => setMetadataValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddMetadata}
                    disabled={!metadataKey.trim() || !metadataValue.trim()}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.metadata &&
                  Object.keys(formData.metadata).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Added Fields:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(formData.metadata).map(
                          ([key, value]) => (
                            <Badge
                              key={key}
                              variant="secondary"
                              className="flex items-center gap-2"
                            >
                              <span>
                                {key}: {String(value)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveMetadata(key)}
                                className="ml-1 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={loading} className="min-w-32">
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Issuing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Issue Certificate
                  </div>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificateIssuanceForm;
