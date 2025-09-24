import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all users who have made USDT purchases (DEPOSIT transactions)
    const users = await prisma.user.findMany({
      include: {
        usdtWallet: true,
        pixWallet: true,
        usdtTransactions: {
          where: {
            type: 'DEPOSIT',
            status: 'COMPLETED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Get only the most recent purchase for lastPurchaseDate
        }
      }
    });

    // Filter users who have made at least one USDT purchase and calculate stats
    const purchaserUsers = await Promise.all(
      users
        .filter(user => user.usdtTransactions.length > 0) // Only users with completed purchases
        .map(async (user) => {
          // Calculate total purchases amount
          const totalPurchasesResult = await prisma.uSDTTransaction.aggregate({
            where: {
              wallet: {
                userId: user.id
              },
              type: 'DEPOSIT',
              status: 'COMPLETED'
            },
            _sum: {
              brlAmount: true
            }
          });

          return {
            id: user.id,
            name: user.name || 'Usuário',
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            usdtBalance: user.usdtWallet?.balance ? Number(user.usdtWallet.balance) : 0,
            pixBalance: user.pixWallet?.balance ? Number(user.pixWallet.balance) : 0,
            totalPurchases: totalPurchasesResult._sum.brlAmount ? Number(totalPurchasesResult._sum.brlAmount) : 0,
            lastPurchaseDate: user.usdtTransactions[0]?.createdAt || null
          };
        })
    );

    // Sort by total purchases descending
    purchaserUsers.sort((a, b) => b.totalPurchases - a.totalPurchases);

    console.log(`📊 Found ${purchaserUsers.length} users who made USDT purchases`);

    return NextResponse.json({
      success: true,
      users: purchaserUsers,
      stats: {
        totalUsers: purchaserUsers.length,
        activeUsers: purchaserUsers.filter(u => u.status === 'ACTIVE').length,
        totalVolume: purchaserUsers.reduce((sum, user) => sum + user.totalPurchases, 0),
        totalUSDT: purchaserUsers.reduce((sum, user) => sum + user.usdtBalance, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error loading purchaser users:', error);
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