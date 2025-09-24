import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Calculate dynamic user statistics from real transaction data
async function calculateUserStats(userId: string, allTransactions: any[]) {
  try {
    // Get all transactions for comprehensive stats (not just paginated)
    const [usdtWallet, pixWallet, investmentWallet] = await Promise.all([
      prisma.uSDTWallet.findUnique({ where: { userId } }),
      prisma.pIXWallet.findUnique({ where: { userId } }),
      prisma.investmentWallet.findUnique({ where: { userId } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let totalVolume = 0;
    let completedToday = 0;
    let pendingCount = 0;
    let totalFees = 0;
    let completedTransactions = [];

    // Get all transactions for full calculations
    const allUserTransactions = [];

    if (usdtWallet) {
      const usdtTxs = await prisma.uSDTTransaction.findMany({
        where: { walletId: usdtWallet.id },
      });
      allUserTransactions.push(...usdtTxs.map(tx => ({
        ...tx,
        type: 'USDT',
        numericAmount: parseFloat(tx.amount.toString())
      })));
    }

    if (pixWallet) {
      const pixTxs = await prisma.pIXTransaction.findMany({
        where: { walletId: pixWallet.id },
      });
      allUserTransactions.push(...pixTxs.map(tx => ({
        ...tx,
        type: 'PIX',
        numericAmount: parseFloat(tx.amount.toString())
      })));
    }

    if (investmentWallet) {
      const invTxs = await prisma.investmentTransaction.findMany({
        where: { walletId: investmentWallet.id },
      });
      allUserTransactions.push(...invTxs.map(tx => ({
        ...tx,
        type: 'INVESTMENT',
        numericAmount: parseFloat(tx.amount.toString())
      })));
    }

    // Calculate stats from all transactions
    for (const tx of allUserTransactions) {
      // Total volume (all completed transactions)
      if (tx.status === 'COMPLETED') {
        totalVolume += tx.numericAmount;
        completedTransactions.push(tx);

        // Completed today
        if (tx.processedAt && tx.processedAt >= today && tx.processedAt < tomorrow) {
          completedToday++;
        }
      }

      // Pending transactions
      if (tx.status === 'PENDING' || tx.status === 'PROCESSING') {
        pendingCount++;
      }

      // Fees (estimate 1% for PIX, 2% for USDT, 0.5% for investments)
      if (tx.status === 'COMPLETED') {
        if (tx.type === 'PIX') totalFees += tx.numericAmount * 0.01;
        else if (tx.type === 'USDT') totalFees += tx.numericAmount * 0.02;
        else if (tx.type === 'INVESTMENT') totalFees += tx.numericAmount * 0.005;
      }
    }

    // Calculate average
    const averageValue = completedTransactions.length > 0
      ? totalVolume / completedTransactions.length
      : 0;

    return {
      totalTransactions: allUserTransactions.length,
      totalVolume: totalVolume,
      completedToday: completedToday,
      pendingTransactions: pendingCount,
      averageValue: averageValue,
      totalFees: totalFees
    };

  } catch (error) {
    console.error('Error calculating stats:', error);
    // Return fallback stats
    return {
      totalTransactions: allTransactions.length,
      totalVolume: 0,
      completedToday: 0,
      pendingTransactions: allTransactions.filter(t => t.status === 'PENDING').length,
      averageValue: 0,
      totalFees: 0
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
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

    console.log('✅ User authenticated for transactions:', {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role
    });

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    const transactions = [];

    // Get USDT transactions
    if (!type || type === 'USDT') {
      const usdtWallet = await prisma.uSDTWallet.findUnique({
        where: { userId: currentUser.id },
      });

      if (usdtWallet) {
        const statusFilter = status ? { equals: status as any } : undefined;
        const usdtTransactions = await prisma.uSDTTransaction.findMany({
          where: {
            walletId: usdtWallet.id,
            ...(statusFilter && { status: statusFilter }),
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        transactions.push(
          ...usdtTransactions.map((tx) => ({
            id: tx.id,
            type: 'USDT',
            subtype: tx.type,
            status: tx.status,
            amount: tx.amount,
            description: tx.description,
            createdAt: tx.createdAt,
            processedAt: tx.processedAt,
            updatedAt: tx.updatedAt,
          }))
        );
      }
    }

    // Get PIX transactions
    if (!type || type === 'PIX') {
      const pixWallet = await prisma.pIXWallet.findUnique({
        where: { userId: currentUser.id },
      });

      if (pixWallet) {
        const statusFilter = status ? { equals: status as any } : undefined;
        const pixTransactions = await prisma.pIXTransaction.findMany({
          where: {
            walletId: pixWallet.id,
            ...(statusFilter && { status: statusFilter }),
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        transactions.push(
          ...pixTransactions.map((tx) => ({
            id: tx.id,
            type: 'PIX',
            subtype: tx.type,
            status: tx.status,
            amount: tx.amount,
            description: tx.description,
            createdAt: tx.createdAt,
            processedAt: tx.processedAt,
            updatedAt: tx.updatedAt,
          }))
        );
      }
    }

    // Get Investment transactions
    if (!type || type === 'INVESTMENT') {
      const investmentWallet = await prisma.investmentWallet.findUnique({
        where: { userId: currentUser.id },
      });

      if (investmentWallet) {
        const statusFilter = status ? { equals: status as any } : undefined;
        const investmentTransactions = await prisma.investmentTransaction.findMany({
          where: {
            walletId: investmentWallet.id,
            ...(statusFilter && { status: statusFilter }),
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        transactions.push(
          ...investmentTransactions.map((tx) => ({
            id: tx.id,
            type: 'INVESTMENT',
            subtype: tx.type,
            status: tx.status,
            amount: tx.amount,
            description: tx.description,
            createdAt: tx.createdAt,
            processedAt: tx.processedAt,
            updatedAt: tx.updatedAt,
          }))
        );
      }
    }

    // Sort all transactions by createdAt descending
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination to the combined results
    const paginatedTransactions = transactions.slice(0, limit);
    const total = transactions.length;
    const totalPages = Math.ceil(total / limit);

    // Calculate dynamic statistics
    const stats = await calculateUserStats(currentUser.id, transactions);

    console.log('📋 Transactions loaded from database:', {
      userId: currentUser.id,
      count: transactions.length,
      page,
      limit,
      stats
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        stats
      },
      message: 'Transactions retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
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