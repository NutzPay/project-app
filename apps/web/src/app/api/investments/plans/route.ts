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

    // Get active investment plans
    const plans = await prisma.investmentPlan.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        annualYieldRate: true,
        minimumAmount: true,
        lockPeriodDays: true,
        createdAt: true
      },
      orderBy: {
        annualYieldRate: 'desc'
      }
    });

    console.log('📊 Investment plans loaded:', {
      userId: currentUser.id,
      plansCount: plans.length
    });

    return NextResponse.json({
      success: true,
      plans: plans.map(plan => ({
        ...plan,
        annualYieldRate: Number(plan.annualYieldRate),
        minimumAmount: Number(plan.minimumAmount),
        // Calculate daily yield rate from annual rate
        dailyYieldRate: Number(plan.annualYieldRate) / 365,
        // Set default values for missing fields
        maximumAmount: null,
        hasEarlyWithdraw: false,
        earlyWithdrawFee: null,
        requiresApproval: false,
        termsAndConditions: null,
        riskDisclosure: null
      }))
    });

  } catch (error) {
    console.error('❌ Error loading investment plans:', error);
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