import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const period = searchParams.get('period') || '30'; // days

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(period));

    // Get or create PIX wallet
    let pixWallet = await prisma.pIXWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!pixWallet) {
      pixWallet = await prisma.pIXWallet.create({
        data: {
          userId: currentUser.id
        }
      });
    }

    const transactions = await prisma.pIXTransaction.findMany({
      where: {
        walletId: pixWallet.id,
        createdAt: {
          gte: dateFilter
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    const pixTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type === 'DEPOSIT' ? 'received' : 'sent',
      amount: parseFloat(tx.amount.toString()),
      description: tx.description || `${tx.type === 'DEPOSIT' ? 'Recebimento' : 'Envio'} PIX`,
      pixKey: tx.pixKey || 'Chave não identificada',
      status: tx.status.toLowerCase() as 'completed' | 'pending' | 'failed',
      createdAt: tx.createdAt.toISOString(),
      endToEndId: tx.endToEndId || tx.externalId
    }));

    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [receivedSum, sentSum, totalCount] = await Promise.all([
      prisma.pIXTransaction.aggregate({
        where: {
          walletId: pixWallet.id,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.pIXTransaction.aggregate({
        where: {
          walletId: pixWallet.id,
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.pIXTransaction.count({
        where: {
          walletId: pixWallet.id,
          status: 'COMPLETED'
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      transactions: pixTransactions,
      statistics: {
        received30Days: parseFloat(receivedSum._sum.amount?.toString() || '0'),
        sent30Days: parseFloat(sentSum._sum.amount?.toString() || '0'),
        totalTransactions: totalCount
      }
    });

  } catch (error) {
    console.error('❌ Error loading PIX transactions:', error);
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