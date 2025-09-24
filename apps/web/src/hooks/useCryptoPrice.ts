import { useState, useEffect, useCallback } from 'react';

interface CryptoPriceData {
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  lastUpdate: string;
  volume24h?: number;
  marketCap?: number;
  error?: string;
}

interface HistoricalData {
  date: string;
  price: number;
  month: string;
}

interface UseCryptoPriceResult {
  data: CryptoPriceData | null;
  historicalData: HistoricalData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseCryptoPriceOptions {
  coin?: string;
  vsCurrency?: string;
  updateInterval?: number;
  enableHistorical?: boolean;
}

export function useCryptoPrice(options: UseCryptoPriceOptions = {}): UseCryptoPriceResult {
  const {
    coin = 'tether',
    vsCurrency = 'brl',
    updateInterval = 300000, // 5 minutes
    enableHistorical = true
  } = options;

  const [data, setData] = useState<CryptoPriceData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development - replace with actual API calls
  const generateMockData = useCallback((): CryptoPriceData => {
    const basePrice = coin === 'tether' ? 5.42 : 1.0;
    const variation = (Math.random() - 0.5) * 0.1;
    const change24h = variation;
    const changePercent24h = (variation / basePrice) * 100;

    return {
      currentPrice: basePrice + variation,
      change24h,
      changePercent24h,
      lastUpdate: new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      volume24h: Math.random() * 1000000,
      marketCap: Math.random() * 100000000
    };
  }, [coin]);

  const generateMockHistoricalData = useCallback((): HistoricalData[] => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const currentDate = new Date();
    const historicalData: HistoricalData[] = [];
    const basePrice = coin === 'tether' ? 4.96 : 1.0;

    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      
      const priceVariation = Math.sin(i * 0.5) * 0.3 + Math.random() * 0.2;
      const price = basePrice + priceVariation;

      historicalData.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(price, 0.1), // Ensure positive price
        month: `${months[date.getMonth()]} ${date.getFullYear()}`
      });
    }

    return historicalData;
  }, [coin]);

  const fetchCryptoData = useCallback(async () => {
    try {
      setError(null);
      
      // Use CoinMarketCap API for USDT, fallback to mock for other coins
      if (coin === 'tether') {
        const convertCurrency = vsCurrency.toUpperCase();
        
        // Fetch real-time data
        const priceResponse = await fetch(`/api/crypto/coinmarketcap?convert=${convertCurrency}`);
        
        if (!priceResponse.ok) {
          throw new Error('Falha ao buscar dados de preço do CoinMarketCap');
        }
        
        const priceResult = await priceResponse.json();
        
        if (priceResult.success) {
          setData(priceResult.data);
        } else {
          throw new Error(priceResult.message || 'Erro nos dados do CoinMarketCap');
        }

        // Fetch historical data if enabled
        if (enableHistorical) {
          try {
            const historicalResponse = await fetch('/api/crypto/coinmarketcap', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                convert: convertCurrency,
                days: 365 // Last year of data
              })
            });
            
            if (historicalResponse.ok) {
              const historicalResult = await historicalResponse.json();
              if (historicalResult.success) {
                // Sample data to get monthly intervals (take every 30th day approximately)
                const sampledData = historicalResult.data.filter((_: any, index: number) => 
                  index % 30 === 0 || index === historicalResult.data.length - 1
                );
                setHistoricalData(sampledData);
              } else {
                // Fallback to mock historical data
                setHistoricalData(generateMockHistoricalData());
              }
            } else {
              setHistoricalData(generateMockHistoricalData());
            }
          } catch (histErr) {
            console.warn('Failed to fetch historical data, using mock:', histErr);
            setHistoricalData(generateMockHistoricalData());
          }
        }
      } else {
        // For other coins, use mock data (can be extended later)
        setData(generateMockData());
        if (enableHistorical) {
          setHistoricalData(generateMockHistoricalData());
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Crypto data fetch error:', err);
      
      // Fallback to mock data on error
      setData(generateMockData());
      if (enableHistorical) {
        setHistoricalData(generateMockHistoricalData());
      }
    } finally {
      setLoading(false);
    }
  }, [coin, vsCurrency, enableHistorical, generateMockData, generateMockHistoricalData]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchCryptoData();
  }, [fetchCryptoData]);

  useEffect(() => {
    // Initial load
    setLoading(true);
    fetchCryptoData();

    // Set up periodic updates
    if (updateInterval > 0) {
      const interval = setInterval(() => {
        fetchCryptoData();
      }, updateInterval);
      return () => clearInterval(interval);
    }
  }, []); // Remove dependencies to avoid loops

  return {
    data,
    historicalData,
    loading,
    error,
    refetch
  };
}

// Convenience hooks for specific cryptocurrencies
export const useUSDTPrice = (options?: Omit<UseCryptoPriceOptions, 'coin'>) => 
  useCryptoPrice({ ...options, coin: 'tether' });

export const useBitcoinPrice = (options?: Omit<UseCryptoPriceOptions, 'coin'>) => 
  useCryptoPrice({ ...options, coin: 'bitcoin' });

export const useEthereumPrice = (options?: Omit<UseCryptoPriceOptions, 'coin'>) => 
  useCryptoPrice({ ...options, coin: 'ethereum' });