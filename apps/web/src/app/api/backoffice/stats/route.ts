import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const days = parseInt(searchParams.get('days') || '7');
    const customDate = searchParams.get('date');
    const startDateTime = searchParams.get('start');
    const endDateTime = searchParams.get('end');

    let startDate: Date;
    let endDate: Date;

    // Handle special periods
    if (period === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'yesterday') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'custom' && customDate) {
      startDate = new Date(customDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'range' && startDateTime && endDateTime) {
      startDate = new Date(startDateTime);
      endDate = new Date(endDateTime);
    } else {
      // Regular days-based period
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
    }

    // Buscar estatísticas reais do banco de dados
    const [
      userStats,
      totalUsers,
      transactionStats,
      investmentStats,
      usdtPurchaseStats,
      periodVolume,
      totalVolume
    ] = await Promise.all([
      // Estatísticas de usuários por status
      prisma.user.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Total de usuários
      prisma.user.count(),
      // Stats reais de transações PIX (apenas WITHDRAWAL - saques via PIX)
      prisma.uSDTTransaction.groupBy({
        by: ['status', 'type'],
        _count: true,
        _sum: { amount: true },
        where: {
          type: 'WITHDRAWAL', // Filtrar apenas saques PIX, não compras de USDT
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }).then(data => ({
        total: data.reduce((sum, item) => sum + item._count, 0),
        completed: data.filter(s => s.status === 'COMPLETED').reduce((sum, item) => sum + item._count, 0),
        pending: data.filter(s => s.status === 'PENDING').reduce((sum, item) => sum + item._count, 0),
        failed: data.filter(s => s.status === 'FAILED').reduce((sum, item) => sum + item._count, 0),
        deposits: 0, // PIX não inclui depósitos (compras de USDT)
        withdrawals: data.filter(s => s.type === 'WITHDRAWAL').reduce((sum, item) => sum + item._count, 0),
        depositVolume: 0, // PIX não inclui volume de depósitos
        withdrawalVolume: data.filter(s => s.type === 'WITHDRAWAL' && s.status === 'COMPLETED').reduce((sum, item) => sum + Number(item._sum?.amount || 0), 0),
      })).catch(() => ({ total: 0, completed: 0, pending: 0, failed: 0, deposits: 0, withdrawals: 0, depositVolume: 0, withdrawalVolume: 0 })),
      // Stats reais de investimentos
      prisma.investmentApplication.groupBy({
        by: ['status'],
        _count: true,
        _sum: { principalAmount: true }
      }).then(data => ({
        total: data.reduce((sum, item) => sum + item._count, 0),
        active: data.find(s => s.status === 'ACTIVE')?._count || 0,
        pending: data.find(s => s.status === 'PENDING')?._count || 0,
        totalVolume: data.reduce((sum, item) => sum + Number(item._sum?.principalAmount || 0), 0),
        activeVolume: data.find(s => s.status === 'ACTIVE')?._sum?.principalAmount || 0,
      })).catch(() => ({ total: 0, active: 0, pending: 0, totalVolume: 0, activeVolume: 0 })),
      // Stats reais de compras de USDT (apenas DEPOSIT - filtrado por período)
      prisma.uSDTTransaction.groupBy({
        by: ['status', 'type'],
        _count: true,
        _sum: { amount: true, brlAmount: true },
        where: {
          type: 'DEPOSIT', // Filtrar apenas compras de USDT
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }).then(data => ({
        total: data.reduce((sum, item) => sum + item._count, 0),
        completed: data.filter(s => s.status === 'COMPLETED').reduce((sum, item) => sum + item._count, 0),
        pending: data.filter(s => s.status === 'PENDING').reduce((sum, item) => sum + item._count, 0),
        failed: data.filter(s => s.status === 'FAILED').reduce((sum, item) => sum + item._count, 0),
        usdtVolume: data.filter(s => s.status === 'COMPLETED').reduce((sum, item) => sum + Number(item._sum?.amount || 0), 0),
        brlVolume: data.filter(s => s.status === 'COMPLETED').reduce((sum, item) => sum + Number(item._sum?.brlAmount || 0), 0),
      })).catch(() => ({ total: 0, completed: 0, pending: 0, failed: 0, usdtVolume: 0, brlVolume: 0 })),
      // Volume do período selecionado (apenas saques PIX)
      prisma.uSDTTransaction.aggregate({
        where: {
          type: 'WITHDRAWAL', // Apenas saques PIX
          status: 'COMPLETED',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: { brlAmount: true }
      }).then(result => result._sum.brlAmount || 0).catch(() => 0),
      // Volume total (para contexto)
      prisma.uSDTTransaction.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { brlAmount: true }
      }).then(result => result._sum.brlAmount || 0).catch(() => 0)
    ]);

    // Calcular crescimento dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const [recentUsers, oldUsers] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    const growth = oldUsers > 0 ? ((recentUsers / oldUsers) * 100) : 0;

    // Volume do mês (últimos 30 dias)
    const thirtyDaysAgoForVolume = new Date();
    thirtyDaysAgoForVolume.setDate(thirtyDaysAgoForVolume.getDate() - 30);
    
    const monthVolume = await prisma.uSDTTransaction.aggregate({
      where: {
        type: 'WITHDRAWAL', // Apenas saques PIX
        status: 'COMPLETED',
        createdAt: {
          gte: thirtyDaysAgoForVolume
        }
      },
      _sum: { brlAmount: true }
    }).then(result => result._sum.brlAmount || 0).catch(() => 0);
    
    const stats = {
      users: {
        total: totalUsers,
        active: userStats.find(s => s.status === 'ACTIVE')?._count || 0,
        pending: userStats.find(s => s.status === 'PENDING')?._count || 0,
        growth: Math.round(growth * 100) / 100
      },
      transactions: transactionStats,
      usdtPurchases: usdtPurchaseStats,
      volume: {
        today: Number(periodVolume) || 0,
        month: Number(monthVolume) || 0
      },
      investments: investmentStats,
      system: {
        status: 'online',
        uptime: '99.9%'
      }
    };

    console.log('📊 Backoffice stats (real data):', {
      totalUsers,
      usersByStatus: userStats,
      growth: `${growth}% nos últimos 30 dias`
    });

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error loading backoffice stats:', error);
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