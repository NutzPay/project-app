import { UserRole, BackofficePermissions } from '@/types/rbac';

export const ROLE_PERMISSIONS: Record<UserRole, BackofficePermissions> = {
  [UserRole.SUPER_ADMIN]: {
    dashboard: true,
    usuarios: {
      read: true,
      write: true,
      approve: true,
      impersonate: true,
    },
    empresas: {
      read: true,
      write: true,
    },
    transacoes: {
      read: true,
      write: true,
    },
    investimentos: {
      read: true,
      write: true,
    },
    apiKeys: {
      read: true,
      create: true,
      revoke: true,
    },
    webhooks: {
      read: true,
      write: true,
    },
    auditoria: {
      read: true,
      export: true,
    },
    adquirentes: {
      read: true,
      write: true,
    },
    starkbank: {
      read: true,
      write: true,
    },
    destaques: {
      read: true,
      write: true,
    },
    configuracoes: {
      read: true,
      write: true,
      critical: true,
    },
  },
  
  [UserRole.ADMIN]: {
    dashboard: true,
    usuarios: {
      read: true,
      write: true,
      approve: true,
      impersonate: true,
    },
    empresas: {
      read: true,
      write: true,
    },
    transacoes: {
      read: true,
      write: true,
    },
    investimentos: {
      read: true,
      write: true,
    },
    apiKeys: {
      read: true,
      create: true,
      revoke: true,
    },
    webhooks: {
      read: true,
      write: true,
    },
    auditoria: {
      read: true,
      export: true,
    },
    adquirentes: {
      read: true,
      write: true,
    },
    starkbank: {
      read: true,
      write: true,
    },
    destaques: {
      read: true,
      write: true,
    },
    configuracoes: {
      read: true,
      write: true,
      critical: false,
    },
  },

  [UserRole.OPERATIONS]: {
    dashboard: true,
    usuarios: {
      read: true,
      write: true,
      approve: true,
      impersonate: false,
    },
    empresas: {
      read: true,
      write: true,
    },
    transacoes: {
      read: true,
      write: false,
    },
    investimentos: {
      read: true,
      write: true,
    },
    apiKeys: {
      read: true,
      create: false,
      revoke: false,
    },
    webhooks: {
      read: true,
      write: true,
    },
    auditoria: {
      read: true,
      export: false,
    },
    adquirentes: {
      read: true,
      write: false,
    },
    starkbank: {
      read: true,
      write: false,
    },
    destaques: {
      read: true,
      write: true,
    },
    configuracoes: {
      read: true,
      write: false,
      critical: false,
    },
  },

  [UserRole.SUPPORT]: {
    dashboard: true,
    usuarios: {
      read: true,
      write: false,
      approve: false,
      impersonate: false,
    },
    empresas: {
      read: true,
      write: false,
    },
    transacoes: {
      read: true,
      write: false,
    },
    investimentos: {
      read: true,
      write: false,
    },
    apiKeys: {
      read: true,
      create: false,
      revoke: false,
    },
    webhooks: {
      read: true,
      write: false,
    },
    auditoria: {
      read: true,
      export: false,
    },
    adquirentes: {
      read: true,
      write: false,
    },
    starkbank: {
      read: true,
      write: false,
    },
    destaques: {
      read: true,
      write: false,
    },
    configuracoes: {
      read: true,
      write: false,
      critical: false,
    },
  },

  // Sellers não têm acesso ao backoffice
  [UserRole.SELLER]: {
    dashboard: false,
    usuarios: {
      read: false,
      write: false,
      approve: false,
      impersonate: false,
    },
    empresas: {
      read: false,
      write: false,
    },
    transacoes: {
      read: false,
      write: false,
    },
    investimentos: {
      read: false,
      write: false,
    },
    apiKeys: {
      read: false,
      create: false,
      revoke: false,
    },
    webhooks: {
      read: false,
      write: false,
    },
    auditoria: {
      read: false,
      export: false,
    },
    adquirentes: {
      read: false,
      write: false,
    },
    starkbank: {
      read: false,
      write: false,
    },
    destaques: {
      read: false,
      write: false,
    },
    configuracoes: {
      read: false,
      write: false,
      critical: false,
    },
  },

  [UserRole.OWNER]: {
    dashboard: false,
    usuarios: {
      read: false,
      write: false,
      approve: false,
      impersonate: false,
    },
    empresas: {
      read: false,
      write: false,
    },
    transacoes: {
      read: false,
      write: false,
    },
    investimentos: {
      read: false,
      write: false,
    },
    apiKeys: {
      read: false,
      create: false,
      revoke: false,
    },
    webhooks: {
      read: false,
      write: false,
    },
    auditoria: {
      read: false,
      export: false,
    },
    adquirentes: {
      read: false,
      write: false,
    },
    starkbank: {
      read: false,
      write: false,
    },
    destaques: {
      read: false,
      write: false,
    },
    configuracoes: {
      read: false,
      write: false,
      critical: false,
    },
  },

  [UserRole.MEMBER]: {
    dashboard: false,
    usuarios: {
      read: false,
      write: false,
      approve: false,
      impersonate: false,
    },
    empresas: {
      read: false,
      write: false,
    },
    transacoes: {
      read: false,
      write: false,
    },
    investimentos: {
      read: false,
      write: false,
    },
    apiKeys: {
      read: false,
      create: false,
      revoke: false,
    },
    webhooks: {
      read: false,
      write: false,
    },
    auditoria: {
      read: false,
      export: false,
    },
    adquirentes: {
      read: false,
      write: false,
    },
    starkbank: {
      read: false,
      write: false,
    },
    destaques: {
      read: false,
      write: false,
    },
    configuracoes: {
      read: false,
      write: false,
      critical: false,
    },
  },
};

export const ADMIN_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS, UserRole.SUPPORT];
export const SELLER_ROLES = [UserRole.SELLER, UserRole.OWNER, UserRole.MEMBER];

export function hasBackofficeAccess(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export function getPermissions(role: UserRole): BackofficePermissions {
  return ROLE_PERMISSIONS[role];
}

export function canAccess(role: UserRole, resource: string, action?: string): boolean {
  const permissions = getPermissions(role);
  
  if (!permissions[resource as keyof BackofficePermissions]) {
    return false;
  }
  
  const resourcePermissions = permissions[resource as keyof BackofficePermissions];
  
  if (typeof resourcePermissions === 'boolean') {
    return resourcePermissions;
  }
  
  if (action && typeof resourcePermissions === 'object') {
    return resourcePermissions[action as keyof typeof resourcePermissions] || false;
  }
  
  return false;
}

export function validateRoleConflict(roles: UserRole[]): { hasConflict: boolean; conflictReason?: string } {
  const adminRoles = roles.filter(role => ADMIN_ROLES.includes(role));
  const sellerRoles = roles.filter(role => SELLER_ROLES.includes(role));
  
  if (adminRoles.length > 0 && sellerRoles.length > 0) {
    return {
      hasConflict: true,
      conflictReason: `User has both Admin roles (${adminRoles.join(', ')}) and Seller roles (${sellerRoles.join(', ')})`
    };
  }
  
  return { hasConflict: false };
}