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

    // First get user's wallet
    const userWallet = await prisma.uSDTWallet.findUnique({
      where: {
        userId: currentUser.id
      }
    });

    if (!userWallet) {
      return NextResponse.json({
        success: true,
        transactions: []
      });
    }

    // Get recent transactions (last 5)
    const transactions = await prisma.uSDTTransaction.findMany({
      where: {
        walletId: userWallet.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
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

    console.log('📋 Recent transactions loaded from database:', {
      userId: currentUser.id,
      walletId: userWallet.id,
      count: transactions.length
    });

    return NextResponse.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.pixTransactionId || tx.id,
        type: tx.type,
        status: tx.status,
        amount: tx.amount,
        brlAmount: tx.brlAmount,
        description: tx.description,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt
      }))
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