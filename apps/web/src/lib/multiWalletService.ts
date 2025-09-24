import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WalletBalances {
  usdt: {
    balance: number;
    frozenBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
  };
  pix: {
    balance: number;
    frozenBalance: number;
    totalReceived: number;
    totalSent: number;
  };
  investment: {
    totalInvested: number;
    activeInvestments: number;
    totalReturned: number;
    totalYield: number;
  };
}

export class MultiWalletService {
  
  // Buscar todos os saldos de um usuário
  async getAllBalances(userId: string): Promise<WalletBalances> {
    try {
      const [usdtWallet, pixWallet, investmentWallet] = await Promise.all([
        this.getOrCreateUSDTWallet(userId),
        this.getOrCreatePIXWallet(userId),
        this.getOrCreateInvestmentWallet(userId)
      ]);

      return {
        usdt: {
          balance: Number(usdtWallet.balance),
          frozenBalance: Number(usdtWallet.frozenBalance),
          totalDeposited: Number(usdtWallet.totalDeposited),
          totalWithdrawn: Number(usdtWallet.totalWithdrawn)
        },
        pix: {
          balance: Number(pixWallet.balance),
          frozenBalance: Number(pixWallet.frozenBalance),
          totalReceived: Number(pixWallet.totalReceived),
          totalSent: Number(pixWallet.totalSent)
        },
        investment: {
          totalInvested: Number(investmentWallet.totalInvested),
          activeInvestments: Number(investmentWallet.activeInvestments),
          totalReturned: Number(investmentWallet.totalReturned),
          totalYield: Number(investmentWallet.totalYield)
        }
      };
    } catch (error) {
      console.error('Error getting all balances:', error);
      throw error;
    }
  }

  // Carteira USDT
  async getOrCreateUSDTWallet(userId: string) {
    try {
      let wallet = await prisma.uSDTWallet.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!wallet) {
        wallet = await prisma.uSDTWallet.create({
          data: {
            userId,
            balance: 0,
            frozenBalance: 0,
            totalDeposited: 0,
            totalWithdrawn: 0
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        });
      }

      return wallet;
    } catch (error) {
      console.error('Error getting/creating USDT wallet:', error);
      throw error;
    }
  }

  // Carteira PIX (nova)
  async getOrCreatePIXWallet(userId: string) {
    try {
      // Verificar se existe na nova estrutura
      let wallet = await prisma.pIXWallet?.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }).catch(() => null);

      if (!wallet) {
        // Se não existe, criar na nova tabela
        wallet = await prisma.pIXWallet?.create({
          data: {
            userId,
            balance: 0,
            frozenBalance: 0,
            totalReceived: 0,
            totalSent: 0
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }).catch(() => null);
      }

      // Se ainda não funcionar (migration pendente), simular
      if (!wallet) {
        return {
          id: `pix_${userId}`,
          userId,
          balance: 0,
          frozenBalance: 0,
          totalReceived: 0,
          totalSent: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }

      return wallet;
    } catch (error) {
      console.error('Error getting/creating PIX wallet:', error);
      // Return empty wallet structure for now
      return {
        id: `pix_${userId}`,
        userId,
        balance: 0,
        frozenBalance: 0,
        totalReceived: 0,
        totalSent: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  // Carteira de Investimento (nova)
  async getOrCreateInvestmentWallet(userId: string) {
    try {
      // Verificar se existe na nova estrutura
      let wallet = await prisma.investmentWallet?.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }).catch(() => null);

      if (!wallet) {
        // Calcular valores existentes das aplicações
        const existingInvestments = await prisma.investmentApplication.findMany({
          where: { userId },
          select: {
            principalAmount: true,
            currentValue: true,
            accumulatedYield: true,
            status: true
          }
        });

        const totalInvested = existingInvestments
          .filter(inv => inv.status === 'ACTIVE' || inv.status === 'PENDING')
          .reduce((sum, inv) => sum + Number(inv.principalAmount), 0);

        const activeInvestments = existingInvestments
          .filter(inv => inv.status === 'ACTIVE')
          .reduce((sum, inv) => sum + Number(inv.currentValue), 0);

        const totalYield = existingInvestments
          .reduce((sum, inv) => sum + Number(inv.accumulatedYield), 0);

        // Tentar criar na nova tabela
        wallet = await prisma.investmentWallet?.create({
          data: {
            userId,
            totalInvested,
            activeInvestments,
            totalReturned: 0,
            totalYield
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }).catch(() => null);

        // Se não conseguir criar, simular (migration pendente)
        if (!wallet) {
          return {
            id: `inv_${userId}`,
            userId,
            totalInvested,
            activeInvestments,
            totalReturned: 0,
            totalYield,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      }

      return wallet;
    } catch (error) {
      console.error('Error getting/creating Investment wallet:', error);
      return {
        id: `inv_${userId}`,
        userId,
        totalInvested: 0,
        activeInvestments: 0,
        totalReturned: 0,
        totalYield: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  // Processar pagamento PIX → Saldo PIX (não USDT!)
  async processPIXPayment(userId: string, amount: number, pixTransactionId: string, description?: string) {
    try {
      console.log(`💰 Processing PIX payment: R$ ${amount} for user ${userId}`);
      
      const result = await prisma.$transaction(async (tx) => {
        // Tentar usar nova estrutura PIXWallet primeiro
        try {
          const pixWallet = await this.getOrCreatePIXWallet(userId);
          
          // Se conseguir acessar PIXWallet, usar nova estrutura
          if (pixWallet && !pixWallet.id.startsWith('pix_')) {
            const newBalance = Number(pixWallet.balance) + amount;
            
            await tx.pIXWallet.update({
              where: { userId },
              data: {
                balance: newBalance,
                totalReceived: Number(pixWallet.totalReceived) + amount
              }
            });

            const transaction = await tx.pIXTransaction.create({
              data: {
                walletId: pixWallet.id,
                type: 'RECEIVED',
                status: 'COMPLETED',
                amount: amount,
                balanceAfter: newBalance,
                pixTransactionId,
                description: description || `PIX recebido: R$ ${amount}`,
                processedAt: new Date()
              }
            });

            return { newBalance, transaction, walletType: 'PIX' };
          }
        } catch (newStructureError) {
          console.log('Nova estrutura não disponível, usando fallback para USDT wallet');
        }

        // Fallback: usar USDT wallet temporariamente
        const usdtWallet = await this.getOrCreateUSDTWallet(userId);
        const newBalance = Number(usdtWallet.balance) + amount;
        
        await tx.uSDTWallet.update({
          where: { userId },
          data: {
            balance: newBalance,
            totalDeposited: Number(usdtWallet.totalDeposited) + amount
          }
        });

        const transaction = await tx.uSDTTransaction.create({
          data: {
            walletId: usdtWallet.id,
            type: 'DEPOSIT',
            status: 'COMPLETED',
            amount: amount,
            brlAmount: amount,
            pixTransactionId,
            description: description || `PIX recebido: R$ ${amount} (temporary USDT storage)`,
            balanceAfter: newBalance,
            processedAt: new Date()
          }
        });

        return { newBalance, transaction, walletType: 'USDT_TEMPORARY' };
      });

      console.log(`✅ PIX payment processed: R$ ${amount} → Balance: R$ ${result.newBalance} (${result.walletType})`);
      
      return {
        success: true,
        newBalance: result.newBalance,
        transaction: result.transaction,
        type: 'PIX_RECEIVED',
        walletType: result.walletType
      };

    } catch (error) {
      console.error('Error processing PIX payment:', error);
      throw error;
    }
  }

  // Conversão PIX → USDT (operação separada)
  async convertPIXToUSDT(userId: string, brlAmount: number, exchangeRate: number) {
    console.log(`🔄 Converting R$ ${brlAmount} to USDT at rate ${exchangeRate}`);
    
    const usdtAmount = brlAmount * exchangeRate;
    
    return prisma.$transaction(async (tx) => {
      // Reduzir saldo PIX
      // TODO: Implementar quando PIXWallet estiver ativo
      
      // Aumentar saldo USDT
      const usdtWallet = await this.getOrCreateUSDTWallet(userId);
      const newUSDTBalance = Number(usdtWallet.balance) + usdtAmount;
      
      await tx.uSDTWallet.update({
        where: { userId },
        data: { balance: newUSDTBalance }
      });

      // Registrar conversão
      await tx.uSDTTransaction.create({
        data: {
          walletId: usdtWallet.id,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount: usdtAmount,
          brlAmount: brlAmount,
          exchangeRate: exchangeRate,
          description: `Conversão PIX→USDT: R$ ${brlAmount} → ${usdtAmount} USDT`,
          balanceAfter: newUSDTBalance,
          processedAt: new Date()
        }
      });

      return {
        success: true,
        convertedAmount: usdtAmount,
        newUSDTBalance,
        exchangeRate
      };
    });
  }

  // USDT → Investment
  async investUSDT(userId: string, usdtAmount: number, investmentPlanId: string) {
    return prisma.$transaction(async (tx) => {
      const usdtWallet = await this.getOrCreateUSDTWallet(userId);
      
      if (Number(usdtWallet.balance) < usdtAmount) {
        throw new Error('Insufficient USDT balance');
      }
      
      // Reduzir saldo USDT
      const newUSDTBalance = Number(usdtWallet.balance) - usdtAmount;
      await tx.uSDTWallet.update({
        where: { userId },
        data: {
          balance: newUSDTBalance,
          frozenBalance: Number(usdtWallet.frozenBalance) + usdtAmount
        }
      });

      // Criar aplicação de investimento
      const investment = await tx.investmentApplication.create({
        data: {
          userId,
          planId: investmentPlanId,
          principalAmount: usdtAmount,
          currentValue: usdtAmount,
          status: 'PENDING'
        }
      });

      // Registrar transação USDT
      await tx.uSDTTransaction.create({
        data: {
          walletId: usdtWallet.id,
          type: 'INVESTMENT',
          status: 'COMPLETED',
          amount: -usdtAmount,
          description: `Investimento aplicado: ${usdtAmount} USDT`,
          balanceAfter: newUSDTBalance,
          processedAt: new Date()
        }
      });

      return {
        success: true,
        investmentId: investment.id,
        newUSDTBalance,
        investedAmount: usdtAmount
      };
    });
  }
}

// Export singleton
export const multiWalletService = new MultiWalletService();