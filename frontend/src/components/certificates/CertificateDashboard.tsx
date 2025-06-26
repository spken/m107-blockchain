import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  GraduationCap, 
  Calendar, 
  Building2, 
  Search, 
  CheckCircle, 
  XCircle, 
  Eye,
  AlertTriangle
} from 'lucide-react';
import type { Certificate } from '@/types/certificates';
import { useCertificateHelpers } from '@/hooks/useCertificates';

interface CertificateDashboardProps {
  certificates: Certificate[];
  loading?: boolean;
  onSearch: (query: string) => void;
  onViewCertificate: (certificate: Certificate) => void;
  onVerifyCertificate: (certificateId: string) => void;
  searchQuery?: string;
}

const CertificateDashboard: React.FC<CertificateDashboardProps> = ({
  certificates,
  loading = false,
  onSearch,
  onViewCertificate,
  onVerifyCertificate,
  searchQuery = '',
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const { getTypeLabel, formatDate, isExpired, getDaysUntilExpiration } = useCertificateHelpers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const getStatusIcon = (certificate: Certificate) => {
    if (isExpired(certificate)) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    const daysUntilExpiration = getDaysUntilExpiration(certificate);
    if (daysUntilExpiration !== null && daysUntilExpiration <= 30) {
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = (certificate: Certificate) => {
    if (isExpired(certificate)) {
      return 'Expired';
    }
    
    const daysUntilExpiration = getDaysUntilExpiration(certificate);
    if (daysUntilExpiration !== null && daysUntilExpiration <= 30) {
      return `Expires in ${daysUntilExpiration} days`;
    }
    
    return 'Valid';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-3 bg-gray-200 rounded w-4/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex justify-end">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search certificates..."
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Certificates</p>
                <p className="text-2xl font-bold">{certificates.length}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valid Certificates</p>
                <p className="text-2xl font-bold text-green-600">
                  {certificates.filter(cert => !isExpired(cert)).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-600">
                  {certificates.filter(cert => isExpired(cert)).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">
                  {certificates.filter(cert => {
                    const days = getDaysUntilExpiration(cert);
                    return days !== null && days <= 30 && days > 0;
                  }).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certificates found</h3>
            <p className="text-gray-600">
              {searchQuery 
                ? `No certificates match your search for "${searchQuery}"`
                : "No certificates have been issued yet"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{certificate.recipientName}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3" />
                      {certificate.institutionName}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(certificate)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      {getTypeLabel(certificate.certificateType)}
                    </Badge>
                    <Badge 
                      variant={isExpired(certificate) ? "destructive" : "default"}
                    >
                      {getStatusText(certificate)}
                    </Badge>
                  </div>
                  
                  <h4 className="font-medium text-gray-900">{certificate.courseName}</h4>
                  <p className="text-sm text-gray-600">{certificate.credentialLevel}</p>
                  
                  {certificate.grade && (
                    <p className="text-sm font-medium text-blue-600">Grade: {certificate.grade}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Issued {formatDate(certificate.issueDate)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewCertificate(certificate)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onVerifyCertificate(certificate.id)}
                    className="flex-1"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Load More or Pagination could go here */}
      {certificates.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-600">
            Showing {certificates.length} certificate{certificates.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};

export default CertificateDashboard;
