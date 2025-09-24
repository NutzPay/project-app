import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTransactionData {
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'INVESTMENT' | 'RETURN' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';
  amount: number;
  pixCode?: string;
  pixTransactionId?: string;
  brlAmount?: number;
  exchangeRate?: number;
  description?: string;
  externalId?: string;
  metadata?: any;
}

export class WalletService {
  
  // Get or create wallet for user
  async getOrCreateWallet(userId: string) {
    try {
      let wallet = await prisma.uSDTWallet.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
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
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });
      }

      return wallet;
    } catch (error) {
      console.error('Error getting/creating wallet:', error);
      throw error;
    }
  }

  // Credit USDT to user wallet (for confirmed deposits)
  async creditUSDT(data: CreateTransactionData) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get wallet
        const wallet = await this.getOrCreateWallet(data.userId);
        
        // Calculate new balance
        const newBalance = Number(wallet.balance) + data.amount;
        const newTotalDeposited = Number(wallet.totalDeposited) + data.amount;
        
        // Update wallet balance
        const updatedWallet = await tx.uSDTWallet.update({
          where: { userId: data.userId },
          data: {
            balance: newBalance,
            totalDeposited: newTotalDeposited
          }
        });

        // Create transaction record
        const transaction = await tx.uSDTTransaction.create({
          data: {
            walletId: wallet.id,
            type: data.type,
            status: 'COMPLETED',
            amount: data.amount,
            balanceAfter: newBalance,
            pixCode: data.pixCode,
            pixTransactionId: data.pixTransactionId,
            brlAmount: data.brlAmount,
            exchangeRate: data.exchangeRate,
            description: data.description,
            externalId: data.externalId,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            processedAt: new Date()
          }
        });

        console.log(`✅ USDT credited successfully:`, {
          userId: data.userId,
          amount: data.amount,
          newBalance: newBalance,
          transactionId: transaction.id
        });

        return {
          success: true,
          wallet: updatedWallet,
          transaction,
          newBalance
        };
      });
    } catch (error) {
      console.error('Error crediting USDT:', error);
      throw error;
    }
  }

  // Debit USDT from user wallet (for withdrawals, investments)
  async debitUSDT(data: CreateTransactionData) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Get wallet
        const wallet = await this.getOrCreateWallet(data.userId);
        
        // Check if sufficient balance
        if (Number(wallet.balance) < data.amount) {
          throw new Error('Insufficient USDT balance');
        }
        
        // Calculate new balance
        const newBalance = Number(wallet.balance) - data.amount;
        const newTotalWithdrawn = Number(wallet.totalWithdrawn) + data.amount;
        
        // Update wallet balance
        const updatedWallet = await tx.uSDTWallet.update({
          where: { userId: data.userId },
          data: {
            balance: newBalance,
            totalWithdrawn: newTotalWithdrawn
          }
        });

        // Create transaction record
        const transaction = await tx.uSDTTransaction.create({
          data: {
            walletId: wallet.id,
            type: data.type,
            status: 'COMPLETED',
            amount: -data.amount, // Negative for debits
            balanceAfter: newBalance,
            description: data.description,
            externalId: data.externalId,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            processedAt: new Date()
          }
        });

        console.log(`✅ USDT debited successfully:`, {
          userId: data.userId,
          amount: data.amount,
          newBalance: newBalance,
          transactionId: transaction.id
        });

        return {
          success: true,
          wallet: updatedWallet,
          transaction,
          newBalance
        };
      });
    } catch (error) {
      console.error('Error debiting USDT:', error);
      throw error;
    }
  }

  // Get wallet balance
  async getBalance(userId: string): Promise<{ balance: number; frozenBalance: number; totalDeposited: number; totalWithdrawn: number } | null> {
    try {
      const wallet = await prisma.uSDTWallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        return null;
      }

      return {
        balance: Number(wallet.balance),
        frozenBalance: Number(wallet.frozenBalance),
        totalDeposited: Number(wallet.totalDeposited),
        totalWithdrawn: Number(wallet.totalWithdrawn)
      };
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Get transaction history
  async getTransactionHistory(userId: string, limit = 50, offset = 0) {
    try {
      const wallet = await this.getOrCreateWallet(userId);
      
      const transactions = await prisma.uSDTTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return {
        transactions: transactions.map(tx => ({
          ...tx,
          amount: Number(tx.amount),
          balanceAfter: tx.balanceAfter ? Number(tx.balanceAfter) : null,
          brlAmount: tx.brlAmount ? Number(tx.brlAmount) : null,
          exchangeRate: tx.exchangeRate ? Number(tx.exchangeRate) : null,
          metadata: tx.metadata ? JSON.parse(tx.metadata) : null
        })),
        total: await prisma.uSDTTransaction.count({
          where: { walletId: wallet.id }
        })
      };
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }

  // Create pending transaction (before PIX payment)
  async createPendingTransaction(data: CreateTransactionData) {
    try {
      const wallet = await this.getOrCreateWallet(data.userId);
      
      const transaction = await prisma.uSDTTransaction.create({
        data: {
          walletId: wallet.id,
          type: data.type,
          status: 'PENDING',
          amount: data.amount,
          pixCode: data.pixCode,
          pixTransactionId: data.pixTransactionId,
          brlAmount: data.brlAmount,
          exchangeRate: data.exchangeRate,
          description: data.description,
          externalId: data.externalId,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null
        }
      });

      return transaction;
    } catch (error) {
      console.error('Error creating pending transaction:', error);
      throw error;
    }
  }

  // Complete pending transaction (when PIX is paid)
  async completePendingTransaction(pixTransactionId: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Find pending transaction
        const transaction = await tx.uSDTTransaction.findFirst({
          where: {
            pixTransactionId,
            status: 'PENDING'
          },
          include: {
            wallet: true
          }
        });

        if (!transaction) {
          throw new Error(`Pending transaction not found for PIX ID: ${pixTransactionId}`);
        }

        // Update wallet balance
        const newBalance = Number(transaction.wallet.balance) + Number(transaction.amount);
        const newTotalDeposited = Number(transaction.wallet.totalDeposited) + Number(transaction.amount);

        await tx.uSDTWallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: newBalance,
            totalDeposited: newTotalDeposited
          }
        });

        // Update transaction status
        const completedTransaction = await tx.uSDTTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            balanceAfter: newBalance,
            processedAt: new Date()
          }
        });

        console.log(`✅ Transaction completed:`, {
          transactionId: transaction.id,
          pixTransactionId,
          amount: Number(transaction.amount),
          newBalance
        });

        return {
          success: true,
          transaction: completedTransaction,
          newBalance
        };
      });
    } catch (error) {
      console.error('Error completing pending transaction:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const walletService = new WalletService();