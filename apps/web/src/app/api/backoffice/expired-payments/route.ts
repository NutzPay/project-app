import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all expired USDT transactions (FAILED status with specific description)
    const expiredPayments = await prisma.uSDTTransaction.findMany({
      where: {
        status: 'FAILED',
        type: 'DEPOSIT',
        OR: [
          {
            description: {
              contains: 'expirado'
            }
          },
          {
            description: {
              contains: 'expired'
            }
          }
        ]
      },
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
      },
      orderBy: {
        processedAt: 'desc'
      },
      take: 100 // Limit to last 100 expired payments
    });

    console.log(`📊 Found ${expiredPayments.length} expired payments`);

    // Calculate statistics
    const stats = {
      totalExpired: expiredPayments.length,
      totalValue: expiredPayments.reduce((sum, payment) => sum + Number(payment.brlAmount || 0), 0),
      totalUSDT: expiredPayments.reduce((sum, payment) => sum + Number(payment.amount), 0),
      last24Hours: expiredPayments.filter(payment => {
        if (!payment.processedAt) return false;
        const processedDate = new Date(payment.processedAt);
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return processedDate > oneDayAgo;
      }).length,
      averageValue: expiredPayments.length > 0
        ? expiredPayments.reduce((sum, payment) => sum + Number(payment.brlAmount || 0), 0) / expiredPayments.length
        : 0
    };

    return NextResponse.json({
      success: true,
      payments: expiredPayments.map(payment => ({
        id: payment.id,
        amount: Number(payment.amount),
        brlAmount: Number(payment.brlAmount || 0),
        pixTransactionId: payment.pixTransactionId,
        createdAt: payment.createdAt,
        processedAt: payment.processedAt,
        description: payment.description,
        wallet: {
          user: {
            name: payment.wallet.user.name || 'Usuário',
            email: payment.wallet.user.email
          }
        }
      })),
      stats
    });

  } catch (error) {
    console.error('❌ Error loading expired payments:', error);
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

// POST endpoint to manually trigger expiration for testing
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual expiration trigger called');

    // Call the cron job endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const cronResponse = await fetch(`${baseUrl}/api/cron/expire-payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const cronResult = await cronResponse.json();

    if (cronResult.success) {
      console.log('✅ Manual expiration completed:', cronResult.stats);
      return NextResponse.json({
        success: true,
        message: 'Manual expiration completed successfully',
        stats: cronResult.stats
      });
    } else {
      throw new Error(cronResult.error || 'Cron job failed');
    }

  } catch (error) {
    console.error('❌ Error in manual expiration:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao executar expiração manual',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}