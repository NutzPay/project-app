import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando migração de carteiras via API...');
    
    // Buscar todos os usuários
    const allUsers = await prisma.user.findMany({
      include: {
        usdtWallet: true,
        pixWallet: true,
        investmentWallet: true,
        investments: {
          select: {
            principalAmount: true,
            currentValue: true,
            accumulatedYield: true,
            status: true
          }
        }
      }
    });

    console.log(`📊 Encontrados ${allUsers.length} usuários`);

    const results = {
      processedUsers: 0,
      migratedUsers: 0,
      pixWalletsCreated: 0,
      investmentWalletsCreated: 0,
      errors: []
    };

    for (const user of allUsers) {
      results.processedUsers++;
      let userMigrated = false;
      
      try {
        // Criar PIX Wallet se não existir
        if (!user.pixWallet) {
          const pixWallet = await prisma.pIXWallet.create({
            data: {
              userId: user.id,
              balance: 0,
              frozenBalance: 0,
              totalReceived: 0,
              totalSent: 0
            }
          });
          
          results.pixWalletsCreated++;
          userMigrated = true;
          console.log(`✅ PIX Wallet criado para ${user.email}`);
        }

        // Criar Investment Wallet se não existir
        if (!user.investmentWallet) {
          // Calcular valores dos investimentos existentes
          const totalInvested = user.investments
            .filter(inv => inv.status === 'ACTIVE' || inv.status === 'PENDING')
            .reduce((sum, inv) => sum + Number(inv.principalAmount), 0);

          const activeInvestments = user.investments
            .filter(inv => inv.status === 'ACTIVE')
            .reduce((sum, inv) => sum + Number(inv.currentValue), 0);

          const totalYield = user.investments
            .reduce((sum, inv) => sum + Number(inv.accumulatedYield), 0);

          const investmentWallet = await prisma.investmentWallet.create({
            data: {
              userId: user.id,
              totalInvested: totalInvested,
              activeInvestments: activeInvestments,
              totalReturned: 0,
              totalYield: totalYield
            }
          });
          
          results.investmentWalletsCreated++;
          userMigrated = true;
          console.log(`✅ Investment Wallet criado para ${user.email}:`, {
            totalInvested,
            activeInvestments,
            totalYield
          });
        }

        if (userMigrated) {
          results.migratedUsers++;
        }

      } catch (error) {
        const errorMsg = `Erro ao migrar ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error('❌', errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // Verificar usuário específico felixelmada@gmail.com
    const felixUser = await prisma.user.findUnique({
      where: { email: 'felixelmada@gmail.com' },
      include: {
        usdtWallet: true,
        pixWallet: true,
        investmentWallet: true
      }
    });

    const felixStatus = felixUser ? {
      exists: true,
      email: felixUser.email,
      wallets: {
        usdt: felixUser.usdtWallet ? {
          balance: Number(felixUser.usdtWallet.balance),
          totalDeposited: Number(felixUser.usdtWallet.totalDeposited)
        } : null,
        pix: felixUser.pixWallet ? {
          balance: Number(felixUser.pixWallet.balance),
          totalReceived: Number(felixUser.pixWallet.totalReceived)
        } : null,
        investment: felixUser.investmentWallet ? {
          totalInvested: Number(felixUser.investmentWallet.totalInvested),
          activeInvestments: Number(felixUser.investmentWallet.activeInvestments),
          totalYield: Number(felixUser.investmentWallet.totalYield)
        } : null
      }
    } : { exists: false };

    console.log('🎉 Migração API concluída!', results);

    return NextResponse.json({
      success: true,
      message: 'Migração de carteiras concluída',
      results,
      felixStatus
    });

  } catch (error) {
    console.error('💥 Erro na migração API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido na migração'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar status das carteiras sem fazer migração
    const userStats = await prisma.$transaction(async (tx) => {
      const totalUsers = await tx.user.count();
      const usersWithUSDT = await tx.user.count({
        where: { usdtWallet: { isNot: null } }
      });
      const usersWithPIX = await tx.user.count({
        where: { pixWallet: { isNot: null } }
      });
      const usersWithInvestment = await tx.user.count({
        where: { investmentWallet: { isNot: null } }
      });

      return {
        totalUsers,
        usersWithUSDT,
        usersWithPIX,
        usersWithInvestment,
        needsMigration: totalUsers - Math.max(usersWithPIX, usersWithInvestment)
      };
    });

    // Status específico do felix
    const felixUser = await prisma.user.findUnique({
      where: { email: 'felixelmada@gmail.com' },
      include: {
        usdtWallet: true,
        pixWallet: true,
        investmentWallet: true
      }
    });

    return NextResponse.json({
      success: true,
      stats: userStats,
      felixStatus: felixUser ? {
        email: felixUser.email,
        hasUSDTWallet: !!felixUser.usdtWallet,
        hasPIXWallet: !!felixUser.pixWallet,
        hasInvestmentWallet: !!felixUser.investmentWallet,
        wallets: {
          usdt: felixUser.usdtWallet ? Number(felixUser.usdtWallet.balance) : null,
          pix: felixUser.pixWallet ? Number(felixUser.pixWallet.balance) : null,
          investment: felixUser.investmentWallet ? Number(felixUser.investmentWallet.totalInvested) : null
        }
      } : null
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}