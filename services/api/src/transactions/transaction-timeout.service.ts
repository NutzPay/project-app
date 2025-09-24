import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TransactionTimeoutService {
  private readonly logger = new Logger(TransactionTimeoutService.name);

  // Timeout em minutos para transações pendentes
  private readonly TRANSACTION_TIMEOUT_MINUTES = 15;

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Executa verificação de timeout a cada 5 minutos
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async checkPendingTransactions() {
    this.logger.log('🕒 Iniciando verificação de timeouts de transações...');

    try {
      const timeoutDate = new Date(Date.now() - (this.TRANSACTION_TIMEOUT_MINUTES * 60 * 1000));

      // Verificar transações USDT pendentes
      const expiredUSDTTransactions = await this.findExpiredUSDTTransactions(timeoutDate);

      // Verificar transações PIX pendentes
      const expiredPIXTransactions = await this.findExpiredPIXTransactions(timeoutDate);

      // Verificar transações de investimento pendentes
      const expiredInvestmentTransactions = await this.findExpiredInvestmentTransactions(timeoutDate);

      let totalExpired = 0;

      // Processar timeouts USDT
      if (expiredUSDTTransactions.length > 0) {
        await this.processUSDTTimeouts(expiredUSDTTransactions);
        totalExpired += expiredUSDTTransactions.length;
      }

      // Processar timeouts PIX
      if (expiredPIXTransactions.length > 0) {
        await this.processPIXTimeouts(expiredPIXTransactions);
        totalExpired += expiredPIXTransactions.length;
      }

      // Processar timeouts de investimento
      if (expiredInvestmentTransactions.length > 0) {
        await this.processInvestmentTimeouts(expiredInvestmentTransactions);
        totalExpired += expiredInvestmentTransactions.length;
      }

      if (totalExpired > 0) {
        this.logger.warn(`⏰ ${totalExpired} transações expiradas por timeout`);
      } else {
        this.logger.log('✅ Nenhuma transação expirada encontrada');
      }

    } catch (error) {
      this.logger.error('❌ Erro ao verificar timeouts de transações', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  private async findExpiredUSDTTransactions(timeoutDate: Date) {
    return await this.prisma.uSDTTransaction.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING']
        },
        createdAt: {
          lt: timeoutDate
        }
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });
  }

  private async findExpiredPIXTransactions(timeoutDate: Date) {
    return await this.prisma.pIXTransaction.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING']
        },
        createdAt: {
          lt: timeoutDate
        }
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });
  }

  private async findExpiredInvestmentTransactions(timeoutDate: Date) {
    return await this.prisma.investmentTransaction.findMany({
      where: {
        status: {
          in: ['PENDING', 'PROCESSING']
        },
        createdAt: {
          lt: timeoutDate
        }
      },
      include: {
        wallet: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        }
      }
    });
  }

  private async processUSDTTimeouts(transactions: any[]) {
    this.logger.log(`📱 Processando ${transactions.length} timeouts USDT...`);

    for (const transaction of transactions) {
      try {
        await this.prisma.uSDTTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            description: `Transação expirada por timeout (${this.TRANSACTION_TIMEOUT_MINUTES} minutos)`,
            processedAt: new Date()
          }
        });

        // Log de auditoria
        await this.auditService.log({
          action: 'UPDATE',
          resource: 'USDTTransaction',
          resourceId: transaction.id,
          details: {
            reason: 'timeout_expired',
            timeoutMinutes: this.TRANSACTION_TIMEOUT_MINUTES,
            originalStatus: transaction.status,
            newStatus: 'FAILED',
            transactionType: transaction.type,
            amount: transaction.amount.toString(),
            userId: transaction.wallet.user.id
          },
          userId: 'system', // Sistema automatizado
        });

        this.logger.warn(`💸 USDT Transaction ${transaction.id} expirada por timeout`, {
          userId: transaction.wallet.user.id,
          userEmail: transaction.wallet.user.email,
          type: transaction.type,
          amount: transaction.amount.toString(),
          createdAt: transaction.createdAt,
          timeoutMinutes: this.TRANSACTION_TIMEOUT_MINUTES
        });

      } catch (error) {
        this.logger.error(`❌ Erro ao processar timeout USDT ${transaction.id}`, {
          error: error.message,
          transactionId: transaction.id
        });
      }
    }
  }

  private async processPIXTimeouts(transactions: any[]) {
    this.logger.log(`💰 Processando ${transactions.length} timeouts PIX...`);

    for (const transaction of transactions) {
      try {
        await this.prisma.pIXTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            description: `Transação PIX expirada por timeout (${this.TRANSACTION_TIMEOUT_MINUTES} minutos)`,
            processedAt: new Date()
          }
        });

        // Log de auditoria
        await this.auditService.log({
          action: 'UPDATE',
          resource: 'PIXTransaction',
          resourceId: transaction.id,
          details: {
            reason: 'timeout_expired',
            timeoutMinutes: this.TRANSACTION_TIMEOUT_MINUTES,
            originalStatus: transaction.status,
            newStatus: 'FAILED',
            transactionType: transaction.type,
            amount: transaction.amount.toString(),
            userId: transaction.wallet.user.id
          },
          userId: 'system',
        });

        this.logger.warn(`💳 PIX Transaction ${transaction.id} expirada por timeout`, {
          userId: transaction.wallet.user.id,
          userEmail: transaction.wallet.user.email,
          type: transaction.type,
          amount: transaction.amount.toString(),
          createdAt: transaction.createdAt,
          timeoutMinutes: this.TRANSACTION_TIMEOUT_MINUTES
        });

      } catch (error) {
        this.logger.error(`❌ Erro ao processar timeout PIX ${transaction.id}`, {
          error: error.message,
          transactionId: transaction.id
        });
      }
    }
  }

  private async processInvestmentTimeouts(transactions: any[]) {
    this.logger.log(`📈 Processando ${transactions.length} timeouts de investimento...`);

    for (const transaction of transactions) {
      try {
        await this.prisma.investmentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            description: `Transação de investimento expirada por timeout (${this.TRANSACTION_TIMEOUT_MINUTES} minutos)`,
            processedAt: new Date()
          }
        });

        // Log de auditoria
        await this.auditService.log({
          action: 'UPDATE',
          resource: 'InvestmentTransaction',
          resourceId: transaction.id,
          details: {
            reason: 'timeout_expired',
            timeoutMinutes: this.TRANSACTION_TIMEOUT_MINUTES,
            originalStatus: transaction.status,
            newStatus: 'FAILED',
            transactionType: transaction.type,
            amount: transaction.amount.toString(),
            userId: transaction.investment.user.id
          },
          userId: 'system',
        });

        this.logger.warn(`📊 Investment Transaction ${transaction.id} expirada por timeout`, {
          userId: transaction.investment.user.id,
          userEmail: transaction.investment.user.email,
          type: transaction.type,
          amount: transaction.amount.toString(),
          createdAt: transaction.createdAt,
          timeoutMinutes: this.TRANSACTION_TIMEOUT_MINUTES
        });

      } catch (error) {
        this.logger.error(`❌ Erro ao processar timeout Investment ${transaction.id}`, {
          error: error.message,
          transactionId: transaction.id
        });
      }
    }
  }

  /**
   * Método manual para verificar timeouts imediatamente
   */
  async checkTimeoutsManually(): Promise<{
    expired: number;
    processed: number;
    errors: number;
  }> {
    this.logger.log('🔧 Verificação manual de timeouts iniciada...');

    const result = {
      expired: 0,
      processed: 0,
      errors: 0
    };

    try {
      await this.checkPendingTransactions();
      result.processed = 1;
    } catch (error) {
      result.errors = 1;
      this.logger.error('❌ Erro na verificação manual', error);
    }

    return result;
  }

  /**
   * Obtém estatísticas de transações pendentes
   */
  async getPendingTransactionsStats() {
    const timeoutDate = new Date(Date.now() - (this.TRANSACTION_TIMEOUT_MINUTES * 60 * 1000));

    const [
      totalPendingUSDT,
      expiredPendingUSDT,
      totalPendingPIX,
      expiredPendingPIX,
      totalPendingInvestment,
      expiredPendingInvestment
    ] = await Promise.all([
      this.prisma.uSDTTransaction.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } }
      }),
      this.prisma.uSDTTransaction.count({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          createdAt: { lt: timeoutDate }
        }
      }),
      this.prisma.pIXTransaction.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } }
      }),
      this.prisma.pIXTransaction.count({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          createdAt: { lt: timeoutDate }
        }
      }),
      this.prisma.investmentTransaction.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } }
      }),
      this.prisma.investmentTransaction.count({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          createdAt: { lt: timeoutDate }
        }
      })
    ]);

    return {
      timeout: {
        minutes: this.TRANSACTION_TIMEOUT_MINUTES
      },
      usdt: {
        totalPending: totalPendingUSDT,
        expiredPending: expiredPendingUSDT
      },
      pix: {
        totalPending: totalPendingPIX,
        expiredPending: expiredPendingPIX
      },
      investment: {
        totalPending: totalPendingInvestment,
        expiredPending: expiredPendingInvestment
      },
      total: {
        pending: totalPendingUSDT + totalPendingPIX + totalPendingInvestment,
        expired: expiredPendingUSDT + expiredPendingPIX + expiredPendingInvestment
      }
    };
  }
}