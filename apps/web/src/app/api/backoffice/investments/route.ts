import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) { // TODO: Restore admin check: || currentUser.role !== 'ADMIN'
      return NextResponse.json(
        { 
          success: false,
          error: 'Acesso não autorizado',
          code: 'UNAUTHORIZED'
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'month';

    // Calculate date range based on period
    const now = new Date();
    let dateFilter: Date;
    
    switch (period) {
      case 'today':
        dateFilter = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch all data in parallel
    const [
      totalPlans,
      activePlans,
      totalInvestors,
      activeInvestors,
      investmentSummary,
      recentApplications,
      withdrawalRequests,
      yieldSummary,
      planStats
    ] = await Promise.all([
      // Total investment plans
      prisma.investmentPlan.count(),
      
      // Active investment plans
      prisma.investmentPlan.count({
        where: { isActive: true }
      }),
      
      // Total unique investors
      prisma.investmentApplication.findMany({
        select: { userId: true },
        distinct: ['userId']
      }).then(users => users.length),
      
      // Active investors (filtered by period)
      prisma.investmentApplication.findMany({
        where: { 
          status: 'ACTIVE',
          appliedAt: { gte: dateFilter }
        },
        select: { userId: true },
        distinct: ['userId']
      }).then(users => users.length),
      
      // Investment summary (filtered by period)
      prisma.investmentApplication.aggregate({
        where: {
          appliedAt: { gte: dateFilter }
        },
        _sum: {
          principalAmount: true,
          currentValue: true,
          accumulatedYield: true
        },
        _count: true
      }),
      
      // Recent applications (for activity)
      prisma.investmentApplication.findMany({
        where: {
          appliedAt: { gte: dateFilter }
        },
        include: {
          user: {
            select: { email: true }
          },
          plan: {
            select: { name: true }
          }
        },
        orderBy: { appliedAt: 'desc' },
        take: 10
      }),
      
      // Withdrawal requests count
      prisma.investmentApplication.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      // Yield summary for the period
      prisma.yieldEntry.aggregate({
        where: {
          createdAt: { gte: dateFilter },
          isPaid: true
        },
        _sum: { yieldAmount: true },
        _count: true
      }),
      
      // Plans with their statistics
      prisma.investmentPlan.findMany({
        include: {
          applications: {
            select: {
              principalAmount: true,
              currentValue: true,
              accumulatedYield: true,
              status: true
            }
          }
        }
      })
    ]);

    // Calculate statistics
    const totalInvested = Number(investmentSummary._sum.principalAmount || 0);
    const totalCurrentValue = Number(investmentSummary._sum.currentValue || 0);
    const totalReturns = Number(investmentSummary._sum.accumulatedYield || 0);
    const totalYieldInPeriod = Number(yieldSummary._sum.yieldAmount || 0);

    // Calculate average return rate
    const avgReturnRate = totalInvested > 0 ? ((totalCurrentValue - totalInvested) / totalInvested) * 100 : 0;
    
    // Calculate monthly growth (simplified)
    const monthlyGrowth = period === 'month' && totalInvested > 0 
      ? (totalYieldInPeriod / totalInvested) * 100 
      : 0;

    // Transform plans data
    const plans = planStats.map(plan => {
      const totalPlanInvested = plan.applications.reduce((sum, app) => sum + Number(app.principalAmount), 0);
      const activePlanInvestors = plan.applications.filter(app => app.status === 'ACTIVE').length;
      
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        dailyYieldRate: Number(plan.dailyYieldRate) * 100,
        minAmount: Number(plan.minimumAmount),
        maxAmount: Number(plan.maximumAmount || 0),
        durationDays: plan.lockPeriodDays,
        totalInvested: totalPlanInvested,
        investorsCount: activePlanInvestors
      };
    });

    // Transform recent activity
    const recentActivity = recentApplications.map(app => ({
      id: app.id,
      type: 'new_investment',
      description: `Novo investimento em ${app.plan.name}`,
      user: app.user.email.split('@')[0], // Hide email domain for privacy
      plan: app.plan.name,
      amount: Number(app.principalAmount),
      timestamp: app.appliedAt.toISOString()
    }));

    const stats = {
      totalInvestments: investmentSummary._count,
      activeInvestments: activeInvestors,
      totalInvested,
      totalYield: totalReturns,
      monthlyReturn: Number(avgReturnRate.toFixed(2)),
      plansAvailable: activePlans,
      investorsCount: totalInvestors,
      withdrawalRequests: withdrawalRequests,
      totalCurrentValue: totalCurrentValue
    };

    console.log('📊 Backoffice investment stats loaded:', {
      period,
      stats: {
        totalInvested: stats.totalInvested,
        totalInvestors: stats.investorsCount,
        totalPlans: stats.plansAvailable,
        avgReturnRate: stats.monthlyReturn
      }
    });

    return NextResponse.json({
      success: true,
      stats,
      plans,
      recentActivity
    });

  } catch (error) {
    console.error('❌ Error loading investments:', error);
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