// USDT Service - Manages data fetching, caching, and formatting
class USDTService {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private static instance: USDTService;

  static getInstance(): USDTService {
    if (!USDTService.instance) {
      USDTService.instance = new USDTService();
    }
    return USDTService.instance;
  }

  private constructor() {}

  // Cache management
  private getCacheKey(currency: string, type: 'current' | 'historical'): string {
    return `usdt_${currency.toLowerCase()}_${type}`;
  }

  private isValidCache(cacheEntry: { data: any; timestamp: number; ttl: number }): boolean {
    return Date.now() - cacheEntry.timestamp < cacheEntry.ttl;
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  private getCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry && this.isValidCache(entry)) {
      return entry.data;
    }
    this.cache.delete(key); // Remove expired cache
    return null;
  }

  // API calls with caching
  async getCurrentUSDTData(currency: 'BRL' | 'USD' = 'BRL'): Promise<any> {
    const cacheKey = this.getCacheKey(currency, 'current');
    const cachedData = this.getCache(cacheKey);
    
    if (cachedData) {
      return { success: true, data: cachedData, fromCache: true };
    }

    try {
      const response = await fetch(`/api/crypto/coinmarketcap?convert=${currency}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch USDT data`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Cache for 1 minute
        this.setCache(cacheKey, result.data, 60000);
      }
      
      return { ...result, fromCache: false };
    } catch (error) {
      console.error('Error fetching current USDT data:', error);
      throw error;
    }
  }

  async getHistoricalUSDTData(currency: 'BRL' | 'USD' = 'BRL', days: number = 365): Promise<any> {
    const cacheKey = this.getCacheKey(currency, 'historical');
    const cachedData = this.getCache(cacheKey);
    
    if (cachedData) {
      return { success: true, data: cachedData, fromCache: true };
    }

    try {
      const response = await fetch('/api/crypto/coinmarketcap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ convert: currency, days })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch historical USDT data`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Cache for 1 hour (historical data doesn't change frequently)
        this.setCache(cacheKey, result.data, 3600000);
      }
      
      return { ...result, fromCache: false };
    } catch (error) {
      console.error('Error fetching historical USDT data:', error);
      throw error;
    }
  }

  // Formatting utilities
  formatPrice(price: number, currency: 'BRL' | 'USD' = 'BRL'): string {
    const symbol = currency === 'BRL' ? 'R$' : '$';
    return `${symbol} ${price.toFixed(4)}`;
  }

  formatChange(change: number): { formatted: string; isPositive: boolean } {
    const sign = change >= 0 ? '+' : '';
    return {
      formatted: `${sign}${change.toFixed(2)}%`,
      isPositive: change >= 0
    };
  }

  formatVolume(volume: number, currency: 'BRL' | 'USD' = 'BRL'): string {
    const symbol = currency === 'BRL' ? 'R$' : '$';
    if (volume >= 1e12) {
      return `${symbol} ${(volume / 1e12).toFixed(1)}T`;
    } else if (volume >= 1e9) {
      return `${symbol} ${(volume / 1e9).toFixed(1)}B`;
    } else if (volume >= 1e6) {
      return `${symbol} ${(volume / 1e6).toFixed(1)}M`;
    } else {
      return `${symbol} ${volume.toFixed(0)}`;
    }
  }

  formatMarketCap(marketCap: number, currency: 'BRL' | 'USD' = 'BRL'): string {
    return this.formatVolume(marketCap, currency);
  }

  formatTimestamp(timestamp: string): string {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Utility to get formatted data ready for display
  async getFormattedUSDTData(currency: 'BRL' | 'USD' = 'BRL'): Promise<{
    success: boolean;
    data?: {
      price: string;
      change: { formatted: string; isPositive: boolean };
      volume: string;
      marketCap: string;
      lastUpdate: string;
      raw: any;
    };
    error?: string;
    fromCache?: boolean;
  }> {
    try {
      const result = await this.getCurrentUSDTData(currency);
      
      if (!result.success) {
        return { success: false, error: result.error || 'Failed to fetch data' };
      }

      const rawData = result.data;
      
      return {
        success: true,
        fromCache: result.fromCache,
        data: {
          price: this.formatPrice(rawData.currentPrice, currency),
          change: this.formatChange(rawData.changePercent24h),
          volume: this.formatVolume(rawData.volume24h, currency),
          marketCap: this.formatMarketCap(rawData.marketCap, currency),
          lastUpdate: rawData.lastUpdate,
          raw: rawData
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Clear all cached data
  clearCache(): void {
    this.cache.clear();
  }

  // Clear specific cache
  clearCacheForCurrency(currency: string): void {
    const currentKey = this.getCacheKey(currency, 'current');
    const historicalKey = this.getCacheKey(currency, 'historical');
    this.cache.delete(currentKey);
    this.cache.delete(historicalKey);
  }
}

// Export singleton instance
export const usdtService = USDTService.getInstance();

// Export utility functions for direct usage
export const formatUSDTPrice = (price: number, currency: 'BRL' | 'USD' = 'BRL') => 
  usdtService.formatPrice(price, currency);

export const formatUSDTChange = (change: number) => 
  usdtService.formatChange(change);

export const formatUSDTVolume = (volume: number, currency: 'BRL' | 'USD' = 'BRL') => 
  usdtService.formatVolume(volume, currency);

export const formatUSDTMarketCap = (marketCap: number, currency: 'BRL' | 'USD' = 'BRL') => 
  usdtService.formatMarketCap(marketCap, currency);