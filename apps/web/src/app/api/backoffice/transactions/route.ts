import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const mockTransactions = [
  {
    id: 'tx-001',
    pixTransactionId: 'PIX-2024-001',
    type: 'DEPOSIT',
    status: 'COMPLETED',
    amount: 1000,
    brlAmount: 5420.00,
    description: 'Depósito USDT',
    createdAt: new Date().toISOString(),
    user: {
      id: 'user-001',
      name: 'João Silva',
      email: 'joao@email.com'
    }
  },
  {
    id: 'tx-002',
    pixTransactionId: 'PIX-2024-002',
    type: 'WITHDRAWAL',
    status: 'PENDING',
    amount: 500,
    brlAmount: 2710.00,
    description: 'Saque USDT',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    user: {
      id: 'user-002',
      name: 'Maria Santos',
      email: 'maria@email.com'
    }
  },
  {
    id: 'tx-003',
    pixTransactionId: 'PIX-2024-003',
    type: 'DEPOSIT',
    status: 'FAILED',
    amount: 2000,
    brlAmount: 10840.00,
    description: 'Depósito USDT - Erro de validação',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    user: {
      id: 'user-003',
      name: 'Carlos Oliveira',
      email: 'carlos@email.com'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Extrair parâmetros de query
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause para Prisma
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { pixTransactionId: { contains: search } },
        { description: { contains: search, mode: 'insensitive' } },
        { wallet: { user: { name: { contains: search, mode: 'insensitive' } } } },
        { wallet: { user: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Buscar transações reais do banco de dados
    const [transactions, totalCount] = await Promise.all([
      prisma.uSDTTransaction.findMany({
        where,
        include: {
          wallet: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit,
      }),
      prisma.uSDTTransaction.count({ where }),
    ]);

    // Calcular stats reais para hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [statsToday, statsTotal] = await Promise.all([
      // Stats de hoje
      prisma.uSDTTransaction.aggregate({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        _sum: { brlAmount: true },
        _count: { 
          _all: true,
          status: true 
        }
      }),
      // Stats por status
      prisma.uSDTTransaction.groupBy({
        by: ['status'],
        _count: true,
      })
    ]);

    const completedTodayCount = await prisma.uSDTTransaction.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const stats = {
      total: totalCount,
      completedToday: completedTodayCount,
      pending: statsTotal.find(s => s.status === 'PENDING')?._count || 0,
      failed: statsTotal.find(s => s.status === 'FAILED')?._count || 0,
      volumeToday: Number(statsToday._sum.brlAmount) || 0
    };

    // Formatar dados das transações
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      pixTransactionId: tx.pixTransactionId,
      type: tx.type,
      status: tx.status,
      amount: Number(tx.amount),
      brlAmount: Number(tx.brlAmount) || 0,
      description: tx.description || `${tx.type === 'DEPOSIT' ? 'Depósito' : 'Saque'} USDT`,
      createdAt: tx.createdAt.toISOString(),
      user: {
        id: tx.wallet.user.id,
        name: tx.wallet.user.name,
        email: tx.wallet.user.email,
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      stats
    });

  } catch (error) {
    console.error('❌ Error loading transactions:', error);
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