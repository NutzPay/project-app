import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all investment plans with calculated statistics
    const plans = await prisma.investmentPlan.findMany({
      include: {
        applications: {
          select: {
            id: true,
            principalAmount: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform data and calculate statistics
    const plansWithStats = plans.map(plan => {
      const activeApplications = plan.applications.filter(app => app.status === 'ACTIVE');
      const totalInvested = activeApplications.reduce((sum, app) => sum + Number(app.principalAmount), 0);

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        type: plan.type,
        annualYieldRate: Number(plan.annualYieldRate),
        dailyYieldRate: Number(plan.dailyYieldRate),
        minimumAmount: Number(plan.minimumAmount),
        maximumAmount: plan.maximumAmount ? Number(plan.maximumAmount) : null,
        lockPeriodDays: plan.lockPeriodDays,
        isActive: plan.isActive,
        createdAt: plan.createdAt.toISOString(),
        updatedAt: plan.updatedAt.toISOString(),
        // Calculated fields
        investorsCount: activeApplications.length,
        totalInvested: totalInvested,
        averageInvestment: activeApplications.length > 0 ? totalInvested / activeApplications.length : 0
      };
    });

    console.log(`📊 Loaded ${plansWithStats.length} investment plans`);

    return NextResponse.json({
      success: true,
      plans: plansWithStats
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

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      type,
      annualYieldRate,
      minimumAmount,
      maximumAmount,
      lockPeriodDays,
      isActive
    } = await request.json();

    // Validation
    if (!name || !type || !annualYieldRate || !minimumAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: name, type, annualYieldRate, minimumAmount',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (annualYieldRate <= 0 || annualYieldRate >= 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Taxa anual deve ser entre 0.01% (0.0001) e 100% (1.0)',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (minimumAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valor mínimo deve ser maior que zero',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    if (maximumAmount && maximumAmount <= minimumAmount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valor máximo deve ser maior que o mínimo',
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    // Calculate daily yield rate
    const dailyYieldRate = annualYieldRate / 365;

    console.log('📝 Creating new investment plan:', {
      name,
      type,
      annualYieldRate: `${(annualYieldRate * 100).toFixed(2)}%`,
      dailyYieldRate: `${(dailyYieldRate * 100).toFixed(4)}%`,
      minimumAmount: `${minimumAmount} USDT`,
      maximumAmount: maximumAmount ? `${maximumAmount} USDT` : 'unlimited'
    });

    // Create the plan
    const newPlan = await prisma.investmentPlan.create({
      data: {
        name,
        description,
        type,
        annualYieldRate: annualYieldRate,
        dailyYieldRate: dailyYieldRate,
        minimumAmount: minimumAmount,
        maximumAmount: maximumAmount,
        lockPeriodDays: lockPeriodDays,
        isActive: isActive ?? true
      }
    });

    console.log('✅ Investment plan created successfully:', newPlan.id);

    return NextResponse.json({
      success: true,
      plan: {
        id: newPlan.id,
        name: newPlan.name,
        description: newPlan.description,
        type: newPlan.type,
        annualYieldRate: Number(newPlan.annualYieldRate),
        dailyYieldRate: Number(newPlan.dailyYieldRate),
        minimumAmount: Number(newPlan.minimumAmount),
        maximumAmount: newPlan.maximumAmount ? Number(newPlan.maximumAmount) : null,
        lockPeriodDays: newPlan.lockPeriodDays,
        isActive: newPlan.isActive,
        createdAt: newPlan.createdAt.toISOString(),
        updatedAt: newPlan.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error creating investment plan:', error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Já existe um plano com este nome',
          code: 'DUPLICATE_ERROR'
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao criar plano',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}