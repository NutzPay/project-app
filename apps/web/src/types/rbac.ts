export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN', 
  OPERATIONS = 'OPERATIONS',
  SUPPORT = 'SUPPORT',
  SELLER = 'SELLER',
  OWNER = 'OWNER',
  MEMBER = 'MEMBER'
}

export enum UserType {
  ADMIN_INTERNAL = 'ADMIN_INTERNAL',
  SELLER_EXTERNAL = 'SELLER_EXTERNAL'
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  userType: UserType;
  companyId?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  isAdmin: boolean;
  isSeller: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUser extends Omit<User, 'userType' | 'isSeller'> {
  userType: UserType.ADMIN_INTERNAL;
  isSeller: false;
  adminPermissions: AdminPermission[];
}

export interface SellerUser extends Omit<User, 'userType' | 'isAdmin'> {
  userType: UserType.SELLER_EXTERNAL;
  isAdmin: false;
  companyId: string;
}

export interface AdminPermission {
  resource: string;
  action: string;
  granted: boolean;
}

export interface BackofficePermissions {
  dashboard: boolean;
  usuarios: {
    read: boolean;
    write: boolean;
    approve: boolean;
    impersonate: boolean;
  };
  empresas: {
    read: boolean;
    write: boolean;
  };
  transacoes: {
    read: boolean;
    write: boolean;
  };
  investimentos: {
    read: boolean;
    write: boolean;
  };
  apiKeys: {
    read: boolean;
    create: boolean;
    revoke: boolean;
  };
  webhooks: {
    read: boolean;
    write: boolean;
  };
  auditoria: {
    read: boolean;
    export: boolean;
  };
  adquirentes: {
    read: boolean;
    write: boolean;
  };
  starkbank: {
    read: boolean;
    write: boolean;
  };
  destaques: {
    read: boolean;
    write: boolean;
  };
  configuracoes: {
    read: boolean;
    write: boolean;
    critical: boolean;
  };
}

export interface ImpersonationSession {
  id: string;
  adminUserId: string;
  sellerUserId: string;
  sellerEmail: string;
  sessionToken: string;
  startedAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface AuditEvent {
  id: string;
  eventType: 'LOGIN_BLOCKED' | 'ACCESS_DENIED' | 'IMPERSONATION_START' | 'IMPERSONATION_END' | 'ROLE_CONFLICT';
  userId: string;
  adminUserId?: string;
  sellerUserId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface ConflictingUser {
  id: string;
  email: string;
  name?: string;
  roles: UserRole[];
  userTypes: UserType[];
  companyId?: string;
  status: string;
  conflictReason: string;
  detectedAt: Date;
}