import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

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
      where: {
        userId: currentUser.id
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            type: true,
            annualYieldRate: true,
            dailyYieldRate: true,
            lockPeriodDays: true,
            hasEarlyWithdraw: true,
            earlyWithdrawFee: true
          }
        },
        yieldEntries: {
          where: {
            isPaid: true
          },
          select: {
            yieldAmount: true,
            referenceDate: true,
            paidAt: true
          },
          orderBy: {
            referenceDate: 'desc'
          },
          take: 10 // Last 10 yield payments
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    // Calculate summary statistics
    const summary = investments.reduce((acc, inv) => {
      if (inv.status === 'ACTIVE') {
        acc.totalInvested += Number(inv.principalAmount);
        acc.currentValue += Number(inv.currentValue);
        acc.totalYield += Number(inv.accumulatedYield);
        acc.activeInvestments += 1;
      }
      return acc;
    }, {
      totalInvested: 0,
      currentValue: 0,
      totalYield: 0,
      activeInvestments: 0
    });

    console.log('📊 User investments loaded:', {
      userId: currentUser.id,
      investmentsCount: investments.length,
      activeCount: summary.activeInvestments
    });

    return NextResponse.json({
      success: true,
      summary,
      investments: investments.map(inv => ({
        id: inv.id,
        planId: inv.planId,
        planName: inv.plan.name,
        planType: inv.plan.type,
        principalAmount: Number(inv.principalAmount),
        currentValue: Number(inv.currentValue),
        accumulatedYield: Number(inv.accumulatedYield),
        annualYieldRate: Number(inv.plan.annualYieldRate),
        dailyYieldRate: Number(inv.plan.dailyYieldRate),
        status: inv.status,
        appliedAt: inv.appliedAt,
        approvedAt: inv.approvedAt,
        maturityDate: inv.maturityDate,
        liquidatedAt: inv.liquidatedAt,
        lockPeriodDays: inv.plan.lockPeriodDays,
        hasEarlyWithdraw: inv.plan.hasEarlyWithdraw,
        earlyWithdrawFee: inv.plan.earlyWithdrawFee ? Number(inv.plan.earlyWithdrawFee) : null,
        recentYields: inv.yieldEntries.map(entry => ({
          amount: Number(entry.yieldAmount),
          date: entry.referenceDate,
          paidAt: entry.paidAt
        }))
      }))
    });

  } catch (error) {
    console.error('❌ Error loading user investments:', error);
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