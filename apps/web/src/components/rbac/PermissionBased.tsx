'use client';

import { ReactNode } from 'react';
import { UserRole } from '@/types/rbac';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionBasedProps {
  children: ReactNode;
  resource?: string;
  action?: string;
  role?: UserRole;
  roles?: UserRole[];
  fallback?: ReactNode;
  requireAll?: boolean;
}

export function PermissionBased({
  children,
  resource,
  action,
  role,
  roles,
  fallback = null,
  requireAll = false
}: PermissionBasedProps) {
  const { user, canAccess, hasRole, isLoading } = usePermissions();

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!user) {
    return <>{fallback}</>;
  }

  // Verificar permissão de recurso/ação
  if (resource) {
    const hasAccess = canAccess(resource, action);
    if (!hasAccess) {
      return <>{fallback}</>;
    }
  }

  // Verificar role específico
  if (role) {
    const hasRequiredRole = hasRole(role);
    if (!hasRequiredRole) {
      return <>{fallback}</>;
    }
  }

  // Verificar múltiplos roles
  if (roles && roles.length > 0) {
    const hasAnyRole = roles.some(r => hasRole(r));
    const hasAllRoles = roles.every(r => hasRole(r));
    
    const hasRequiredRoles = requireAll ? hasAllRoles : hasAnyRole;
    if (!hasRequiredRoles) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

export function ShowForAdmins({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionBased 
      roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]} 
      fallback={fallback}
    >
      {children}
    </PermissionBased>
  );
}

export function ShowForSuperAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionBased role={UserRole.SUPER_ADMIN} fallback={fallback}>
      {children}
    </PermissionBased>
  );
}

export function ShowForOperations({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionBased 
      roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS]} 
      fallback={fallback}
    >
      {children}
    </PermissionBased>
  );
}

export function ShowForSupport({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionBased 
      roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.SUPPORT]} 
      fallback={fallback}
    >
      {children}
    </PermissionBased>
  );
}

export function HideForSellers({ children }: { children: ReactNode }) {
  const { isSeller } = usePermissions();
  
  if (isSeller) {
    return null;
  }
  
  return <>{children}</>;
}

export function ActionButton({ 
  children, 
  resource, 
  action, 
  role,
  onClick,
  className = '',
  disabled = false,
  ...props 
}: {
  children: ReactNode;
  resource?: string;
  action?: string;
  role?: UserRole;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}) {
  return (
    <PermissionBased 
      resource={resource} 
      action={action} 
      role={role}
      fallback={
        <button 
          className={`${className} opacity-50 cursor-not-allowed`}
          disabled={true}
          {...props}
        >
          {children}
        </button>
      }
    >
      <button 
        onClick={onClick}
        className={className}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </PermissionBased>
  );
}

export function ImpersonateButton({ 
  sellerUserId, 
  sellerEmail,
  className = "inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
}: { 
  sellerUserId: string;
  sellerEmail: string;
  className?: string;
}) {
  const handleImpersonate = async () => {
    try {
      const response = await fetch('/api/backoffice/impersonation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerUserId, sellerEmail }),
        credentials: 'include'
      });

      if (response.ok) {
        const { dashboardUrl } = await response.json();
        window.open(dashboardUrl, '_blank');
      } else {
        const error = await response.json();
        alert(`Erro ao iniciar impersonação: ${error.message}`);
      }
    } catch (error) {
      console.error('Impersonation error:', error);
      alert('Erro ao iniciar impersonação');
    }
  };

  return (
    <PermissionBased resource="usuarios" action="impersonate">
      <button
        onClick={handleImpersonate}
        className={className}
        title={`Acessar dashboard como ${sellerEmail}`}
      >
        Acessar conta do seller
      </button>
    </PermissionBased>
  );
}