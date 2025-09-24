interface PriceCalculation {
  usdtAmount: number;
  brlAmount: number;
  usdtPrice: number; // Cotação USDT em BRL
  sellerFee: number; // Taxa do seller em %
  finalPrice: number; // Preço final com taxa
  pricePerUsdt: number; // Preço por USDT
}

export class PriceCalculatorService {
  
  // Buscar cotação USDT/BRL da CoinMarketCap
  async getUSDTPrice(): Promise<number> {
    try {
      // Para client-side, tentar fetch relativo
      const apiUrl = typeof window !== 'undefined'
        ? '/api/crypto/coinmarketcap?convert=BRL'
        : `http://localhost:3000/api/crypto/coinmarketcap?convert=BRL`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        // Timeout para evitar travamentos
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data?.currentPrice) {
        console.log('📈 USDT price fetched:', data.data.currentPrice);
        return data.data.currentPrice;
      }

      throw new Error('Invalid response format from CoinMarketCap API');
    } catch (error) {
      console.warn('⚠️ Failed to fetch live USDT price, using fallback:', error);
      // Fallback seguro - sempre retorna um valor válido
      return 5.42; // R$ 5.42 por USDT (taxa fixa)
    }
  }

  // Buscar taxa do seller (se logado) ou usar taxa padrão
  async getSellerFee(userId?: string): Promise<{percentFee: number, fixedFee: number}> {
    if (!userId) {
      return { percentFee: 0.02, fixedFee: 0.10 }; // Taxa padrão 2% + R$ 0,10
    }

    try {
      // Importar dinamicamente para evitar circular imports
      const { getSellerFees } = await import('./fee-calculator');
      const sellerFees = await getSellerFees(userId);

      if (sellerFees) {
        return {
          percentFee: (sellerFees.exchangeRateFeePercent || 0) + (sellerFees.usdtPurchaseFeePercent || 0),
          fixedFee: (sellerFees.exchangeRateFeeFixed || 0) + (sellerFees.usdtPurchaseFeeFixed || 0)
        };
      }

      return { percentFee: 0.02, fixedFee: 0.10 }; // Taxa padrão
    } catch (error) {
      console.error('Error fetching seller fee:', error);
      return { percentFee: 0.02, fixedFee: 0.10 }; // Fallback
    }
  }

  // Calcular preço com cotação + taxa do seller
  async calculatePrice(usdtAmount: number, userId?: string): Promise<PriceCalculation> {
    try {
      const [usdtPrice, sellerFees] = await Promise.all([
        this.getUSDTPrice().catch(() => 5.42), // Fallback seguro
        this.getSellerFee(userId).catch(() => ({ percentFee: 0.02, fixedFee: 0.10 }))
      ]);

      // Preço base: USDT amount × cotação
      const basePrice = usdtAmount * usdtPrice;

      // Adicionar taxas do seller (percentual + fixa)
      const percentageFee = basePrice * sellerFees.percentFee;
      const finalPrice = basePrice + percentageFee + sellerFees.fixedFee;

      // Preço por USDT com taxa
      const pricePerUsdt = finalPrice / usdtAmount;

      return {
        usdtAmount,
        brlAmount: basePrice,
        usdtPrice,
        sellerFee: sellerFees.percentFee * 100, // Converter para % para compatibilidade
        finalPrice,
        pricePerUsdt
      };
    } catch (error) {
      console.error('Error calculating price, using fallback values:', error);
      // Fallback completo para garantir que sempre funcione
      const fallbackPrice = usdtAmount * 5.42; // Taxa fixa
      return {
        usdtAmount,
        brlAmount: fallbackPrice,
        usdtPrice: 5.42,
        sellerFee: 2,
        finalPrice: fallbackPrice,
        pricePerUsdt: 5.42
      };
    }
  }

  // Calcular quanto USDT o usuário receberá por um valor em BRL
  async calculateUSDTAmount(brlAmount: number, userId?: string): Promise<PriceCalculation> {
    try {
      const [usdtPrice, sellerFees] = await Promise.all([
        this.getUSDTPrice().catch(() => 5.42),
        this.getSellerFee(userId).catch(() => ({ percentFee: 0.02, fixedFee: 0.10 }))
      ]);

      // Subtrair taxa fixa primeiro
      const brlAmountAfterFixedFee = Math.max(0, brlAmount - sellerFees.fixedFee);

      // Calcular preço por USDT com taxa percentual
      const pricePerUsdtWithFee = usdtPrice * (1 + sellerFees.percentFee);

      // Calcular quanto USDT o usuário receberá
      const usdtAmount = brlAmountAfterFixedFee / pricePerUsdtWithFee;

      return {
        usdtAmount,
        brlAmount,
        usdtPrice,
        sellerFee: sellerFees.percentFee * 100, // Converter para % para compatibilidade
        finalPrice: brlAmount,
        pricePerUsdt: pricePerUsdtWithFee
      };
    } catch (error) {
      console.error('Error calculating USDT amount, using fallback:', error);
      // Fallback seguro
      const fallbackUsdt = brlAmount / 5.42;
      return {
        usdtAmount: fallbackUsdt,
        brlAmount,
        usdtPrice: 5.42,
        sellerFee: 2,
        finalPrice: brlAmount,
        pricePerUsdt: 5.42
      };
    }
  }

  // Calcular quanto BRL o usuário receberá por uma quantidade de USDT (USDT → BRL)
  async calculateBRLAmount(usdtAmount: number, userId?: string): Promise<PriceCalculation> {
    try {
      const [usdtPrice, sellerFees] = await Promise.all([
        this.getUSDTPrice().catch(() => 5.42),
        this.getSellerFee(userId).catch(() => ({ percentFee: 0.02, fixedFee: 0.10 }))
      ]);

      // Para converter USDT → BRL, aplicamos desconto da taxa (não acréscimo)
      // O usuário receberá menos BRL devido à taxa de câmbio
      const pricePerUsdt = usdtPrice * (1 - sellerFees.percentFee);

      // Calcular BRL base e descontar taxa fixa
      const baseBrlAmount = usdtAmount * pricePerUsdt;
      const brlAmount = Math.max(0, baseBrlAmount - sellerFees.fixedFee);

      return {
        usdtAmount,
        brlAmount,
        usdtPrice,
        sellerFee: sellerFees.percentFee * 100, // Converter para % para compatibilidade
        finalPrice: brlAmount,
        pricePerUsdt
      };
    } catch (error) {
      console.error('Error calculating BRL amount, using fallback:', error);
      // Fallback seguro
      const fallbackBrl = usdtAmount * 5.42;
      return {
        usdtAmount,
        brlAmount: fallbackBrl,
        usdtPrice: 5.42,
        sellerFee: 2,
        finalPrice: fallbackBrl,
        pricePerUsdt: 5.42
      };
    }
  }

  // Formatar preço para exibição
  formatPrice(price: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }

  // Formatar USDT para exibição
  formatUSDT(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(amount) + ' USDT';
  }
}

// Singleton
export const priceCalculator = new PriceCalculatorService();