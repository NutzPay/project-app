import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simular confirmação de pagamento PIX (em produção seria um webhook)
export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'ID da transação é obrigatório',
          code: 'MISSING_TRANSACTION_ID'
        },
        { status: 400 }
      );
    }

    // Buscar transação
    const exchangeTransaction = await prisma.uSDTTransaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!exchangeTransaction) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transação não encontrada',
          code: 'TRANSACTION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    if (exchangeTransaction.status !== 'PENDING') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transação já foi processada',
          code: 'TRANSACTION_ALREADY_PROCESSED'
        },
        { status: 400 }
      );
    }

    // TODO: Verificar se não expirou (campo expiresAt não existe no modelo atual)
    // if (new Date() > exchangeTransaction.expiresAt) {
    //   await prisma.uSDTTransaction.update({
    //     where: { id: transactionId },
    //     data: { 
    //       status: 'EXPIRED',
    //       updatedAt: new Date()
    //     }
    //   });

    //   return NextResponse.json(
    //     { 
    //       success: false,
    //       error: 'Transação expirada',
    //       code: 'TRANSACTION_EXPIRED'
    //     },
    //     { status: 400 }
    //   );
    // }

    // Processar em transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da transação
      const updatedExchange = await tx.uSDTTransaction.update({
        where: { id: transactionId },
        data: { 
          status: 'COMPLETED',
          updatedAt: new Date()
        }
      });

      // 2. Usar a carteira USDT da transação
      const usdtWallet = exchangeTransaction.wallet;

      // 3. Creditar USDT na carteira
      await tx.uSDTWallet.update({
        where: { id: usdtWallet.id },
        data: {
          balance: {
            increment: exchangeTransaction.amount
          },
          updatedAt: new Date()
        }
      });

      // 4. Registrar transação na carteira USDT
      await tx.uSDTTransaction.create({
        data: {
          walletId: usdtWallet.id,
          type: 'DEPOSIT', // Ou outro tipo apropriado
          amount: exchangeTransaction.amount,
          status: 'COMPLETED',
          description: `Câmbio PIX→USDT`
        }
      });

      return updatedExchange;
    });

    console.log('✅ Exchange completed successfully:', {
      transactionId: transactionId,
      walletId: exchangeTransaction.walletId,
      amount: exchangeTransaction.amount
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: result.id,
        status: result.status,
        amount: result.amount,
        completedAt: result.updatedAt
      },
      message: 'Câmbio realizado com sucesso! USDT creditado na sua carteira.'
    });

  } catch (error) {
    console.error('❌ Error confirming exchange:', error);
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