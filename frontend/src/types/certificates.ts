// Certificate-related types for the educational certificate blockchain

export interface Certificate {
  id: string;
  recipientName: string;
  recipientId: string;
  institutionName: string;
  institutionPublicKey: string;
  certificateType: CertificateType;
  courseName: string;
  issueDate: string;
  completionDate: string;
  grade?: string;
  credentialLevel: string;
  expirationDate?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  signature: string;
  hash: string;
}

export type CertificateType = 
  | "BACHELOR"
  | "MASTER" 
  | "PHD"
  | "DIPLOMA"
  | "CERTIFICATION"
  | "PROFESSIONAL";

export type CertificateStatus = 
  | "VALID"
  | "INVALID"
  | "EXPIRED"
  | "REVOKED"
  | "NOT_FOUND"
  | "ERROR";

export interface CertificateVerification {
  valid: boolean;
  status: CertificateStatus;
  message: string;
  certificate?: Certificate;
}

export interface Institution {
  name: string;
  type: InstitutionType;
  publicKey: string;
  authorized: boolean;
  registrationDate: string;
  certificatesIssued: number;
  lastActivity: string;
}

export type InstitutionType = 
  | "UNIVERSITY"
  | "VOCATIONAL_SCHOOL"
  | "CERTIFICATION_PROVIDER";

export interface CertificateTransaction {
  id: string;
  type: TransactionType;
  fromAddress: string;
  toAddress?: string;
  payload: any;
  fee: number;
  timestamp: string;
  signature?: string;
  hash: string;
  isValid?: boolean;
  validationError?: string;
  certificate?: {
    id: string;
    recipientName: string;
    institutionName: string;
    certificateType: CertificateType;
    courseName: string;
  };
  verification?: {
    certificateId: string;
    result: CertificateVerification;
  };
  revocation?: {
    certificateId: string;
    reason: string;
  };
}

export type TransactionType = 
  | "CERTIFICATE_ISSUANCE"
  | "CERTIFICATE_VERIFICATION"
  | "CERTIFICATE_REVOCATION"
  | "MINING_REWARD";

export interface Block {
  timestamp: string;
  transactions: any[];
  previousHash: string;
  nonce: number;
  hash: string;
  index?: number;
}

export interface BlockchainStats {
  totalBlocks: number;
  totalTransactions: number;
  totalCertificates: number;
  validCertificates: number;
  revokedCertificates: number;
  totalInstitutions: number;
  authorizedValidators: number;
  institutionStats: Institution[];
}

export interface NetworkStatus {
  currentNodeUrl: string;
  networkNodes: string[];
  institution?: Institution;
  nodeId: string;
}

// Form interfaces for creating certificates
export interface CertificateFormData {
  recipientName: string;
  recipientId: string;
  certificateType: CertificateType;
  courseName: string;
  completionDate: string;
  grade?: string;
  credentialLevel: string;
  expirationDate?: string;
  metadata?: Record<string, any>;
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  details?: string[];
  data?: T;
}

export interface CertificateApiResponse extends ApiResponse {
  certificate?: Certificate;
  transaction?: CertificateTransaction;
}

export interface BlockApiResponse extends ApiResponse {
  block?: Block;
  note?: string;
}

export interface ConsensusResponse extends ApiResponse {
  note: string;
  chain: Block[];
}

// Search and filter types
export interface CertificateSearchParams {
  q?: string;
  institution?: string;
  recipient?: string;
  type?: CertificateType;
  status?: CertificateStatus;
}

export interface CertificateListItem {
  id: string;
  recipientName: string;
  institutionName: string;
  certificateType: CertificateType;
  courseName: string;
  issueDate: string;
  status: CertificateStatus;
  isExpired?: boolean;
}

// Dashboard data types
export interface DashboardData {
  recentCertificates: CertificateListItem[];
  stats: BlockchainStats;
  institutionInfo?: Institution;
  networkStatus: NetworkStatus;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'certificate_issued' | 'certificate_verified' | 'certificate_revoked' | 'block_mined';
  timestamp: string;
  description: string;
  data?: any;
}

// Certificate display modes
export type CertificateViewMode = 'card' | 'list' | 'detailed';

// Filter and sort options
export interface FilterOptions {
  status: CertificateStatus[];
  types: CertificateType[];
  institutions: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface SortOptions {
  field: 'issueDate' | 'recipientName' | 'institutionName' | 'certificateType';
  direction: 'asc' | 'desc';
}

// Error types
export interface ValidationError {
  field: string;
  message: string;
}

export interface CertificateFormErrors {
  [field: string]: string;
}

// Hooks and state types
export interface UseCertificatesState {
  certificates: Certificate[];
  loading: boolean;
  error: string | null;
  searchParams: CertificateSearchParams;
  filters: FilterOptions;
  sort: SortOptions;
}

export interface UseBlockchainState {
  blocks: Block[];
  stats: BlockchainStats | null;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

export interface UseInstitutionState {
  institution: Institution | null;
  networkStatus: NetworkStatus | null;
  loading: boolean;
  error: string | null;
}

// Component prop types
export interface CertificateCardProps {
  certificate: Certificate;
  showActions?: boolean;
  onVerify?: (certificateId: string) => void;
  onRevoke?: (certificateId: string, reason: string) => void;
  onView?: (certificate: Certificate) => void;
}

export interface CertificateFormProps {
  onSubmit: (data: CertificateFormData) => Promise<void>;
  loading?: boolean;
  initialData?: Partial<CertificateFormData>;
  errors?: CertificateFormErrors;
}

export interface VerificationResultProps {
  verification: CertificateVerification;
  certificateId: string;
  showDetails?: boolean;
}

// Modal and dialog types
export interface CertificateModalState {
  isOpen: boolean;
  mode: 'view' | 'create' | 'verify' | 'revoke';
  certificate?: Certificate;
  data?: any;
}

// Table column types for certificate display
export interface CertificateTableColumn {
  key: keyof Certificate | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, certificate: Certificate) => React.ReactNode;
  width?: string;
}

// Institution management types
export interface InstitutionPermissions {
  canIssueCertificates: boolean;
  canRevokeCertificates: boolean;
  canVerifyCertificates: boolean;
  canMineBlocks: boolean;
}

// Export utility types
export type CertificateFieldKey = keyof Certificate;
export type InstitutionFieldKey = keyof Institution;
export type TransactionFieldKey = keyof CertificateTransaction;
