import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// DEBUG: Get acquirers for owner@exemplo.com without authentication
export async function GET(request: NextRequest) {
  try {
    // Find the user with assignments (different ID due to multiple seeds)
    const ownerUser = await prisma.user.findUnique({
      where: { id: 'cmfhqgs170004s3m22n8c0nj5' } // The one with actual assignments
    });

    if (!ownerUser) {
      return NextResponse.json({
        success: false,
        error: 'Owner user not found'
      });
    }

    // Get user's assigned acquirers (only active ones)
    const userAcquirers = await prisma.userAcquirer.findMany({
      where: { 
        userId: ownerUser.id,
        isActive: true,
        acquirer: {
          status: 'ACTIVE'
        }
      },
      include: {
        acquirer: {
          select: {
            id: true,
            name: true,
            slug: true,
            type: true,
            status: true,
            supportsDeposits: true,
            supportsWithdrawals: true,
            logoUrl: true,
            description: true,
            testMode: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' }, // Higher priority first
        { createdAt: 'asc' }   // Then by creation date
      ]
    });

    // Transform response to include only necessary info
    const assignedAcquirers = userAcquirers.map(ua => ({
      id: ua.id,
      acquirer: ua.acquirer,
      priority: ua.priority,
      dailyLimit: ua.dailyLimit,
      monthlyLimit: ua.monthlyLimit,
      totalVolume: ua.totalVolume,
      totalTransactions: ua.totalTransactions,
      lastUsedAt: ua.lastUsedAt
    }));

    // Separate by type for easier frontend handling
    const pixAcquirers = assignedAcquirers.filter(a => a.acquirer.type === 'PIX');
    const cryptoAcquirers = assignedAcquirers.filter(a => a.acquirer.type === 'CRYPTO');
    const traditionalAcquirers = assignedAcquirers.filter(a => a.acquirer.type === 'TRADITIONAL');

    return NextResponse.json({
      success: true,
      debug: 'Using owner@exemplo.com without auth',
      user: {
        id: ownerUser.id,
        email: ownerUser.email
      },
      acquirers: {
        all: assignedAcquirers,
        pix: pixAcquirers,
        crypto: cryptoAcquirers,
        traditional: traditionalAcquirers
      },
      defaultAcquirer: assignedAcquirers.length > 0 ? assignedAcquirers[0] : null
    });

  } catch (error) {
    console.error('❌ Error fetching debug acquirers:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}