import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to get current CDI rate and calculate investment rate
const getCurrentInvestmentRate = async (): Promise<number> => {
  try {
    const response = await fetch('http://localhost:3000/api/cdi/current-rate');
    const result = await response.json();
    
    if (result.success) {
      // Return the actual investment daily rate (300% of CDI)
      return Number(result.data.investment.daily);
    }
  } catch (error) {
    console.error('Error fetching CDI rate:', error);
  }
  
  // Fallback rate if API fails
  return 0.001; // 0.1% daily as fallback
};

export async function POST(req: NextRequest) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get current investment rate based on CDI
    const currentDailyRate = await getCurrentInvestmentRate();

    // Get all active investments
    const activeInvestments = await prisma.investmentApplication.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        plan: true,
        user: {
          include: {
            usdtWallet: true
          }
        }
      }
    });

    let totalYieldsGenerated = 0;
    const results = [];

    for (const investment of activeInvestments) {
      // Check if yield was already generated today
      const existingYield = await prisma.yieldEntry.findFirst({
        where: {
          applicationId: investment.id,
          referenceDate: today
        }
      });

      if (!existingYield) {
        // Use current CDI-based rate, but ensure minimum of 0% (piso)
        const effectiveDailyRate = Math.max(0, currentDailyRate);
        
        // Calculate daily yield based on current value
        const dailyYield = Number(investment.currentValue) * effectiveDailyRate;

        // Only process if there's actual yield (CDI not negative)
        if (dailyYield > 0) {
          // Create yield entry
          const yieldEntry = await prisma.yieldEntry.create({
            data: {
              applicationId: investment.id,
              baseAmount: investment.currentValue,
              yieldRate: effectiveDailyRate,
              yieldAmount: dailyYield,
              referenceDate: today
            }
          });

          // Update investment current value
          const newCurrentValue = Number(investment.currentValue) + dailyYield;
          
          await prisma.investmentApplication.update({
            where: { id: investment.id },
            data: {
              currentValue: newCurrentValue,
              accumulatedYield: {
                increment: dailyYield
              }
            }
          });

          // Update user's investment wallet with the yield
          await prisma.investmentWallet.update({
            where: { userId: investment.userId },
            data: {
              currentValue: {
                increment: dailyYield
              },
              totalReturns: {
                increment: dailyYield
              }
            }
          });

          // Update user's available USDT balance with the yield
          if (investment.user.usdtWallet) {
            await prisma.uSDTWallet.update({
              where: { id: investment.user.usdtWallet.id },
              data: {
                balance: {
                  increment: dailyYield
                }
              }
            });
          }

          totalYieldsGenerated++;
          results.push({
            investmentId: investment.id,
            userId: investment.userId,
            dailyYield: dailyYield,
            newCurrentValue: newCurrentValue,
            appliedRate: effectiveDailyRate
          });
        } else {
          // Even if no yield, create a record showing 0 yield due to negative CDI
          await prisma.yieldEntry.create({
            data: {
              applicationId: investment.id,
              amount: 0,
              referenceDate: today,
              type: 'DAILY_YIELD'
            }
          });

          results.push({
            investmentId: investment.id,
            userId: investment.userId,
            dailyYield: 0,
            newCurrentValue: Number(investment.currentValue),
            appliedRate: 0,
            reason: 'CDI negativo - piso de 0% aplicado'
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Calculated yields for ${totalYieldsGenerated} investments`,
      currentDailyRate,
      effectiveRate: Math.max(0, currentDailyRate),
      results
    });

  } catch (error) {
    console.error('Error calculating yields:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}