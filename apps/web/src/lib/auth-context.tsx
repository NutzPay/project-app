'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface BackofficeUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  backofficeUser: BackofficeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [backofficeUser, setBackofficeUser] = useState<BackofficeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await fetch('/api/backoffice/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setBackofficeUser(userData.user);
      }
    } catch (error) {
      console.error('Failed to check session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/backoffice/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setBackofficeUser(data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setBackofficeUser(null);
    fetch('/api/backoffice/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ backofficeUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}