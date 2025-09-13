'use client';

import { useState, useEffect } from 'react';

interface Acquirer {
  id: string;
  name: string;
  slug: string;
  type: 'PIX' | 'CRYPTO' | 'TRADITIONAL';
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR' | 'TESTING';
  apiConfig: string | null;
  feeConfig: string | null;
  testMode: boolean;
  supportsDeposits: boolean;
  supportsWithdrawals: boolean;
  supportsWebhooks: boolean;
  lastTestAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  description: string | null;
  logoUrl: string | null;
  documentationUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    userAcquirers: number;
    transactions: number;
  };
}

export function useAcquirers() {
  const [acquirers, setAcquirers] = useState<Acquirer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAcquirers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/backoffice/acquirers');
      const data = await response.json();

      if (data.success) {
        setAcquirers(data.acquirers);
      } else {
        setError(data.error || 'Erro ao carregar adquirentes');
      }
    } catch (err) {
      setError('Erro de conexão');
      console.error('Error fetching acquirers:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveAcquirer = async (acquirerData: Partial<Acquirer>) => {
    try {
      const response = await fetch('/api/backoffice/acquirers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(acquirerData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list
        await fetchAcquirers();
        return { success: true, acquirer: data.acquirer };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err) {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  const testAcquirer = async (acquirerId: string) => {
    try {
      const response = await fetch(`/api/backoffice/acquirers/${acquirerId}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the list to get updated status
        await fetchAcquirers();
        return data.testResult;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erro de conexão');
    }
  };

  useEffect(() => {
    fetchAcquirers();
  }, []);

  return {
    acquirers,
    loading,
    error,
    refetch: fetchAcquirers,
    saveAcquirer,
    testAcquirer
  };
}