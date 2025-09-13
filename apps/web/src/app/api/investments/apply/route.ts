import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
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

    const { planId, amount, acceptedTerms } = await request.json();

    // Validate required fields
    if (!planId || !amount || !acceptedTerms) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados obrigatórios não informados',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Get investment plan
    const plan = await prisma.investmentPlan.findUnique({
      where: { id: planId }
    });

    if (!plan || !plan.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Plano de investimento não encontrado ou inativo',
          code: 'PLAN_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Validate amount
    if (amount < Number(plan.minimumAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: `Valor mínimo para este plano é ${Number(plan.minimumAmount)} USDT`,
          code: 'AMOUNT_TOO_LOW'
        },
        { status: 400 }
      );
    }

    if (plan.maximumAmount && amount > Number(plan.maximumAmount)) {
      return NextResponse.json(
        {
          success: false,
          error: `Valor máximo para este plano é ${Number(plan.maximumAmount)} USDT`,
          code: 'AMOUNT_TOO_HIGH'
        },
        { status: 400 }
      );
    }

    // Check user's USDT balance for investment
    const usdtWallet = await prisma.uSDTWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!usdtWallet) {
      return NextResponse.json(
        {
          success: false,
          error: 'Carteira USDT não encontrada',
          code: 'WALLET_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    if (Number(usdtWallet.balance) < amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Saldo USDT insuficiente para esta aplicação',
          code: 'INSUFFICIENT_BALANCE'
        },
        { status: 400 }
      );
    }

    // Get or create investment wallet
    let investmentWallet = await prisma.investmentWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!investmentWallet) {
      investmentWallet = await prisma.investmentWallet.create({
        data: {
          userId: currentUser.id
        }
      });
    }

    // Get client IP for terms acceptance
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';

    // Calculate maturity date if applicable
    const maturityDate = plan.lockPeriodDays 
      ? new Date(Date.now() + plan.lockPeriodDays * 24 * 60 * 60 * 1000)
      : null;

    // Start transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create investment application
      const application = await prisma.investmentApplication.create({
        data: {
          userId: currentUser.id,
          planId: planId,
          principalAmount: amount,
          currentValue: amount,
          status: plan.requiresApproval ? 'PENDING' : 'ACTIVE',
          maturityDate,
          acceptedTermsAt: new Date(),
          acceptedTermsIp: clientIp,
          acceptedTermsVersion: '1.0'
        }
      });

      // 2. Update USDT wallet balance (remove amount)
      await prisma.uSDTWallet.update({
        where: { id: usdtWallet.id },
        data: {
          balance: {
            decrement: amount
          }
        }
      });

      // 3. Update investment wallet (add to invested amount)
      await prisma.investmentWallet.update({
        where: { id: investmentWallet!.id },
        data: {
          totalInvested: {
            increment: amount
          },
          currentValue: {
            increment: amount
          }
        }
      });

      // 4. Create USDT transaction (outgoing)
      await prisma.uSDTTransaction.create({
        data: {
          walletId: usdtWallet.id,
          type: 'INVESTMENT',
          status: 'COMPLETED',
          amount: amount,
          balanceAfter: Number(usdtWallet.balance) - amount,
          description: `Transferência para investimento - ${plan.name}`,
          metadata: JSON.stringify({
            applicationId: application.id,
            planId: planId,
            planName: plan.name,
            targetWallet: 'investment'
          })
        }
      });

      // 5. Create investment transaction (incoming)
      await prisma.investmentTransaction.create({
        data: {
          walletId: investmentWallet!.id,
          applicationId: application.id,
          type: 'INVESTMENT',
          status: 'COMPLETED',
          amount: amount,
          balanceAfter: Number(investmentWallet!.currentValue) + amount,
          planId: planId,
          planName: plan.name,
          description: `Aplicação no plano ${plan.name}`,
          metadata: JSON.stringify({
            applicationId: application.id,
            planId: planId,
            planName: plan.name,
            sourceWallet: 'usdt'
          })
        }
      });

      return application;
    });

    console.log('💰 Investment application created:', {
      userId: currentUser.id,
      applicationId: result.id,
      planId: planId,
      amount: amount,
      status: result.status
    });

    return NextResponse.json({
      success: true,
      message: plan.requiresApproval 
        ? 'Aplicação enviada para aprovação!' 
        : 'Aplicação realizada com sucesso!',
      application: {
        id: result.id,
        planName: plan.name,
        amount: Number(result.principalAmount),
        status: result.status,
        appliedAt: result.appliedAt,
        maturityDate: result.maturityDate
      }
    });

  } catch (error) {
    console.error('❌ Error creating investment application:', error);
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