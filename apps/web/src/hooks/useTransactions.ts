import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchUserTransactions, transformTransactionData } from '@/lib/api/transactions';

interface TransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
}

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Use ref to prevent infinite loops
  const isLoadingRef = useRef(false);
  const lastFiltersRef = useRef<string>('');

  const loadTransactions = useCallback(async () => {
    // Prevent concurrent requests
    if (isLoadingRef.current) {
      console.log('⏳ Request already in progress, skipping...');
      return;
    }

    // Check if filters actually changed
    const filtersString = JSON.stringify(filters || {});
    if (lastFiltersRef.current === filtersString) {
      console.log('🔄 Filters unchanged, skipping request');
      return;
    }

    try {
      isLoadingRef.current = true;
      lastFiltersRef.current = filtersString;
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

        // Set error but keep existing transactions to avoid UI flicker
        setError(`API Error: ${errorMessage}`);

        // Don't clear transactions - let the component decide fallback
      }
    } catch (err) {
      console.error('💥 Unexpected error in loadTransactions:', err);
      setError('Erro de conexão com a API');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Only reload when filters actually change (deep comparison)
  useEffect(() => {
    const filtersString = JSON.stringify(filters || {});
    if (lastFiltersRef.current !== filtersString) {
      loadTransactions();
    }
  }, [filters, loadTransactions]);

  // Initial load
  useEffect(() => {
    if (lastFiltersRef.current === '') {
      loadTransactions();
    }
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