import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    // Get user's investment applications with plan details
    const investments = await prisma.investmentApplication.findMany({
      where: { userId: currentUser.id },
      include: {
        plan: true,
        yieldEntries: {
          orderBy: { referenceDate: 'desc' },
          take: 30
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    // Get investment wallet
    let investmentWallet = await prisma.investmentWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!investmentWallet) {
      investmentWallet = await prisma.investmentWallet.create({
        data: { userId: currentUser.id }
      });
    }

    // Always sync wallet data with actual investments for data consistency
    if (investments.length > 0) {
      const actualTotalInvested = investments.reduce((sum, inv) => sum + Number(inv.principalAmount), 0);
      const actualCurrentValue = investments.reduce((sum, inv) => sum + Number(inv.currentValue), 0);
      const actualTotalYield = investments.reduce((sum, inv) => sum + Number(inv.accumulatedYield), 0);
      
      // Check if wallet data is inconsistent with actual investments
      const walletTotalInvested = Number(investmentWallet.totalInvested);
      const walletCurrentValue = Number(investmentWallet.currentValue);
      const walletTotalReturns = Number(investmentWallet.totalReturns);
      
      const hasInconsistency = 
        Math.abs(walletTotalInvested - actualTotalInvested) > 0.01 ||
        Math.abs(walletCurrentValue - actualCurrentValue) > 0.01 ||
        Math.abs(walletTotalReturns - actualTotalYield) > 0.01;
      
      if (hasInconsistency) {
        console.log('🔄 Syncing investment wallet data - inconsistency detected:', {
          wallet: { totalInvested: walletTotalInvested, currentValue: walletCurrentValue, totalReturns: walletTotalReturns },
          actual: { totalInvested: actualTotalInvested, currentValue: actualCurrentValue, totalYield: actualTotalYield }
        });
        
        investmentWallet = await prisma.investmentWallet.update({
          where: { id: investmentWallet.id },
          data: {
            totalInvested: actualTotalInvested,
            currentValue: actualCurrentValue,
            totalReturns: actualTotalYield
          }
        });
        
        console.log('✅ Investment wallet synced:', {
          userId: currentUser.id,
          totalInvested: actualTotalInvested,
          currentValue: actualCurrentValue,
          totalReturns: actualTotalYield
        });
      }
    }

    // Calculate performance metrics
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalYield30Days, totalYield7Days, totalApplications, activeApplications] = await Promise.all([
      prisma.yieldEntry.aggregate({
        where: {
          application: { userId: currentUser.id },
          isPaid: true,
          calculatedAt: { gte: last30Days }
        },
        _sum: { yieldAmount: true }
      }),
      prisma.yieldEntry.aggregate({
        where: {
          application: { userId: currentUser.id },
          isPaid: true,
          calculatedAt: { gte: last7Days }
        },
        _sum: { yieldAmount: true }
      }),
      prisma.investmentApplication.count({
        where: { userId: currentUser.id }
      }),
      prisma.investmentApplication.count({
        where: { 
          userId: currentUser.id,
          status: 'ACTIVE'
        }
      })
    ]);

    // Group investments by plan
    const investmentsByPlan = investments.reduce((acc, investment) => {
      const planId = investment.planId;
      if (!acc[planId]) {
        acc[planId] = {
          plan: investment.plan,
          applications: [],
          totalInvested: 0,
          currentValue: 0,
          totalYield: 0
        };
      }
      acc[planId].applications.push(investment);
      acc[planId].totalInvested += Number(investment.principalAmount);
      acc[planId].currentValue += Number(investment.currentValue);
      acc[planId].totalYield += Number(investment.accumulatedYield);
      return acc;
    }, {} as any);

    // Calculate daily performance for the last 30 days
    const dailyPerformance = await prisma.yieldEntry.findMany({
      where: {
        application: { userId: currentUser.id },
        isPaid: true,
        calculatedAt: { gte: last30Days }
      },
      orderBy: { referenceDate: 'asc' }
    });

    // Group by date
    const performanceByDate = dailyPerformance.reduce((acc, entry) => {
      const date = entry.referenceDate.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += Number(entry.yieldAmount);
      return acc;
    }, {} as Record<string, number>);

    // Calculate portfolio allocation
    const portfolioAllocation = Object.values(investmentsByPlan).map((group: any) => ({
      planName: group.plan.name,
      planType: group.plan.type,
      currentValue: group.currentValue,
      percentage: Number(investmentWallet.currentValue) > 0 
        ? (group.currentValue / Number(investmentWallet.currentValue)) * 100 
        : 0
    }));

    // Get recent transactions
    const recentTransactions = await prisma.investmentTransaction.findMany({
      where: { 
        wallet: { userId: currentUser.id }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Log data for debugging
    console.log('💰 Investment Dashboard Data:', {
      userId: currentUser.id,
      investmentWallet: {
        totalInvested: Number(investmentWallet.totalInvested),
        currentValue: Number(investmentWallet.currentValue),
        totalReturns: Number(investmentWallet.totalReturns),
        totalWithdrawn: Number(investmentWallet.totalWithdrawn)
      },
      investmentApplications: {
        count: investments.length,
        totalPrincipal: investments.reduce((sum, inv) => sum + Number(inv.principalAmount), 0),
        totalCurrent: investments.reduce((sum, inv) => sum + Number(inv.currentValue), 0),
        totalYield: investments.reduce((sum, inv) => sum + Number(inv.accumulatedYield), 0)
      }
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalInvested: Number(investmentWallet.totalInvested),
        currentValue: Number(investmentWallet.currentValue),
        totalReturns: Number(investmentWallet.totalReturns),
        totalWithdrawn: Number(investmentWallet.totalWithdrawn),
        profitLoss: Number(investmentWallet.currentValue) - Number(investmentWallet.totalInvested),
        profitLossPercentage: Number(investmentWallet.totalInvested) > 0 
          ? ((Number(investmentWallet.currentValue) - Number(investmentWallet.totalInvested)) / Number(investmentWallet.totalInvested)) * 100 
          : 0,
        yield30Days: Number(totalYield30Days._sum.yieldAmount || 0),
        yield7Days: Number(totalYield7Days._sum.yieldAmount || 0),
        totalApplications,
        activeApplications
      },
      investments: investments.map(inv => ({
        id: inv.id,
        planId: inv.planId,
        planName: inv.plan.name,
        planType: inv.plan.type,
        principalAmount: Number(inv.principalAmount),
        currentValue: Number(inv.currentValue),
        accumulatedYield: Number(inv.accumulatedYield),
        status: inv.status,
        appliedAt: inv.appliedAt,
        approvedAt: inv.approvedAt,
        maturityDate: inv.maturityDate,
        liquidatedAt: inv.liquidatedAt,
        annualYieldRate: Number(inv.plan.annualYieldRate),
        dailyYieldRate: Number(inv.plan.dailyYieldRate),
        lockPeriodDays: inv.plan.lockPeriodDays,
        hasEarlyWithdraw: inv.plan.hasEarlyWithdraw,
        recentYields: inv.yieldEntries.slice(0, 5).map(ye => ({
          id: ye.id,
          yieldAmount: Number(ye.yieldAmount),
          referenceDate: ye.referenceDate,
          calculatedAt: ye.calculatedAt,
          isPaid: ye.isPaid,
          paidAt: ye.paidAt
        }))
      })),
      investmentsByPlan: Object.values(investmentsByPlan),
      portfolioAllocation,
      dailyPerformance: Object.entries(performanceByDate).map(([date, yieldAmount]) => ({
        date,
        yield: yieldAmount
      })),
      recentTransactions: recentTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        status: tx.status,
        description: tx.description,
        planName: tx.planName,
        createdAt: tx.createdAt,
        processedAt: tx.processedAt
      }))
    });

  } catch (error) {
    console.error('❌ Error loading investment dashboard:', error);
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