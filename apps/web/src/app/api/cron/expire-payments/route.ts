import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🕒 Starting payment expiration job...');

    // Calculate the cutoff time (15 minutes ago)
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    console.log(`📅 Expiring transactions older than: ${fifteenMinutesAgo.toISOString()}`);

    // Find all pending USDT transactions older than 15 minutes
    const expiredTransactions = await prisma.uSDTTransaction.findMany({
      where: {
        status: 'PENDING',
        type: 'DEPOSIT', // Only USDT purchases
        createdAt: {
          lt: fifteenMinutesAgo
        }
      },
      include: {
        wallet: {
          select: {
            userId: true
          }
        }
      }
    });

    console.log(`🔍 Found ${expiredTransactions.length} expired transactions to process`);

    if (expiredTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired transactions found',
        expiredCount: 0
      });
    }

    // Update all expired transactions to FAILED status
    const updateResult = await prisma.uSDTTransaction.updateMany({
      where: {
        id: {
          in: expiredTransactions.map(tx => tx.id)
        }
      },
      data: {
        status: 'FAILED',
        processedAt: new Date(),
        description: 'Pagamento expirado - não foi concluído em 15 minutos'
      }
    });

    console.log(`✅ Successfully expired ${updateResult.count} transactions`);

    // Log each expired transaction for audit
    for (const transaction of expiredTransactions) {
      try {
        await prisma.auditLog.create({
          data: {
            action: 'PAYMENT_EXPIRED',
            resource: 'usdt_transaction',
            resourceId: transaction.id,
            details: JSON.stringify({
              transactionId: transaction.id,
              userId: transaction.wallet.userId,
              amount: transaction.amount,
              brlAmount: transaction.brlAmount,
              pixTransactionId: transaction.pixTransactionId,
              createdAt: transaction.createdAt,
              expiredAt: new Date(),
              reason: 'Payment not completed within 15 minutes'
            }),
            ipAddress: 'system',
            userAgent: 'cron-job'
          }
        });
      } catch (auditError) {
        console.error(`⚠️ Failed to create audit log for transaction ${transaction.id}:`, auditError);
      }
    }

    // Statistics for reporting
    const stats = {
      totalExpired: updateResult.count,
      totalValue: expiredTransactions.reduce((sum, tx) => sum + Number(tx.brlAmount || 0), 0),
      userIds: [...new Set(expiredTransactions.map(tx => tx.wallet.userId))],
      oldestTransaction: expiredTransactions.reduce((oldest, tx) =>
        tx.createdAt < oldest.createdAt ? tx : oldest,
        expiredTransactions[0]
      )?.createdAt
    };

    console.log('📊 Expiration job completed:', {
      expiredCount: stats.totalExpired,
      totalValue: `R$ ${stats.totalValue}`,
      affectedUsers: stats.userIds.length,
      oldestExpired: stats.oldestTransaction
    });

    return NextResponse.json({
      success: true,
      message: `Successfully expired ${stats.totalExpired} pending payments`,
      stats: {
        expiredCount: stats.totalExpired,
        totalValue: stats.totalValue,
        affectedUsers: stats.userIds.length,
        oldestExpired: stats.oldestTransaction,
        cutoffTime: fifteenMinutesAgo.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in payment expiration job:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to expire payments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for manual testing/monitoring
export async function GET(request: NextRequest) {
  try {
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);

    // Count pending transactions that would be expired
    const pendingCount = await prisma.uSDTTransaction.count({
      where: {
        status: 'PENDING',
        type: 'DEPOSIT',
        createdAt: {
          lt: fifteenMinutesAgo
        }
      }
    });

    // Get recent expiration activity
    const recentExpirations = await prisma.auditLog.count({
      where: {
        action: 'PAYMENT_EXPIRED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    return NextResponse.json({
      success: true,
      status: {
        pendingExpirable: pendingCount,
        cutoffTime: fifteenMinutesAgo.toISOString(),
        recentExpirations24h: recentExpirations,
        nextRunSuggested: pendingCount > 0
      }
    });

  } catch (error) {
    console.error('❌ Error checking expiration status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check expiration status'
    }, { status: 500 });
  }
}