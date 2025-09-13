'use server';

import { prisma } from '@repo/db';

export interface BackofficeStats {
  totalUsers: number;
  pendingUsers: number;
  totalTransactions: number;
  todayVolume: number;
  totalCompanies: number;
  pendingCompanies: number;
  totalInvestments: number;
  activeInvestments: number;
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    brlAmount: number | null;
    status: string;
    description: string | null;
    createdAt: Date;
    user: {
      name: string;
      email: string;
    };
  }>;
  recentAuditLogs: Array<{
    id: string;
    action: string;
    resource: string | null;
    details: string | null;
    createdAt: Date;
    user: {
      name: string;
      email: string;
    } | null;
  }>;
  dailyTransactionStats: Array<{
    date: string;
    count: number;
    volume: number;
  }>;
  userRegistrationStats: Array<{
    date: string;
    count: number;
  }>;
}

export async function getBackofficeStats(days: number = 7): Promise<BackofficeStats> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get user statistics
    const [totalUsers, pendingUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'PENDING' } })
    ]);

    // Get company statistics  
    const [totalCompanies, pendingCompanies] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'PENDING_VERIFICATION' } })
    ]);

    // Get transaction statistics
    const [totalTransactions, todayTransactions] = await Promise.all([
      prisma.uSDTTransaction.count(),
      prisma.uSDTTransaction.aggregate({
        where: {
          createdAt: {
            gte: todayStart,
            lte: todayEnd
          },
          status: 'COMPLETED'
        },
        _sum: {
          brlAmount: true
        }
      })
    ]);

    // Get investment statistics
    const [totalInvestments, activeInvestments] = await Promise.all([
      prisma.investmentApplication.count(),
      prisma.investmentApplication.count({ where: { status: 'ACTIVE' } })
    ]);

    // Get recent transactions
    const recentTransactions = await prisma.uSDTTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Get recent audit logs
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Get daily transaction statistics for the last N days
    const dailyStats = await prisma.$queryRaw<Array<{
      date: string;
      count: bigint;
      volume: number;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN brl_amount IS NOT NULL THEN brl_amount ELSE 0 END), 0) as volume
      FROM usdt_transactions 
      WHERE created_at >= ${startDate}
        AND status = 'COMPLETED'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    // Get user registration statistics
    const userStats = await prisma.$queryRaw<Array<{
      date: string;
      count: bigint;
    }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    return {
      totalUsers,
      pendingUsers,
      totalTransactions,
      todayVolume: Number(todayTransactions._sum.brlAmount || 0),
      totalCompanies,
      pendingCompanies,
      totalInvestments,
      activeInvestments,
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        brlAmount: tx.brlAmount ? Number(tx.brlAmount) : null,
        status: tx.status,
        description: tx.description,
        createdAt: tx.createdAt,
        user: {
          name: tx.wallet.user.name,
          email: tx.wallet.user.email
        }
      })),
      recentAuditLogs: recentAuditLogs.map(log => ({
        id: log.id,
        action: log.action,
        resource: log.resource,
        details: log.details,
        createdAt: log.createdAt,
        user: log.user ? {
          name: log.user.name,
          email: log.user.email
        } : null
      })),
      dailyTransactionStats: dailyStats.map(stat => ({
        date: stat.date,
        count: Number(stat.count),
        volume: Number(stat.volume)
      })),
      userRegistrationStats: userStats.map(stat => ({
        date: stat.date,
        count: Number(stat.count)
      }))
    };
  } catch (error) {
    console.error('Error fetching backoffice stats:', error);
    
    // Return empty stats on error
    return {
      totalUsers: 0,
      pendingUsers: 0,
      totalTransactions: 0,
      todayVolume: 0,
      totalCompanies: 0,
      pendingCompanies: 0,
      totalInvestments: 0,
      activeInvestments: 0,
      recentTransactions: [],
      recentAuditLogs: [],
      dailyTransactionStats: [],
      userRegistrationStats: []
    };
  }
}