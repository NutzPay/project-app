import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // Get user's wallets
    const [usdtWallet, pixWallet] = await Promise.all([
      prisma.uSDTWallet.findUnique({ where: { userId: currentUser.id } }),
      prisma.pIXWallet.findUnique({ where: { userId: currentUser.id } })
    ]);

    const allTransactions: any[] = [];

    // Get USDT transactions if wallet exists
    if (usdtWallet) {
      const usdtTxs = await prisma.uSDTTransaction.findMany({
        where: { walletId: usdtWallet.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          pixTransactionId: true,
          type: true,
          status: true,
          amount: true,
          brlAmount: true,
          description: true,
          createdAt: true,
          updatedAt: true
        }
      });

      allTransactions.push(...usdtTxs.map(tx => ({
        id: tx.pixTransactionId || tx.id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        brlAmount: tx.brlAmount,
        description: tx.description,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        walletType: 'USDT'
      })));
    }

    // Get PIX transactions if wallet exists
    if (pixWallet) {
      const pixTxs = await prisma.pIXTransaction.findMany({
        where: { walletId: pixWallet.id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          pixKey: true,
          endToEndId: true
        }
      });

      allTransactions.push(...pixTxs.map(tx => ({
        id: tx.id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        brlAmount: tx.amount, // PIX is already in BRL
        description: tx.description || `${tx.type === 'DEPOSIT' ? 'Recebimento' : 'Envio'} PIX`,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        walletType: 'PIX',
        pixKey: tx.pixKey,
        endToEndId: tx.endToEndId
      })));
    }

    // Sort all transactions by createdAt DESC
    allTransactions.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Take only the 5 most recent
    const recentTransactions = allTransactions.slice(0, 5);

    console.log('📋 Recent transactions loaded from database:', {
      userId: currentUser.id,
      usdtWalletId: usdtWallet?.id || 'none',
      pixWalletId: pixWallet?.id || 'none',
      totalCount: allTransactions.length,
      recentCount: recentTransactions.length
    });

    return NextResponse.json({
      success: true,
      transactions: recentTransactions
    });

  } catch (error) {
    console.error('❌ Error loading recent transactions:', error);
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