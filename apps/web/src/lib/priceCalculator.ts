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
      // Use absolute URL for server-side fetch
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/crypto/coinmarketcap?convert=BRL`);
      const data = await response.json();
      
      if (data.success && data.data?.currentPrice) {
        return data.data.currentPrice;
      }
      
      throw new Error('Failed to get USDT price from CoinMarketCap');
    } catch (error) {
      console.error('Error fetching USDT price:', error);
      // Fallback para cotação aproximada
      return 5.20; // ~R$ 5.20 por USDT
    }
  }

  // Buscar taxa do seller (se logado) ou usar taxa padrão
  async getSellerFee(userId?: string): Promise<number> {
    if (!userId) {
      return 10; // Taxa padrão 10%
    }

    try {
      // Em produção, buscar do banco
      // const user = await prisma.user.findUnique({
      //   where: { id: userId },
      //   select: { exchangeRate: true, status: true }
      // });
      
      // Por enquanto, mock (você pode ajustar)
      return 10; // 10% de taxa
    } catch (error) {
      console.error('Error fetching seller fee:', error);
      return 10; // Fallback
    }
  }

  // Calcular preço com cotação + taxa do seller
  async calculatePrice(usdtAmount: number, userId?: string): Promise<PriceCalculation> {
    try {
      const [usdtPrice, sellerFeePercent] = await Promise.all([
        this.getUSDTPrice(),
        this.getSellerFee(userId)
      ]);

      // Preço base: USDT amount × cotação
      const basePrice = usdtAmount * usdtPrice;
      
      // Adicionar taxa do seller
      const sellerFee = sellerFeePercent / 100; // 10% = 0.10
      const finalPrice = basePrice * (1 + sellerFee);
      
      // Preço por USDT com taxa
      const pricePerUsdt = usdtPrice * (1 + sellerFee);

      return {
        usdtAmount,
        brlAmount: basePrice,
        usdtPrice,
        sellerFee: sellerFeePercent,
        finalPrice,
        pricePerUsdt
      };
    } catch (error) {
      console.error('Error calculating price:', error);
      throw error;
    }
  }

  // Calcular quanto USDT o usuário receberá por um valor em BRL
  async calculateUSDTAmount(brlAmount: number, userId?: string): Promise<PriceCalculation> {
    try {
      const [usdtPrice, sellerFeePercent] = await Promise.all([
        this.getUSDTPrice(),
        this.getSellerFee(userId)
      ]);

      // Preço por USDT com taxa do seller
      const sellerFee = sellerFeePercent / 100;
      const pricePerUsdt = usdtPrice * (1 + sellerFee);
      
      // Calcular quanto USDT o usuário receberá
      const usdtAmount = brlAmount / pricePerUsdt;

      return {
        usdtAmount,
        brlAmount,
        usdtPrice,
        sellerFee: sellerFeePercent,
        finalPrice: brlAmount,
        pricePerUsdt
      };
    } catch (error) {
      console.error('Error calculating USDT amount:', error);
      throw error;
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