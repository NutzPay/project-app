import { NextRequest, NextResponse } from 'next/server';

// Simulação da taxa CDI - em produção, você consumiria uma API externa real
const getCurrentCDIRate = async (): Promise<number> => {
  try {
    // Aqui você faria uma chamada para uma API real como:
    // - Banco Central do Brasil
    // - B3 (Brasil, Bolsa, Balcão)
    // - Ou outro provedor de dados financeiros
    
    // Por enquanto, vamos simular com uma taxa realista (CDI anual em decimal)
    const mockCDIAnnualRate = 0.1275; // 12.75% ao ano
    
    return mockCDIAnnualRate;
  } catch (error) {
    console.error('Erro ao buscar taxa CDI:', error);
    // Taxa CDI padrão em caso de erro
    return 0.1275; // 12.75% ao ano
  }
};

export async function GET(req: NextRequest) {
  try {
    const annualCDIRate = await getCurrentCDIRate();
    
    // Converte para taxa diária usando juros compostos
    // Formula: (1 + taxa_anual)^(1/365) - 1
    const dailyCDIRate = Math.pow(1 + annualCDIRate, 1/365) - 1;
    
    // Para investimento 300% do CDI
    const investmentMultiplier = 3.0;
    const investmentDailyRate = dailyCDIRate * investmentMultiplier;
    
    // Calcula taxa mensal para exibição
    const monthlyCDIRate = Math.pow(1 + annualCDIRate, 1/12) - 1;
    const investmentMonthlyRate = Math.pow(1 + investmentDailyRate, 30) - 1;
    
    return NextResponse.json({
      success: true,
      data: {
        cdi: {
          annual: annualCDIRate,
          monthly: monthlyCDIRate,
          daily: dailyCDIRate,
          annualPercentage: (annualCDIRate * 100).toFixed(2),
          monthlyPercentage: (monthlyCDIRate * 100).toFixed(4),
          dailyPercentage: (dailyCDIRate * 100).toFixed(6)
        },
        investment: {
          multiplier: investmentMultiplier,
          annual: investmentDailyRate * 365, // Aproximação
          monthly: investmentMonthlyRate,
          daily: investmentDailyRate,
          annualPercentage: (investmentDailyRate * 365 * 100).toFixed(2),
          monthlyPercentage: (investmentMonthlyRate * 100).toFixed(4),
          dailyPercentage: (investmentDailyRate * 100).toFixed(6)
        },
        lastUpdated: new Date().toISOString(),
        source: 'Simulação - BCB/B3'
      }
    });
    
  } catch (error) {
    console.error('Erro na API CDI:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}