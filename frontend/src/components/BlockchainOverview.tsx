import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorFallback, LoadingSpinner } from "@/components/ui/error-fallback";
import { useBlockchain } from "@/hooks/useBlockchain";
import { useState } from "react";
import { RefreshCw, Shield, AlertCircle, CheckCircle } from "lucide-react";

export function BlockchainOverview() {
  const { blocks, stats, loading, error, refresh } = useBlockchain();
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message?: string;
  } | null>(null);

  try {
    const handleValidate = async () => {
      try {
        setValidating(true);
        // Simple validation based on blocks
        const isValid =
          blocks.length > 0 &&
          blocks.every(
            (block) => block.hash && block.previousHash !== undefined,
          );
        setValidationResult({
          isValid,
          message: isValid
            ? "Blockchain is valid"
            : "Blockchain validation failed",
        });
      } catch (err) {
        setValidationResult({
          isValid: false,
          message: "Validation error occurred",
        });
      } finally {
        setValidating(false);
      }
    };

    if (loading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return <ErrorFallback error={error} onRetry={refresh} />;
    }

    if (!blocks || !Array.isArray(blocks)) {
      return (
        <ErrorFallback error="No blockchain data available" onRetry={refresh} />
      );
    }

    const latestBlock = blocks.length > 0 ? blocks[blocks.length - 1] : null;
    const totalTransactions = blocks.reduce((sum: number, block: any) => {
      return sum + (block.transactions?.length || 0);
    }, 0);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Blockchain Overview</h2>
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
              onClick={handleValidate}
              variant="outline"
              size="sm"
              disabled={validating}
            >
              <Shield className="w-4 h-4 mr-1" />
              Validate
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Blocks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{blocks.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Mining Difficulty
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Certificates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalCertificates || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Latest Block
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {latestBlock ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Index:</span>
                    <span className="font-mono">{latestBlock.index || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Hash:</span>
                    <span className="font-mono text-xs">
                      {latestBlock.hash?.slice(0, 16)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Transactions:</span>
                    <span>{latestBlock.transactions?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Timestamp:</span>
                    <span className="text-xs">
                      {latestBlock.timestamp
                        ? new Date(latestBlock.timestamp).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-500">
                  No blocks available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Blockchain Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">
                  Total Transactions:
                </span>
                <span>{totalTransactions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Chain Length:</span>
                <span>{blocks.length}</span>
              </div>
              {validationResult && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
                  {validationResult.isValid ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="text-sm">{validationResult.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Blocks</CardTitle>
            <CardDescription>
              Last {Math.min(10, blocks.length)} blocks in the chain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blocks
                .slice(-10)
                .reverse()
                .map((block: any, index: number) => (
                  <div
                    key={block.hash || index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        #{block.index !== undefined ? block.index : "N/A"}
                      </Badge>
                      <div>
                        <div className="font-mono text-sm">
                          {block.hash?.slice(0, 16)}...
                        </div>
                        <div className="text-xs text-gray-500">
                          {block.transactions?.length || 0} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {block.timestamp
                        ? new Date(block.timestamp).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                ))}
              {blocks.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No blocks in the chain yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (err) {
    return (
      <ErrorFallback
        error={err instanceof Error ? err.message : "Unknown error"}
        onRetry={refresh}
      />
    );
  }
}
