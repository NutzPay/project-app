import { useState, useEffect, useCallback, useRef } from 'react';

interface USDTQuote {
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdate: string;
}

interface USDTHistoricalData {
  date: string;
  price: number;
  month: string;
}

interface USDTDataResult {
  data: USDTQuote | null;
  historicalData: USDTHistoricalData[];
  loading: boolean;
  error: string | null;
  isPositive: boolean;
  refetch: () => void;
  formatPrice: (price?: number) => string;
  formatChange: (change?: number) => string;
  formatVolume: (volume?: number) => string;
  formatMarketCap: (marketCap?: number) => string;
}

interface UseUSDTDataOptions {
  currency?: 'BRL' | 'USD';
  updateInterval?: number;
  enableHistorical?: boolean;
  enableAutoUpdate?: boolean;
}

export function useUSDTData(options: UseUSDTDataOptions = {}): USDTDataResult {
  const {
    currency = 'BRL',
    updateInterval = 60000, // 1 minute
    enableHistorical = true,
    enableAutoUpdate = true
  } = options;

  const [data, setData] = useState<USDTQuote | null>(null);
  const [historicalData, setHistoricalData] = useState<USDTHistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Formatting functions
  const formatPrice = useCallback((price?: number): string => {
    if (price === undefined) return '--';
    if (currency === 'BRL') {
      return `R$ ${price.toFixed(4)}`;
    }
    return `$ ${price.toFixed(4)}`;
  }, [currency]);

  const formatChange = useCallback((change?: number): string => {
    if (change === undefined) return '--';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }, []);

  const formatVolume = useCallback((volume?: number): string => {
    if (volume === undefined) return '--';
    if (currency === 'BRL') {
      return `R$ ${(volume / 1e9).toFixed(1)}B`;
    }
    return `$ ${(volume / 1e9).toFixed(1)}B`;
  }, [currency]);

  const formatMarketCap = useCallback((marketCap?: number): string => {
    if (marketCap === undefined) return '--';
    if (currency === 'BRL') {
      return `R$ ${(marketCap / 1e9).toFixed(1)}B`;
    }
    return `$ ${(marketCap / 1e9).toFixed(1)}B`;
  }, [currency]);

  const fetchUSDTData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);

      // Fetch real-time data
      const priceResponse = await fetch(`/api/crypto/coinmarketcap?convert=${currency}`);
      
      if (!priceResponse.ok) {
        throw new Error(`HTTP ${priceResponse.status}: Falha ao buscar dados USDT`);
      }
      
      const priceResult = await priceResponse.json();
      
      if (!priceResult.success) {
        throw new Error(priceResult.message || 'Erro na API CoinMarketCap');
      }

      setData(priceResult.data);

      // Fetch historical data if enabled and not already loaded
      if (enableHistorical && historicalData.length === 0) {
        try {
          const historicalResponse = await fetch('/api/crypto/coinmarketcap', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              convert: currency,
              days: 365 
            })
          });
          
          if (historicalResponse.ok) {
            const historicalResult = await historicalResponse.json();
            if (historicalResult.success && historicalResult.data.length > 0) {
              // Get monthly samples from the data
              const monthlyData = historicalResult.data.filter((_: any, index: number) => 
                index % Math.floor(historicalResult.data.length / 12) === 0
              ).slice(-12);
              
              setHistoricalData(monthlyData);
            }
          }
        } catch (histErr) {
          console.warn('Failed to fetch USDT historical data:', histErr);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar dados USDT';
      setError(errorMessage);
      console.error('USDT data fetch error:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [currency, enableHistorical, historicalData.length]);

  const refetch = useCallback(() => {
    fetchUSDTData(true);
  }, [fetchUSDTData]);

  // Initial load
  useEffect(() => {
    fetchUSDTData(true);
  }, [currency]); // Re-fetch when currency changes

  // Auto-update setup
  useEffect(() => {
    if (!enableAutoUpdate || updateInterval <= 0) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval for background updates (without loading state)
    intervalRef.current = setInterval(() => {
      fetchUSDTData(false);
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableAutoUpdate, updateInterval, fetchUSDTData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const isPositive = data ? data.changePercent24h >= 0 : false;

  return {
    data,
    historicalData,
    loading,
    error,
    isPositive,
    refetch,
    formatPrice,
    formatChange,
    formatVolume,
    formatMarketCap
  };
}

// Convenience hooks for specific currencies
export const useUSDTBRL = (options?: Omit<UseUSDTDataOptions, 'currency'>) => 
  useUSDTData({ ...options, currency: 'BRL' });

export const useUSDTUSD = (options?: Omit<UseUSDTDataOptions, 'currency'>) => 
  useUSDTData({ ...options, currency: 'USD' });

// Hook specifically for dashboard usage with optimized update intervals
export const useUSDTDashboard = () => 
  useUSDTData({ 
    currency: 'BRL',
    updateInterval: 300000, // 5 minutes for dashboard
    enableHistorical: true,
    enableAutoUpdate: true
  });

// Hook specifically for modal usage with more frequent updates
export const useUSDTModal = () => 
  useUSDTData({ 
    currency: 'BRL',
    updateInterval: 60000, // 1 minute for modal
    enableHistorical: true,
    enableAutoUpdate: true
  });