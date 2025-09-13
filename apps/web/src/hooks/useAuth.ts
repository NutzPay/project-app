import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OWNER' | 'MEMBER';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/user/profile');
      
      if (response.ok) {
        const userData = await response.json();
        if (userData.success && userData.profile) {
          setAuthState({
            user: userData.profile,
            isLoading: false,
            error: null
          });
        } else {
          throw new Error(userData.error || 'Failed to fetch user');
        }
      } else if (response.status === 401) {
        // Not authenticated
        setAuthState({
          user: null,
          isLoading: false,
          error: null
        });
      } else {
        throw new Error('Failed to fetch user');
      }
    } catch (error) {
      console.error('Auth error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthState({
        user: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshAuth = () => {
    fetchUser();
  };

  return {
    ...authState,
    logout,
    refreshAuth
  };
}