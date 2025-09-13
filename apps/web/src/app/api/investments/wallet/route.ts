import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
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

    // Get or create investment wallet
    let investmentWallet = await prisma.investmentWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!investmentWallet) {
      investmentWallet = await prisma.investmentWallet.create({
        data: {
          userId: currentUser.id
        }
      });
    }

    // Get investment transactions
    const transactions = await prisma.investmentTransaction.findMany({
      where: { walletId: investmentWallet.id },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Calculate statistics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [investedSum, yieldSum, withdrawnSum, totalCount] = await Promise.all([
      prisma.investmentTransaction.aggregate({
        where: {
          walletId: investmentWallet.id,
          type: 'INVESTMENT',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.investmentTransaction.aggregate({
        where: {
          walletId: investmentWallet.id,
          type: 'YIELD',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.investmentTransaction.aggregate({
        where: {
          walletId: investmentWallet.id,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.investmentTransaction.count({
        where: { walletId: investmentWallet.id }
      })
    ]);

    return NextResponse.json({
      success: true,
      wallet: {
        totalInvested: parseFloat(investmentWallet.totalInvested.toString()),
        currentValue: parseFloat(investmentWallet.currentValue.toString()),
        totalReturns: parseFloat(investmentWallet.totalReturns.toString()),
        totalWithdrawn: parseFloat(investmentWallet.totalWithdrawn.toString()),
        profitLoss: parseFloat(investmentWallet.currentValue.toString()) - parseFloat(investmentWallet.totalInvested.toString())
      },
      transactions: transactions.map(tx => ({
        id: tx.id,
        type: tx.type.toLowerCase(),
        amount: parseFloat(tx.amount.toString()),
        status: tx.status.toLowerCase(),
        description: tx.description,
        planName: tx.planName,
        createdAt: tx.createdAt.toISOString(),
        processedAt: tx.processedAt?.toISOString() || null
      })),
      statistics: {
        invested30Days: parseFloat(investedSum._sum.amount?.toString() || '0'),
        yield30Days: parseFloat(yieldSum._sum.amount?.toString() || '0'),
        withdrawn30Days: parseFloat(withdrawnSum._sum.amount?.toString() || '0'),
        totalTransactions: totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error loading investment wallet:', error);
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