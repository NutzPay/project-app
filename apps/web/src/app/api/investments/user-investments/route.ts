import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token não encontrado' },
        { status: 401 }
      );
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'temp-secret-key-for-dev') as any;
    const userId = decoded.userId;

    // Get user's investment applications with related data
    const investments = await prisma.investmentApplication.findMany({
      where: {
        userId: userId
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            description: true,
            annualYieldRate: true,
            dailyYieldRate: true,
            lockPeriodDays: true,
            hasEarlyWithdraw: true,
            earlyWithdrawFee: true
          }
        },
        yieldEntries: {
          orderBy: {
            referenceDate: 'desc'
          },
          take: 7 // Last 7 days of yields
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate additional metrics for each investment
    const investmentSummary = investments.map(investment => {
      const daysSinceApplication = Math.floor(
        (Date.now() - investment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const totalYieldGenerated = Number(investment.totalYieldEarned || 0);
      const currentValue = Number(investment.currentValue);
      const principalAmount = Number(investment.principalAmount);
      const yieldPercentage = principalAmount > 0 ? (totalYieldGenerated / principalAmount) * 100 : 0;

      // Check if in lock period
      const isLocked = investment.plan.lockPeriodDays 
        ? daysSinceApplication < investment.plan.lockPeriodDays 
        : false;

      const daysUntilUnlock = isLocked && investment.plan.lockPeriodDays 
        ? investment.plan.lockPeriodDays - daysSinceApplication 
        : 0;

      return {
        id: investment.id,
        planName: investment.plan.name,
        planDescription: investment.plan.description,
        principalAmount: principalAmount,
        currentValue: currentValue,
        totalYieldEarned: totalYieldGenerated,
        yieldPercentage: yieldPercentage,
        status: investment.status,
        createdAt: investment.createdAt,
        approvedAt: investment.approvedAt,
        daysSinceApplication,
        isLocked,
        daysUntilUnlock,
        canWithdrawEarly: investment.plan.hasEarlyWithdraw,
        earlyWithdrawFee: investment.plan.earlyWithdrawFee ? Number(investment.plan.earlyWithdrawFee) : null,
        dailyYieldRate: Number(investment.plan.dailyYieldRate),
        annualYieldRate: Number(investment.plan.annualYieldRate),
        recentYields: investment.yieldEntries.map(yield_ => ({
          date: yield_.referenceDate,
          amount: Number(yield_.yieldAmount),
          type: 'DAILY_YIELD'
        }))
      };
    });

    // Calculate portfolio summary
    const portfolioStats = {
      totalInvested: investmentSummary.reduce((sum, inv) => sum + inv.principalAmount, 0),
      currentValue: investmentSummary.reduce((sum, inv) => sum + inv.currentValue, 0),
      totalYields: investmentSummary.reduce((sum, inv) => sum + inv.totalYieldEarned, 0),
      activeInvestments: investmentSummary.filter(inv => inv.status === 'ACTIVE').length,
      pendingInvestments: investmentSummary.filter(inv => inv.status === 'PENDING').length
    };

    portfolioStats.totalReturn = portfolioStats.totalInvested > 0 
      ? (portfolioStats.totalYields / portfolioStats.totalInvested) * 100 
      : 0;

    return NextResponse.json({
      success: true,
      investments: investmentSummary,
      portfolioStats
    });

  } catch (error) {
    console.error('Error fetching user investments:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}