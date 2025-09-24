import { prisma } from '@/lib/prisma';

export interface SellerFees {
  exchangeRateFeePercent?: number;
  exchangeRateFeeFixed?: number;
  pixPayinFeePercent?: number;
  pixPayinFeeFixed?: number;
  pixPayoutFeePercent?: number;
  pixPayoutFeeFixed?: number;
  manualWithdrawFeePercent?: number;
  manualWithdrawFeeFixed?: number;
  usdtPurchaseFeePercent?: number;
  usdtPurchaseFeeFixed?: number;
}

export interface FeeCalculationResult {
  originalAmount: number;
  feeAmount: number;
  finalAmount: number;
  feeBreakdown: {
    percentageFee: number;
    fixedFee: number;
  };
}

/**
 * Get seller fees from database
 */
export async function getSellerFees(sellerId: string): Promise<SellerFees | null> {
  try {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        exchangeRateFeePercent: true,
        exchangeRateFeeFixed: true,
        pixPayinFeePercent: true,
        pixPayinFeeFixed: true,
        pixPayoutFeePercent: true,
        pixPayoutFeeFixed: true,
        manualWithdrawFeePercent: true,
        manualWithdrawFeeFixed: true,
        usdtPurchaseFeePercent: true,
        usdtPurchaseFeeFixed: true,
      },
    });

    if (!seller) {
      return null;
    }

    return {
      exchangeRateFeePercent: seller.exchangeRateFeePercent ? parseFloat(seller.exchangeRateFeePercent.toString()) : undefined,
      exchangeRateFeeFixed: seller.exchangeRateFeeFixed ? parseFloat(seller.exchangeRateFeeFixed.toString()) : undefined,
      pixPayinFeePercent: seller.pixPayinFeePercent ? parseFloat(seller.pixPayinFeePercent.toString()) : undefined,
      pixPayinFeeFixed: seller.pixPayinFeeFixed ? parseFloat(seller.pixPayinFeeFixed.toString()) : undefined,
      pixPayoutFeePercent: seller.pixPayoutFeePercent ? parseFloat(seller.pixPayoutFeePercent.toString()) : undefined,
      pixPayoutFeeFixed: seller.pixPayoutFeeFixed ? parseFloat(seller.pixPayoutFeeFixed.toString()) : undefined,
      manualWithdrawFeePercent: seller.manualWithdrawFeePercent ? parseFloat(seller.manualWithdrawFeePercent.toString()) : undefined,
      manualWithdrawFeeFixed: seller.manualWithdrawFeeFixed ? parseFloat(seller.manualWithdrawFeeFixed.toString()) : undefined,
      usdtPurchaseFeePercent: seller.usdtPurchaseFeePercent ? parseFloat(seller.usdtPurchaseFeePercent.toString()) : undefined,
      usdtPurchaseFeeFixed: seller.usdtPurchaseFeeFixed ? parseFloat(seller.usdtPurchaseFeeFixed.toString()) : undefined,
    };
  } catch (error) {
    console.error('Error getting seller fees:', error);
    return null;
  }
}

/**
 * Calculate PIX Pay-in fee (desconta a taxa do valor recebido)
 */
export function calculatePixPayinFee(
  amount: number,
  feePercent: number = 0,
  feeFixed: number = 0
): FeeCalculationResult {
  const percentageFee = amount * feePercent;
  const fixedFee = feeFixed;
  const totalFee = percentageFee + fixedFee;
  const finalAmount = amount - totalFee;

  return {
    originalAmount: amount,
    feeAmount: totalFee,
    finalAmount: Math.max(0, finalAmount),
    feeBreakdown: {
      percentageFee,
      fixedFee,
    },
  };
}

/**
 * Calculate PIX Pay-out fee (desconta a taxa do valor que sai)
 */
export function calculatePixPayoutFee(
  amount: number,
  feePercent: number = 0,
  feeFixed: number = 0
): FeeCalculationResult {
  const percentageFee = amount * feePercent;
  const fixedFee = feeFixed;
  const totalFee = percentageFee + fixedFee;
  const finalAmount = amount - totalFee;

  return {
    originalAmount: amount,
    feeAmount: totalFee,
    finalAmount: Math.max(0, finalAmount),
    feeBreakdown: {
      percentageFee,
      fixedFee,
    },
  };
}

/**
 * Calculate manual withdrawal fee (desconta a taxa)
 */
export function calculateManualWithdrawFee(
  amount: number,
  feePercent: number = 0,
  feeFixed: number = 0
): FeeCalculationResult {
  const percentageFee = amount * feePercent;
  const fixedFee = feeFixed;
  const totalFee = percentageFee + fixedFee;
  const finalAmount = amount - totalFee;

  return {
    originalAmount: amount,
    feeAmount: totalFee,
    finalAmount: Math.max(0, finalAmount),
    feeBreakdown: {
      percentageFee,
      fixedFee,
    },
  };
}

/**
 * Calculate USDT purchase fee (acrescenta a taxa no valor final)
 */
export function calculateUsdtPurchaseFee(
  baseAmount: number,
  exchangeRate: number,
  feePercent: number = 0,
  feeFixed: number = 0
): FeeCalculationResult {
  // Valor base em BRL
  const baseValueBRL = baseAmount * exchangeRate;

  // Aplicar taxa percentual sobre o valor base
  const percentageFee = baseValueBRL * feePercent;
  const fixedFee = feeFixed;
  const totalFee = percentageFee + fixedFee;

  // Valor final é o valor base + taxas
  const finalAmount = baseValueBRL + totalFee;

  return {
    originalAmount: baseValueBRL,
    feeAmount: totalFee,
    finalAmount,
    feeBreakdown: {
      percentageFee,
      fixedFee,
    },
  };
}

/**
 * Apply fees to a transaction based on type
 */
export function applyTransactionFees(
  amount: number,
  transactionType: 'PIX_PAYIN' | 'PIX_PAYOUT' | 'MANUAL_WITHDRAWAL' | 'USDT_PURCHASE',
  fees: SellerFees,
  usdtAmount?: number
): FeeCalculationResult {
  switch (transactionType) {
    case 'PIX_PAYIN':
      return calculatePixPayinFee(
        amount,
        fees.pixPayinFeePercent || 0,
        fees.pixPayinFeeFixed || 0
      );

    case 'PIX_PAYOUT':
      return calculatePixPayoutFee(
        amount,
        fees.pixPayoutFeePercent || 0,
        fees.pixPayoutFeeFixed || 0
      );

    case 'MANUAL_WITHDRAWAL':
      return calculateManualWithdrawFee(
        amount,
        fees.manualWithdrawFeePercent || 0,
        fees.manualWithdrawFeeFixed || 0
      );

    case 'USDT_PURCHASE':
      if (!usdtAmount) {
        throw new Error('USDT amount is required for USDT purchase');
      }
      // Para compra de USDT, usar as taxas de margem sobre a cotação da API
      const exchangeRateFeePercent = fees.exchangeRateFeePercent || 0;
      const exchangeRateFeeFixed = fees.exchangeRateFeeFixed || 0;
      const usdtPurchaseFeePercent = fees.usdtPurchaseFeePercent || 0;
      const usdtPurchaseFeeFixed = fees.usdtPurchaseFeeFixed || 0;

      // Aplicar taxa de câmbio + taxa de compra USDT
      const totalFeePercent = exchangeRateFeePercent + usdtPurchaseFeePercent;
      const totalFeeFixed = exchangeRateFeeFixed + usdtPurchaseFeeFixed;

      return {
        originalAmount: amount,
        feeAmount: (amount * totalFeePercent) + totalFeeFixed,
        finalAmount: amount + (amount * totalFeePercent) + totalFeeFixed,
        feeBreakdown: {
          percentageFee: amount * totalFeePercent,
          fixedFee: totalFeeFixed,
        },
      };

    default:
      throw new Error(`Unsupported transaction type: ${transactionType}`);
  }
}

/**
 * Format fee calculation for display
 */
export function formatFeeCalculation(result: FeeCalculationResult): string {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  let breakdown = '';
  if (result.feeBreakdown.percentageFee > 0) {
    breakdown += `Taxa %: ${formatCurrency(result.feeBreakdown.percentageFee)}`;
  }
  if (result.feeBreakdown.fixedFee > 0) {
    if (breakdown) breakdown += ' + ';
    breakdown += `Taxa fixa: ${formatCurrency(result.feeBreakdown.fixedFee)}`;
  }

  return `
Valor original: ${formatCurrency(result.originalAmount)}
${breakdown ? `Taxas: ${breakdown}` : 'Sem taxas'}
Taxa total: ${formatCurrency(result.feeAmount)}
Valor final: ${formatCurrency(result.finalAmount)}
  `.trim();
}