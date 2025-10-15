import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bettrixService } from '@/lib/bettrix';
import { getSellerFees, calculatePixPayinFee } from '@/lib/fee-calculator';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    console.log('💰 Bettrix Cash-In webhook received:', JSON.stringify(webhookData, null, 2));

    const {
      transactionId,
      status,
      value,
      endToEndId,
      processedAt,
      orderId,
      observation,
      payer
    } = webhookData;

    if (!transactionId || !status) {
      console.error('❌ Invalid Cash-In webhook data - missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Map Bettrix status to our internal status
    const internalStatus = bettrixService.mapStatus(status);

    await handleCashInWebhook({
      transactionId,
      status: internalStatus,
      value: value / 100, // Convert cents to BRL
      endToEndId,
      processedAt,
      orderId,
      observation,
      payer
    });

    console.log(`✅ Cash-In webhook processed successfully for transaction ${transactionId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Cash-In webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing Cash-In webhook' },
      { status: 500 }
    );
  }
}

async function handleCashInWebhook(data: {
  transactionId: number;
  status: string;
  value: number;
  endToEndId?: string;
  processedAt?: string;
  orderId?: string;
  observation?: string;
  payer?: any;
}) {
  console.log('💰 Processing Cash-In webhook:', data);

  // Find transaction by orderId or endToEndId
  let transaction = null;

  if (data.orderId) {
    transaction = await prisma.pIXTransaction.findFirst({
      where: {
        externalId: data.orderId,
        type: 'DEPOSIT'
      },
      include: {
        wallet: true
      }
    });
  }

  if (!transaction && data.endToEndId) {
    transaction = await prisma.pIXTransaction.findFirst({
      where: {
        endToEndId: data.endToEndId,
        type: 'DEPOSIT'
      },
      include: {
        wallet: true
      }
    });
  }

  if (!transaction) {
    // Check if this is a USDT purchase instead
    const usdtTransaction = await checkForUSDTPurchase(data);
    if (usdtTransaction) {
      await handleUSDTPurchaseWebhook(data);
      return;
    }

    console.warn(`⚠️ Transaction not found for Cash-In webhook: orderId=${data.orderId}, endToEndId=${data.endToEndId}`);
    return;
  }

  // Skip if transaction is already completed
  if (transaction.status === 'COMPLETED') {
    console.log(`ℹ️ Transaction ${transaction.id} already completed, skipping`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (data.status === 'completed') {
      // Update transaction status
      await tx.pIXTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          endToEndId: data.endToEndId || transaction.endToEndId,
          processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
          pixKey: data.payer?.documentId || transaction.pixKey,
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata || '{}'),
            webhookData: data,
            payer: data.payer,
            completedAt: new Date().toISOString()
          })
        }
      });

      // Get user fees and calculate net amount after fees
      const userFees = await getSellerFees(transaction.wallet.userId);
      const feePercentage = userFees?.pixPayinFeePercent || 0;
      const feeFixed = userFees?.pixPayinFeeFixed || 0;

      // Calculate the fee deduction
      const feeCalculation = calculatePixPayinFee(data.value, feePercentage / 100, feeFixed);
      const netAmount = feeCalculation.finalAmount; // This is the amount after fees

      console.log(`💰 PIX Fee Calculation:`, {
        grossAmount: data.value,
        feePercentage: feePercentage,
        feeFixed: feeFixed,
        totalFee: feeCalculation.feeAmount,
        netAmount: netAmount
      });

      // Update wallet balance with net amount (after fees)
      const newBalance = transaction.wallet.balance.plus(netAmount);
      await tx.pIXWallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: newBalance,
          totalDeposited: transaction.wallet.totalDeposited.plus(data.value), // Keep gross amount in totalDeposited for accounting
        }
      });

      // Update transaction with new balance and fee information
      await tx.pIXTransaction.update({
        where: { id: transaction.id },
        data: {
          balanceAfter: newBalance,
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata || '{}'),
            webhookData: data,
            payer: data.payer,
            completedAt: new Date().toISOString(),
            feeCalculation: {
              grossAmount: data.value,
              feeAmount: feeCalculation.feeAmount,
              netAmount: netAmount,
              feeBreakdown: feeCalculation.feeBreakdown
            }
          })
        }
      });

      console.log(`✅ Cash-In completed: ${data.value} BRL received, ${feeCalculation.feeAmount} BRL fee deducted, ${netAmount} BRL added to wallet ${transaction.walletId}`);

    } else {
      // Update transaction status for other statuses (failed, refund, etc.)
      await tx.pIXTransaction.update({
        where: { id: transaction.id },
        data: {
          status: data.status.toUpperCase() as any,
          endToEndId: data.endToEndId || transaction.endToEndId,
          processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(transaction.metadata || '{}'),
            webhookData: data,
            statusUpdatedAt: new Date().toISOString()
          })
        }
      });

      console.log(`ℹ️ Cash-In status updated to: ${data.status} for transaction ${transaction.id}`);
    }
  });
}

// Check if this webhook is for a USDT purchase
async function checkForUSDTPurchase(data: {
  orderId?: string;
  transactionId: number;
}) {
  let usdtTransaction = null;

  if (data.orderId) {
    usdtTransaction = await prisma.uSDTTransaction.findFirst({
      where: {
        externalId: data.orderId,
        type: 'DEPOSIT'
      }
    });
  }

  if (!usdtTransaction && data.transactionId) {
    usdtTransaction = await prisma.uSDTTransaction.findFirst({
      where: {
        pixTransactionId: data.transactionId.toString(),
        type: 'DEPOSIT'
      }
    });
  }

  return usdtTransaction;
}

// Handle USDT purchase webhook
async function handleUSDTPurchaseWebhook(data: {
  transactionId: number;
  status: string;
  value: number;
  endToEndId?: string;
  processedAt?: string;
  orderId?: string;
  observation?: string;
  payer?: any;
}) {
  console.log('💲 Processing USDT Purchase via Cash-In webhook:', data);

  const usdtTransaction = await prisma.uSDTTransaction.findFirst({
    where: {
      OR: [
        { externalId: data.orderId },
        { pixTransactionId: data.transactionId.toString() }
      ],
      type: 'DEPOSIT'
    },
    include: {
      wallet: true
    }
  });

  if (!usdtTransaction) {
    console.warn(`⚠️ USDT Transaction not found: orderId=${data.orderId}, bettrixId=${data.transactionId}`);
    return;
  }

  if (usdtTransaction.status === 'COMPLETED') {
    console.log(`ℹ️ USDT Transaction ${usdtTransaction.id} already completed, skipping`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (data.status === 'completed') {
      // Update USDT transaction status
      await tx.uSDTTransaction.update({
        where: { id: usdtTransaction.id },
        data: {
          status: 'COMPLETED',
          processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(usdtTransaction.metadata || '{}'),
            webhookData: data,
            payer: data.payer,
            completedAt: new Date().toISOString(),
            brlPaid: data.value
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

      console.log(`✅ USDT Purchase completed: ${usdtTransaction.amount} USDT credited to wallet ${usdtTransaction.walletId}`);
      console.log(`💰 Paid: R$ ${data.value} → Received: ${usdtTransaction.amount} USDT`);

    } else {
      await tx.uSDTTransaction.update({
        where: { id: usdtTransaction.id },
        data: {
          status: data.status.toUpperCase() as any,
          processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
          metadata: JSON.stringify({
            ...JSON.parse(usdtTransaction.metadata || '{}'),
            webhookData: data,
            statusUpdatedAt: new Date().toISOString()
          })
        }
      });

      console.log(`ℹ️ USDT Purchase status updated to: ${data.status} for transaction ${usdtTransaction.id}`);
    }
  });
}