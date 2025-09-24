import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;

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

    // Check if plan exists
    const existingPlan = await prisma.investmentPlan.findUnique({
      where: { id: planId },
      include: {
        applications: {
          where: { status: 'ACTIVE' },
          select: { id: true }
        }
      }
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plano de investimento não encontrado',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // If there are active investments, restrict certain changes
    const hasActiveInvestments = existingPlan.applications.length > 0;

    if (hasActiveInvestments) {
      // Only allow changing name, description, and isActive status
      // Don't allow changing yield rates or minimum amounts for plans with active investments
      if (
        annualYieldRate !== Number(existingPlan.annualYieldRate) ||
        minimumAmount !== Number(existingPlan.minimumAmount) ||
        (maximumAmount !== null && existingPlan.maximumAmount && maximumAmount !== Number(existingPlan.maximumAmount)) ||
        (lockPeriodDays !== existingPlan.lockPeriodDays)
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Não é possível alterar rendimento, valores mínimo/máximo ou carência de planos com investimentos ativos. Apenas nome, descrição e status podem ser alterados.',
            code: 'ACTIVE_INVESTMENTS_ERROR'
          },
          { status: 400 }
        );
      }
    }

    // Calculate daily yield rate
    const dailyYieldRate = annualYieldRate / 365;

    console.log('📝 Updating investment plan:', planId, {
      name,
      hasActiveInvestments,
      changes: {
        annualYieldRate: `${(annualYieldRate * 100).toFixed(2)}%`,
        isActive
      }
    });

    // Update the plan
    const updatedPlan = await prisma.investmentPlan.update({
      where: { id: planId },
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

    console.log('✅ Investment plan updated successfully:', updatedPlan.id);

    return NextResponse.json({
      success: true,
      plan: {
        id: updatedPlan.id,
        name: updatedPlan.name,
        description: updatedPlan.description,
        type: updatedPlan.type,
        annualYieldRate: Number(updatedPlan.annualYieldRate),
        dailyYieldRate: Number(updatedPlan.dailyYieldRate),
        minimumAmount: Number(updatedPlan.minimumAmount),
        maximumAmount: updatedPlan.maximumAmount ? Number(updatedPlan.maximumAmount) : null,
        lockPeriodDays: updatedPlan.lockPeriodDays,
        isActive: updatedPlan.isActive,
        updatedAt: updatedPlan.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error updating investment plan:', error);

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
        error: 'Erro interno ao atualizar plano',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;

    // Check if plan exists and has active investments
    const existingPlan = await prisma.investmentPlan.findUnique({
      where: { id: planId },
      include: {
        applications: {
          where: {
            status: { in: ['ACTIVE', 'PENDING'] }
          },
          select: { id: true, status: true }
        }
      }
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plano de investimento não encontrado',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Prevent deletion if there are active or pending investments
    if (existingPlan.applications.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Não é possível excluir planos com investimentos ativos ou pendentes. Este plano possui ${existingPlan.applications.length} investimento(s).`,
          code: 'ACTIVE_INVESTMENTS_ERROR'
        },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting investment plan:', planId, existingPlan.name);

    // Delete the plan
    await prisma.investmentPlan.delete({
      where: { id: planId }
    });

    console.log('✅ Investment plan deleted successfully:', planId);

    return NextResponse.json({
      success: true,
      message: 'Plano de investimento excluído com sucesso'
    });

  } catch (error) {
    console.error('❌ Error deleting investment plan:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao excluir plano',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = params.id;

    const plan = await prisma.investmentPlan.findUnique({
      where: { id: planId },
      include: {
        applications: {
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
          }
        }
      }
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plano de investimento não encontrado',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Calculate statistics
    const activeApplications = plan.applications.filter(app => app.status === 'ACTIVE');
    const totalInvested = activeApplications.reduce((sum, app) => sum + Number(app.principalAmount), 0);
    const totalCurrentValue = activeApplications.reduce((sum, app) => sum + Number(app.currentValue), 0);

    return NextResponse.json({
      success: true,
      plan: {
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
        // Statistics
        investorsCount: activeApplications.length,
        totalInvested: totalInvested,
        totalCurrentValue: totalCurrentValue,
        averageInvestment: activeApplications.length > 0 ? totalInvested / activeApplications.length : 0,
        applications: plan.applications.map(app => ({
          id: app.id,
          principalAmount: Number(app.principalAmount),
          currentValue: Number(app.currentValue),
          status: app.status,
          startDate: app.startDate.toISOString(),
          user: {
            name: app.wallet.user.name,
            email: app.wallet.user.email
          }
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error loading investment plan:', error);
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