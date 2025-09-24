import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET /api/user/acquirers - Get current user's assigned acquirers
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Get user's assigned acquirers (only active ones)
    const userAcquirers = await prisma.userAcquirer.findMany({
      where: { 
        userId: currentUser.id,
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
      acquirers: {
        all: assignedAcquirers,
        pix: pixAcquirers,
        crypto: cryptoAcquirers,
        traditional: traditionalAcquirers
      },
      defaultAcquirer: assignedAcquirers.length > 0 ? assignedAcquirers[0] : null
    });

  } catch (error) {
    console.error('❌ Error fetching user acquirers:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}