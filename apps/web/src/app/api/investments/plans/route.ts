import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get all active investment plans available for new investments
    const plans = await prisma.investmentPlan.findMany({
      where: {
        isActive: true
      },
      include: {
        applications: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            principalAmount: true
          }
        }
      },
      orderBy: [
        { type: 'asc' },
        { annualYieldRate: 'desc' }
      ]
    });

    // Transform data for frontend consumption
    const availablePlans = plans.map(plan => {
      const activeInvestments = plan.applications || [];
      const totalInvested = activeInvestments.reduce((sum, app) => sum + Number(app.principalAmount), 0);

      return {
        id: plan.id,
        name: plan.name,
        description: plan.description || `Aplicação em USDT com rendimento ${plan.type === 'FIXED_YIELD' ? 'fixo' : plan.type === 'CDI_PEGGED' ? 'atrelado ao CDI' : 'variável'}`,
        type: plan.type,
        annualYieldRate: Number(plan.annualYieldRate),
        dailyYieldRate: Number(plan.dailyYieldRate),
        minimumAmount: Number(plan.minimumAmount),
        maximumAmount: plan.maximumAmount ? Number(plan.maximumAmount) : null,
        lockPeriodDays: plan.lockPeriodDays,
        // Additional fields for frontend compatibility
        hasEarlyWithdraw: plan.lockPeriodDays === null, // If no lock period, early withdraw is allowed
        earlyWithdrawFee: plan.lockPeriodDays ? 0.02 : null, // 2% fee if there's a lock period
        requiresApproval: false, // Could be configurable in future
        termsAndConditions: `
## Termos e Condições - ${plan.name}

### 1. Características do Investimento
- **Tipo**: ${plan.type === 'FIXED_YIELD' ? 'Rendimento Fixo' : plan.type === 'CDI_PEGGED' ? 'Atrelado ao CDI' : 'Rendimento Variável'}
- **Rendimento**: ${(Number(plan.annualYieldRate) * 100).toFixed(2)}% ao ano
- **Valor Mínimo**: ${Number(plan.minimumAmount)} USDT
- **Valor Máximo**: ${plan.maximumAmount ? `${Number(plan.maximumAmount)} USDT` : 'Sem limite'}
- **Carência**: ${plan.lockPeriodDays ? `${plan.lockPeriodDays} dias` : 'Sem carência'}

### 2. Funcionamento
- Os rendimentos são calculados diariamente sobre o saldo aplicado
- O resgate pode ser solicitado a qualquer momento ${plan.lockPeriodDays ? `após o período de carência de ${plan.lockPeriodDays} dias` : ''}
- Os valores são creditados em USDT na sua carteira

### 3. Riscos
- Investimentos em criptoativos envolvem riscos de perda
- A rentabilidade passada não garante resultados futuros
- Mantenha apenas o valor que pode se dar ao luxo de perder

### 4. Tributação
- Consulte um contador sobre as implicações tributárias
- Ganhos de capital podem estar sujeitos à tributação

Ao continuar, você declara estar ciente dos termos e riscos envolvidos.
        `,
        riskDisclosure: `
## Declaração de Riscos

### ⚠️ IMPORTANTE: LEIA ATENTAMENTE

#### Riscos Gerais
1. **Volatilidade**: Criptoativos são altamente voláteis
2. **Perda Total**: Existe risco de perda total do capital investido
3. **Liquidez**: Pode haver dificuldades de resgate em momentos de stress
4. **Regulatório**: Mudanças na regulamentação podem afetar o investimento

#### Riscos Específicos do USDT
1. **Risco de Contraparte**: USDT depende da Tether Limited
2. **Risco Regulatório**: Stablecoins podem sofrer interferências regulatórias
3. **Risco Tecnológico**: Falhas na blockchain podem afetar transações

#### Considerações Finais
- Invista apenas o que pode perder completamente
- Diversifique seus investimentos
- Mantenha-se informado sobre o mercado
- Consulte um advisor financeiro se necessário

**Este produto é destinado a investidores que compreendem e aceitam os riscos envolvidos.**
        `,
        // Statistics for display
        totalInvestors: activeInvestments.length,
        totalInvested: totalInvested,
        avgTicket: activeInvestments.length > 0 ? totalInvested / activeInvestments.length : 0
      };
    });

    console.log(`📊 Loaded ${availablePlans.length} active investment plans`);

    return NextResponse.json({
      success: true,
      plans: availablePlans,
      totalPlans: availablePlans.length,
      totalActiveInvestors: availablePlans.reduce((sum, plan) => sum + plan.totalInvestors, 0),
      totalInvested: availablePlans.reduce((sum, plan) => sum + plan.totalInvested, 0)
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