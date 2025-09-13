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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const period = searchParams.get('period') || '30'; // days
    const type = searchParams.get('type'); // filter by transaction type

    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(period));

    const whereClause: any = {
      wallet: {
        userId: currentUser.id
      },
      createdAt: {
        gte: dateFilter
      }
    };

    if (type) {
      whereClause.type = type.toUpperCase();
    }

    const transactions = await prisma.uSDTTransaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
    });

    const usdtTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type.toLowerCase(),
      amount: parseFloat(tx.amount.toString()),
      brlAmount: tx.brlAmount ? parseFloat(tx.brlAmount.toString()) : null,
      exchangeRate: tx.exchangeRate ? parseFloat(tx.exchangeRate.toString()) : null,
      status: tx.status.toLowerCase(),
      description: tx.description || getDefaultDescription(tx.type),
      pixCode: tx.pixCode,
      externalId: tx.externalId,
      balanceAfter: tx.balanceAfter ? parseFloat(tx.balanceAfter.toString()) : null,
      createdAt: tx.createdAt.toISOString(),
      processedAt: tx.processedAt?.toISOString() || null
    }));

    // Calculate statistics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [depositSum, withdrawalSum, investmentSum, totalCount, completedCount] = await Promise.all([
      prisma.uSDTTransaction.aggregate({
        where: {
          wallet: { userId: currentUser.id },
          type: 'DEPOSIT',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.uSDTTransaction.aggregate({
        where: {
          wallet: { userId: currentUser.id },
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.uSDTTransaction.aggregate({
        where: {
          wallet: { userId: currentUser.id },
          type: 'INVESTMENT',
          status: 'COMPLETED',
          createdAt: { gte: last30Days }
        },
        _sum: { amount: true }
      }),
      prisma.uSDTTransaction.count({
        where: {
          wallet: { userId: currentUser.id }
        }
      }),
      prisma.uSDTTransaction.count({
        where: {
          wallet: { userId: currentUser.id },
          status: 'COMPLETED'
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      transactions: usdtTransactions,
      statistics: {
        deposited30Days: parseFloat(depositSum._sum.amount?.toString() || '0'),
        withdrawn30Days: parseFloat(withdrawalSum._sum.amount?.toString() || '0'),
        invested30Days: parseFloat(investmentSum._sum.amount?.toString() || '0'),
        totalTransactions: totalCount,
        completedTransactions: completedCount,
        pendingTransactions: totalCount - completedCount
      }
    });

  } catch (error) {
    console.error('❌ Error loading USDT transactions:', error);
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

function getDefaultDescription(type: string): string {
  switch (type) {
    case 'DEPOSIT': return 'Depósito USDT';
    case 'WITHDRAWAL': return 'Saque USDT';
    case 'INVESTMENT': return 'Aplicação em investimento';
    case 'RETURN': return 'Retorno de investimento';
    case 'TRANSFER_IN': return 'Transferência recebida';
    case 'TRANSFER_OUT': return 'Transferência enviada';
    case 'ADJUSTMENT': return 'Ajuste manual';
    default: return 'Transação USDT';
  }
}