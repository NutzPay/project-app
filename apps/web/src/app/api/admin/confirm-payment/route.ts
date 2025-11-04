import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    console.log(`🔧 Manual confirmation for Bettrix transaction: ${transactionId}`);

    // Find USDT transaction by Bettrix transaction ID
    const usdtTransaction = await prisma.uSDTTransaction.findFirst({
      where: {
        pixTransactionId: transactionId.toString(),
        type: 'DEPOSIT'
      },
      include: {
        wallet: true
      }
    });

    if (!usdtTransaction) {
      return NextResponse.json(
        { success: false, error: 'USDT Transaction not found' },
        { status: 404 }
      );
    }

    if (usdtTransaction.status === 'COMPLETED') {
      return NextResponse.json(
        { success: true, message: 'Transaction already completed' }
      );
    }

    // Force complete the transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update USDT transaction status
      await tx.uSDTTransaction.update({
        where: { id: usdtTransaction.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(usdtTransaction.metadata || '{}'),
            manualConfirmation: true,
            confirmedAt: new Date().toISOString(),
            bettrixTransactionId: transactionId
          })
        }
      });

      // Credit USDT to wallet
      const newUsdtBalance = usdtTransaction.wallet.balance.plus(usdtTransaction.amount);

      await tx.uSDTWallet.update({
        where: { id: usdtTransaction.walletId },
        data: {
          balance: newUsdtBalance,
          totalDeposited: usdtTransaction.wallet.totalDeposited.plus(usdtTransaction.amount),
        }
      });

      // Update transaction with new balance
      await tx.uSDTTransaction.update({
        where: { id: usdtTransaction.id },
        data: {
          balanceAfter: newUsdtBalance
        }
      });

      console.log(`✅ MANUAL: USDT Purchase completed: ${usdtTransaction.amount} USDT credited to wallet ${usdtTransaction.walletId}`);
    });

    return NextResponse.json({
      success: true,
      message: `${usdtTransaction.amount} USDT credited to wallet`,
      transactionId: usdtTransaction.id
    });

  } catch (error) {
    console.error('❌ Error in manual confirmation:', error);
    return NextResponse.json(
      { success: false, error: 'Error confirming payment' },
      { status: 500 }
    );
  }
}