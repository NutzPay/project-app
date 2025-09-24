import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { auditService } from '@/lib/audit/audit-service';

// Função para gerar QR Code PIX simulado (em produção usar API real)
const generatePixQRCode = (amount: number, transactionId: string) => {
  // Em produção, integrar com API PIX real (PagSeguro, MercadoPago, etc.)
  const pixKey = 'pix@nutz.com.br'; // Sua chave PIX
  const pixCode = `00020126580014br.gov.bcb.pix0136${pixKey}0208${transactionId}5204000053039865802BR5909Nutz Corp6009Sao Paulo62070503***6304`;
  
  return {
    qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`, // QR Code placeholder
    qrCodeText: pixCode,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
  };
};

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      await auditService.logAuth({
        action: 'LOGIN_FAILED',
        success: false,
        ipAddress,
        userAgent,
        reason: 'Unauthorized exchange attempt'
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const { brlAmount, usdtAmount, exchangeMode } = await request.json();

    console.log('🔄 Exchange request:', {
      brlAmount,
      usdtAmount,
      exchangeMode,
      userId: currentUser.id
    });

    // Validações básicas
    if (!exchangeMode || !['usdt_to_brl', 'brl_to_usdt'].includes(exchangeMode)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Modo de câmbio inválido',
          code: 'INVALID_EXCHANGE_MODE'
        },
        { status: 400 }
      );
    }

    if (exchangeMode === 'usdt_to_brl') {
      // USDT → BRL: Vender USDT por BRL
      if (!usdtAmount || usdtAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Quantidade USDT inválida',
            code: 'INVALID_USDT_AMOUNT'
          },
          { status: 400 }
        );
      }

      if (usdtAmount < 1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Quantidade mínima para câmbio é 1 USDT',
            code: 'MINIMUM_AMOUNT'
          },
          { status: 400 }
        );
      }

      // Verificar saldo USDT
      const usdtWallet = await prisma.uSDTWallet.findUnique({
        where: { userId: currentUser.id }
      });

      if (!usdtWallet || parseFloat(usdtWallet.balance.toString()) < usdtAmount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Saldo USDT insuficiente',
            code: 'INSUFFICIENT_BALANCE'
          },
          { status: 400 }
        );
      }

      // Calcular valor em BRL (taxa fixa para simplicidade)
      const usdtToBrlRate = 5.42; // Rate fixo por enquanto
      const finalBrlAmount = usdtAmount * usdtToBrlRate;

      console.log('💰 Exchange calculation:', {
        usdtAmount,
        usdtToBrlRate,
        finalBrlAmount
      });

      // Executar transação: debitar USDT e creditar BRL
      const result = await prisma.$transaction(async (prisma) => {
        // 1. Debitar USDT
        const newUsdtBalance = parseFloat(usdtWallet.balance.toString()) - usdtAmount;
        await prisma.uSDTWallet.update({
          where: { userId: currentUser.id },
          data: {
            balance: newUsdtBalance,
            totalWithdrawn: { increment: usdtAmount }
          }
        });

        // 2. Registrar transação USDT (saída)
        const usdtTransaction = await prisma.uSDTTransaction.create({
          data: {
            walletId: usdtWallet.id,
            type: 'WITHDRAWAL',
            status: 'COMPLETED',
            amount: usdtAmount,
            balanceAfter: newUsdtBalance,
            description: `Câmbio USDT → BRL: ${usdtAmount} USDT por R$ ${finalBrlAmount.toFixed(2)}`,
            processedAt: new Date()
          }
        });

        // 3. Creditar BRL na carteira PIX
        let pixWallet = await prisma.pIXWallet.findUnique({
          where: { userId: currentUser.id }
        });

        if (!pixWallet) {
          pixWallet = await prisma.pIXWallet.create({
            data: { userId: currentUser.id }
          });
        }

        const newPixBalance = parseFloat(pixWallet.balance.toString()) + finalBrlAmount;
        await prisma.pIXWallet.update({
          where: { userId: currentUser.id },
          data: {
            balance: newPixBalance,
            totalDeposited: { increment: finalBrlAmount }
          }
        });

        // 3.5. Registrar transação PIX (entrada do câmbio)
        await prisma.pIXTransaction.create({
          data: {
            walletId: pixWallet.id,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            amount: finalBrlAmount,
            description: `Câmbio USDT → BRL: ${usdtAmount.toFixed(6)} USDT por R$ ${finalBrlAmount.toFixed(2)}`,
            pixKey: 'Sistema de Câmbio',
            processedAt: new Date()
          }
        });

        return {
          usdtTransaction,
          finalBrlAmount,
          newUsdtBalance,
          newPixBalance
        };
      });

      console.log('✅ Exchange completed successfully:', {
        transactionId: result.usdtTransaction.id,
        usdtAmount,
        brlAmount: result.finalBrlAmount,
        newUsdtBalance: result.newUsdtBalance,
        newPixBalance: result.newPixBalance
      });

      // Log successful exchange transaction
      await auditService.logTransaction({
        action: 'EXCHANGE_TRANSACTION',
        transactionId: result.usdtTransaction.id,
        userId: currentUser.id,
        amount: result.finalBrlAmount,
        currency: 'BRL',
        fromCurrency: 'USDT',
        toCurrency: 'BRL',
        success: true,
        ipAddress,
        userAgent,
        metadata: {
          exchangeMode: 'usdt_to_brl',
          usdtAmount,
          brlAmount: result.finalBrlAmount,
          exchangeRate: usdtToBrlRate,
          newUsdtBalance: result.newUsdtBalance,
          newBrlBalance: result.newPixBalance
        }
      });

      return NextResponse.json({
        success: true,
        exchange: {
          transactionId: result.usdtTransaction.id,
          type: 'USDT_TO_BRL',
          usdtAmount,
          brlAmount: result.finalBrlAmount,
          rate: usdtToBrlRate,
          status: 'COMPLETED'
        },
        balances: {
          usdt: result.newUsdtBalance,
          brl: result.newPixBalance
        }
      });

    } else if (exchangeMode === 'brl_to_usdt') {
      // BRL → USDT: Comprar USDT com BRL
      if (!brlAmount || brlAmount <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Valor BRL inválido',
            code: 'INVALID_BRL_AMOUNT'
          },
          { status: 400 }
        );
      }

      if (brlAmount < 10) {
        return NextResponse.json(
          {
            success: false,
            error: 'Valor mínimo para câmbio é R$ 10,00',
            code: 'MINIMUM_AMOUNT'
          },
          { status: 400 }
        );
      }

      // Verificar saldo BRL (PIX)
      let pixWallet = await prisma.pIXWallet.findUnique({
        where: { userId: currentUser.id }
      });

      if (!pixWallet) {
        pixWallet = await prisma.pIXWallet.create({
          data: { userId: currentUser.id }
        });
      }

      if (parseFloat(pixWallet.balance.toString()) < brlAmount) {
        return NextResponse.json(
          {
            success: false,
            error: 'Saldo BRL insuficiente',
            code: 'INSUFFICIENT_BALANCE'
          },
          { status: 400 }
        );
      }

      // Calcular USDT a receber (taxa fixa para simplicidade)
      const brlToUsdtRate = 1 / 5.42; // Inverso da taxa USDT→BRL
      const finalUsdtAmount = brlAmount * brlToUsdtRate;

      console.log('💰 Exchange calculation (BRL→USDT):', {
        brlAmount,
        brlToUsdtRate,
        finalUsdtAmount
      });

      // Executar transação: debitar BRL e creditar USDT
      const result = await prisma.$transaction(async (prisma) => {
        // 1. Debitar BRL
        const newPixBalance = parseFloat(pixWallet!.balance.toString()) - brlAmount;
        await prisma.pIXWallet.update({
          where: { userId: currentUser.id },
          data: {
            balance: newPixBalance,
            totalWithdrawn: { increment: brlAmount }
          }
        });

        // 1.5. Registrar transação PIX (saída para câmbio)
        await prisma.pIXTransaction.create({
          data: {
            walletId: pixWallet!.id,
            type: 'WITHDRAWAL',
            status: 'COMPLETED',
            amount: brlAmount,
            description: `Câmbio BRL → USDT: R$ ${brlAmount.toFixed(2)} por ${finalUsdtAmount.toFixed(6)} USDT`,
            pixKey: 'Sistema de Câmbio',
            processedAt: new Date()
          }
        });

        // 2. Creditar USDT na carteira USDT
        let usdtWallet = await prisma.uSDTWallet.findUnique({
          where: { userId: currentUser.id }
        });

        if (!usdtWallet) {
          usdtWallet = await prisma.uSDTWallet.create({
            data: { userId: currentUser.id }
          });
        }

        const newUsdtBalance = parseFloat(usdtWallet.balance.toString()) + finalUsdtAmount;
        await prisma.uSDTWallet.update({
          where: { userId: currentUser.id },
          data: {
            balance: newUsdtBalance,
            totalDeposited: { increment: finalUsdtAmount }
          }
        });

        // 3. Registrar transação USDT (entrada)
        const usdtTransaction = await prisma.uSDTTransaction.create({
          data: {
            walletId: usdtWallet.id,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            amount: finalUsdtAmount,
            balanceAfter: newUsdtBalance,
            brlAmount: brlAmount,
            description: `Câmbio BRL → USDT: R$ ${brlAmount.toFixed(2)} por ${finalUsdtAmount.toFixed(6)} USDT`,
            processedAt: new Date()
          }
        });

        return {
          usdtTransaction,
          finalUsdtAmount,
          newPixBalance,
          newUsdtBalance
        };
      });

      console.log('✅ Exchange completed successfully (BRL→USDT):', {
        transactionId: result.usdtTransaction.id,
        brlAmount,
        usdtAmount: result.finalUsdtAmount,
        newPixBalance: result.newPixBalance,
        newUsdtBalance: result.newUsdtBalance
      });

      // Log successful exchange transaction
      await auditService.logTransaction({
        action: 'EXCHANGE_TRANSACTION',
        transactionId: result.usdtTransaction.id,
        userId: currentUser.id,
        amount: brlAmount,
        currency: 'BRL',
        fromCurrency: 'BRL',
        toCurrency: 'USDT',
        success: true,
        ipAddress,
        userAgent,
        metadata: {
          exchangeMode: 'brl_to_usdt',
          brlAmount,
          usdtAmount: result.finalUsdtAmount,
          exchangeRate: brlToUsdtRate,
          newBrlBalance: result.newPixBalance,
          newUsdtBalance: result.newUsdtBalance
        }
      });

      return NextResponse.json({
        success: true,
        exchange: {
          transactionId: result.usdtTransaction.id,
          type: 'BRL_TO_USDT',
          brlAmount,
          usdtAmount: result.finalUsdtAmount,
          rate: brlToUsdtRate,
          status: 'COMPLETED'
        },
        balances: {
          brl: result.newPixBalance,
          usdt: result.newUsdtBalance
        }
      });

    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Modo de câmbio não suportado',
          code: 'INVALID_EXCHANGE_MODE'
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error creating exchange transaction:', error);

    // Log the failed exchange attempt
    try {
      const currentUser = await getCurrentUser(request);
      await auditService.logTransaction({
        action: 'EXCHANGE_TRANSACTION',
        transactionId: 'failed',
        userId: currentUser?.id || 'unknown',
        success: false,
        ipAddress,
        userAgent,
        errorCode: 'INTERNAL_ERROR',
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          endpoint: '/api/exchange/create'
        }
      });
    } catch (auditError) {
      console.error('Failed to log exchange error:', auditError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}