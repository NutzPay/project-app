'use client';

import { useState, useEffect } from 'react';
import { UserRole, BackofficePermissions } from '@/types/rbac';
import { getPermissions, canAccess } from '@/lib/rbac/permissions';

interface User {
  id: string;
  email: string;
  role: UserRole;
  isAdmin: boolean;
  isSeller: boolean;
}

interface UsePermissionsResult {
  user: User | null;
  permissions: BackofficePermissions | null;
  isLoading: boolean;
  canAccess: (resource: string, action?: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  isAdmin: boolean;
  isSeller: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<BackofficePermissions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndPermissions() {
      try {
        const response = await fetch('/api/backoffice/auth/me', {
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setPermissions(getPermissions(userData.role));
        }
      } catch (error) {
        console.error('Failed to fetch user permissions:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserAndPermissions();
  }, []);

  const canAccessResource = (resource: string, action?: string): boolean => {
    if (!user) return false;
    return canAccess(user.role, resource, action);
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  return {
    user,
    permissions,
    isLoading,
    canAccess: canAccessResource,
    hasRole,
    isAdmin: user?.isAdmin || false,
    isSeller: user?.isSeller || false,
  };
}

export function useImpersonation() {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<any>(null);

  useEffect(() => {
    // Verificar se está em modo de impersonação
    const urlParams = new URLSearchParams(window.location.search);
    const impersonationToken = urlParams.get('impersonation');
    
    if (impersonationToken) {
      setIsImpersonating(true);
      // Validar token e buscar dados do seller
      fetchImpersonatedUser(impersonationToken);
    }
  }, []);

  const fetchImpersonatedUser = async (token: string) => {
    try {
      const response = await fetch(`/api/backoffice/impersonation/validate?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setImpersonatedUser(data.seller);
      }
    } catch (error) {
      console.error('Failed to validate impersonation token:', error);
    }
  };

  const endImpersonation = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const impersonationToken = urlParams.get('impersonation');
      
      if (impersonationToken) {
        await fetch('/api/backoffice/impersonation/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: impersonationToken })
        });
        
        // Redirecionar de volta ao backoffice
        window.location.href = '/backoffice';
      }
    } catch (error) {
      console.error('Failed to end impersonation:', error);
    }
  };

  return {
    isImpersonating,
    impersonatedUser,
    endImpersonation,
  };
}