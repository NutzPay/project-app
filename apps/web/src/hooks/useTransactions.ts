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
  const [loading, setLoading] = useState(false); // Start with false to avoid flash of loading state
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
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

      console.log('🚀 Loading transactions with filters:', filters);

      const response = await fetchUserTransactions(filters);

      console.log('📋 Transaction response:', response);

      if (response.success && response.data) {
        const transformedTransactions = response.data.transactions.map(transformTransactionData);
        console.log('✅ Transformed transactions:', transformedTransactions.length);

        setTransactions(transformedTransactions);
        setPagination(response.data.pagination);
        setStats(response.data.stats || null);
        setError(null);
      } else {
        // Handle specific error cases
        const errorMessage = response.error || 'Erro desconhecido';
        console.log('❌ API error:', errorMessage);

        // For authentication errors, show friendly message but use mock data
        if (errorMessage.includes('não autenticado')) {
          setError('Para ver transações reais, faça login no sistema.');
          console.log('🔒 Using mock data due to authentication');
        } else if (errorMessage.includes('conexão')) {
          setError('Erro de conexão. Usando dados de demonstração.');
          console.log('🌐 Using mock data due to connection error');
        } else {
          setError(`${errorMessage}. Usando dados de demonstração.`);
          console.log('⚠️ Using mock data due to API error');
        }

        // Always set empty transactions on API failure to force fallback to mock
        setTransactions([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        });
        setStats(null);
      }
    } catch (err) {
      console.error('💥 Unexpected error in loadTransactions:', err);
      setError('Erro inesperado. Usando dados de demonstração.');

      // Fallback to empty array to trigger mock data
      setTransactions([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
      setStats(null);
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
    stats,
    pagination,
    refetch,
  };
}