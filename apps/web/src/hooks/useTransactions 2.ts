import { useState, useEffect, useCallback } from 'react';
import { fetchUserTransactions, transformTransactionData } from '@/lib/api/transactions';

interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchUserTransactions(filters);

      if (response.success && response.data) {
        const transformedTransactions = response.data.transactions.map(transformTransactionData);
        setTransactions(transformedTransactions);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Erro ao carregar transações');
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError('Erro ao carregar transações');
      // Fallback to empty array if API fails
      setTransactions([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const refetch = () => {
    loadTransactions();
  };

  return {
    transactions,
    loading,
    error,
    pagination,
    refetch,
  };
}