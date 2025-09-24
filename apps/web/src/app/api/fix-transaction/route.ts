import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { multiWalletService } from '@/lib/multiWalletService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pixId = searchParams.get('pixId') || '68abbe3f7263418b3ecafa60';
    
    console.log('🔍 Searching for transaction:', pixId);
    
    // Buscar em todos os campos possíveis
    const transactions = await prisma.uSDTTransaction.findMany({
      where: {
        OR: [
          { pixTransactionId: { contains: pixId } },
          { externalId: { contains: pixId } },
          { id: { contains: pixId } },
          { description: { contains: pixId } }
        ]
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar também transações recentes de USDT
    const recentTransactions = await prisma.uSDTTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
        }
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      searchedFor: pixId,
      foundTransactions: transactions.length,
      transactions: transactions.map(tx => ({
        id: tx.id,
        pixTransactionId: tx.pixTransactionId,
        externalId: tx.externalId,
        type: tx.type,
        status: tx.status,
        amount: Number(tx.amount),
        brlAmount: Number(tx.brlAmount || 0),
        exchangeRate: Number(tx.exchangeRate || 0),
        description: tx.description,
        createdAt: tx.createdAt.toISOString(),
        processedAt: tx.processedAt?.toISOString(),
        user: tx.wallet.user,
        walletId: tx.walletId,
        currentWalletBalance: Number(tx.wallet.balance)
      })),
      recentTransactions: {
        count: recentTransactions.length,
        transactions: recentTransactions.map(tx => ({
          id: tx.id,
          pixTransactionId: tx.pixTransactionId,
          type: tx.type,
          status: tx.status,
          amount: Number(tx.amount),
          brlAmount: Number(tx.brlAmount || 0),
          description: tx.description,
          createdAt: tx.createdAt.toISOString(),
          user: tx.wallet.user.email
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error searching transactions:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Search error'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pixId, action, amount, userId } = await request.json();
    
    if (action === 'force_complete') {
      console.log('🚀 FORCE COMPLETING transaction:', pixId);
      
      // Buscar a transação
      const transaction = await prisma.uSDTTransaction.findFirst({
        where: {
          OR: [
            { pixTransactionId: pixId },
            { externalId: pixId },
            { id: pixId }
          ]
        },
        include: {
          wallet: {
            include: {
              user: true
            }
          }
        }
      });

      if (!transaction) {
        return NextResponse.json({
          success: false,
          error: 'Transaction not found',
          pixId,
          suggestion: 'Check the PIX ID or create transaction manually'
        });
      }

      console.log('Found transaction:', transaction.id, 'Status:', transaction.status);

      // Calcular valor correto se necessário
      let correctAmount = Number(transaction.amount);
      if (amount && amount !== correctAmount) {
        correctAmount = amount;
        console.log('Using custom amount:', correctAmount);
      } else if (correctAmount < 1 && transaction.brlAmount && Number(transaction.brlAmount) > 5) {
        // Recalcular: R$ 10,10 * 0.17 = 1.717 USDT
        correctAmount = Number(transaction.brlAmount) * 0.17;
        console.log('Recalculated amount:', correctAmount);
      }

      // Processar em transação atômica
      const result = await prisma.$transaction(async (tx) => {
        const currentBalance = Number(transaction.wallet.balance);
        const newBalance = currentBalance + correctAmount;
        const newTotalDeposited = Number(transaction.wallet.totalDeposited) + correctAmount;

        console.log('Processing:', {
          currentBalance,
          adding: correctAmount,
          newBalance
        });

        // Atualizar carteira
        const updatedWallet = await tx.uSDTWallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: newBalance,
            totalDeposited: newTotalDeposited
          }
        });

        // Atualizar transação
        const updatedTransaction = await tx.uSDTTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            amount: correctAmount,
            balanceAfter: newBalance,
            processedAt: new Date()
          }
        });

        return {
          transaction: updatedTransaction,
          wallet: updatedWallet,
          oldBalance: currentBalance,
          newBalance: newBalance,
          creditedAmount: correctAmount
        };
      });

      console.log('✅ SUCCESS!', result);

      return NextResponse.json({
        success: true,
        action: 'force_complete',
        pixId,
        result: {
          transactionId: result.transaction.id,
          oldBalance: result.oldBalance,
          creditedAmount: result.creditedAmount,
          newBalance: result.newBalance,
          status: result.transaction.status,
          processedAt: result.transaction.processedAt,
          user: transaction.wallet.user.email
        }
      });
    }

    if (action === 'create_manual') {
      // Criar transação manualmente se não existir
      if (!userId || !amount) {
        return NextResponse.json({
          success: false,
          error: 'userId and amount required for manual creation'
        });
      }

      console.log('🔧 Creating manual transaction:', { userId, amount, pixId });

      // Verificar se usuário existe
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        });
      }

      // Buscar ou criar carteira
      let wallet = await prisma.uSDTWallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        wallet = await prisma.uSDTWallet.create({
          data: {
            userId,
            balance: 0,
            frozenBalance: 0,
            totalDeposited: 0,
            totalWithdrawn: 0
          }
        });
      }

      // Verificar se wallet existe
      if (!wallet) {
        throw new Error('Wallet não encontrada');
      }

      // Criar e completar transação
      const result = await prisma.$transaction(async (tx) => {
        const currentBalance = Number(wallet!.balance);
        const newBalance = currentBalance + amount;
        const newTotalDeposited = Number(wallet!.totalDeposited) + amount;

        // Criar transação
        const newTransaction = await tx.uSDTTransaction.create({
          data: {
            walletId: wallet!.id,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            amount: amount,
            brlAmount: amount / 0.17, // Reverse calculation
            exchangeRate: 0.17,
            pixTransactionId: pixId,
            externalId: pixId,
            description: 'Depósito manual - correção de webhook',
            balanceAfter: newBalance,
            processedAt: new Date()
          }
        });

        // Atualizar carteira
        const updatedWallet = await tx.uSDTWallet.update({
          where: { id: wallet!.id },
          data: {
            balance: newBalance,
            totalDeposited: newTotalDeposited
          }
        });

        return {
          transaction: newTransaction,
          wallet: updatedWallet,
          oldBalance: currentBalance,
          newBalance: newBalance
        };
      });

      return NextResponse.json({
        success: true,
        action: 'create_manual',
        result: {
          transactionId: result.transaction.id,
          oldBalance: result.oldBalance,
          newBalance: result.newBalance,
          user: user.email
        }
      });
    }

    if (action === 'credit_pix_balance') {
      // Nova ação para creditar no saldo PIX separadamente
      if (!userId || !amount) {
        return NextResponse.json({
          success: false,
          error: 'userId and amount required for PIX credit'
        });
      }

      console.log('💰 Crediting PIX balance:', { userId, amount: amount, pixId });

      try {
        const result = await multiWalletService.processPIXPayment(
          userId,
          amount, // R$ 10.10 como BRL
          pixId,
          `Correção manual PIX: R$ ${amount}`
        );

        return NextResponse.json({
          success: true,
          action: 'credit_pix_balance',
          result: {
            pixTransactionId: pixId,
            creditedAmount: amount,
            newBalance: result.newBalance,
            walletType: result.walletType,
            type: result.type
          }
        });

      } catch (error) {
        console.error('Error crediting PIX balance:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : 'PIX credit error'
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use: force_complete, create_manual, or credit_pix_balance'
    });

  } catch (error) {
    console.error('❌ Error in fix transaction:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}