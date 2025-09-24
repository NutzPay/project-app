'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole } from '@/types/rbac';
import { hasBackofficeAccess, canAccess } from '@/lib/rbac/permissions';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  resource?: string;
  action?: string;
  fallbackUrl?: string;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  isSeller: boolean;
}

export function RouteGuard({ 
  children, 
  requiredRole, 
  resource, 
  action,
  fallbackUrl = '/unauthorized' 
}: RouteGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAccess() {
      try {
        // Verificar token de autenticação
        const response = await fetch('/api/backoffice/auth/me', {
          credentials: 'include'
        });

        if (!response.ok) {
          router.push('/backoffice/login');
          return;
        }

        const userData = await response.json();
        setUser(userData);

        // Verificar se é seller tentando acessar backoffice
        if (userData.isSeller || !userData.isAdmin) {
          console.warn('Seller attempting to access backoffice');
          router.push('/dashboard');
          return;
        }

        // Verificar acesso geral ao backoffice
        if (!hasBackofficeAccess(userData.role)) {
          console.warn('User role does not have backoffice access');
          router.push(fallbackUrl);
          return;
        }

        // Verificar role específico se necessário
        if (requiredRole && userData.role !== requiredRole) {
          const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN];
          if (requiredRole === UserRole.OPERATIONS) {
            allowedRoles.push(UserRole.OPERATIONS);
          }
          if (requiredRole === UserRole.SUPPORT) {
            allowedRoles.push(UserRole.SUPPORT);
          }

          if (!allowedRoles.includes(userData.role)) {
            console.warn(`User role ${userData.role} not allowed for required role ${requiredRole}`);
            router.push(fallbackUrl);
            return;
          }
        }

        // Verificar permissão de recurso/ação se especificado
        if (resource) {
          const hasResourceAccess = canAccess(userData.role, resource, action);
          if (!hasResourceAccess) {
            console.warn(`User role ${userData.role} does not have access to ${resource}:${action}`);
            router.push(fallbackUrl);
            return;
          }
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Route guard error:', error);
        router.push('/backoffice/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAccess();
  }, [pathname, router, requiredRole, resource, action, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Router já está redirecionando
  }

  return <>{children}</>;
}

export function BackofficeGuard({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}

export function AdminOnlyGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole={UserRole.SUPER_ADMIN}>
      {children}
    </RouteGuard>
  );
}

export function OperationsGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole={UserRole.OPERATIONS}>
      {children}
    </RouteGuard>
  );
}

export function ResourceGuard({ 
  children, 
  resource, 
  action 
}: { 
  children: React.ReactNode;
  resource: string;
  action: string;
}) {
  return (
    <RouteGuard resource={resource} action={action}>
      {children}
    </RouteGuard>
  );
}