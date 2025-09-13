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

    // Calculate statistics based on real data
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get transaction statistics for the current user through wallet relation
    const [
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      volumeLast24h
    ] = await Promise.all([
      // Count completed transactions
      prisma.uSDTTransaction.count({
        where: {
          wallet: {
            userId: currentUser.id
          },
          status: 'COMPLETED'
        }
      }),

      // Count pending transactions
      prisma.uSDTTransaction.count({
        where: {
          wallet: {
            userId: currentUser.id
          },
          status: 'PENDING'
        }
      }),

      // Count failed transactions
      prisma.uSDTTransaction.count({
        where: {
          wallet: {
            userId: currentUser.id
          },
          status: 'FAILED'
        }
      }),

      // Calculate volume in the last 24 hours (BRL equivalent)
      prisma.uSDTTransaction.aggregate({
        where: {
          wallet: {
            userId: currentUser.id
          },
          status: 'COMPLETED',
          createdAt: {
            gte: last24h
          }
        },
        _sum: {
          brlAmount: true
        }
      })
    ]);

    const volumeBrl = volumeLast24h._sum.brlAmount || 0;

    console.log('📊 Dashboard stats calculated from database:', {
      userId: currentUser.id,
      completed: completedTransactions,
      pending: pendingTransactions,
      failed: failedTransactions,
      volume24h: volumeBrl
    });

    return NextResponse.json({
      success: true,
      stats: {
        completed: completedTransactions,
        pending: pendingTransactions,
        failed: failedTransactions,
        volume24h: volumeBrl
      }
    });

  } catch (error) {
    console.error('❌ Error loading dashboard stats:', error);
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