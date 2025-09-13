import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const transactionId = params.id;

    // Find transaction in database
    const transaction = await prisma.uSDTTransaction.findFirst({
      where: {
        pixTransactionId: transactionId,
        userId: currentUser.id // Only show user's own transactions
      },
      include: {
        wallet: true
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Transação não encontrada',
          code: 'TRANSACTION_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    console.log('📋 Transaction status check:', {
      id: transaction.pixTransactionId,
      status: transaction.status,
      amount: transaction.amount,
      userId: transaction.userId,
      createdAt: transaction.createdAt
    });

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.pixTransactionId,
        status: transaction.status,
        type: transaction.type,
        amount: transaction.amount,
        brlAmount: transaction.brlAmount,
        exchangeRate: transaction.exchangeRate,
        pixCode: transaction.pixCode,
        description: transaction.description,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        wallet: {
          balance: transaction.wallet.balance,
          totalDeposited: transaction.wallet.totalDeposited
        }
      }
    });

  } catch (error) {
    console.error('❌ Error checking transaction status:', error);
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