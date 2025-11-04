import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bettrixService } from '@/lib/bettrix';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    console.log('💱 Bettrix Transfer webhook received:', JSON.stringify(webhookData, null, 2));

    const {
      transactionId,
      status,
      value,
      endToEndId,
      processedAt,
      orderId,
      observation,
      payer,
      destinationBank
    } = webhookData;

    if (!transactionId || !status) {
      console.error('❌ Invalid Transfer webhook data - missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Map Bettrix status to our internal status
    const internalStatus = bettrixService.mapStatus(status);

    await handleTransferWebhook({
      transactionId,
      status: internalStatus,
      value: value / 100, // Convert cents to BRL
      endToEndId,
      processedAt,
      orderId,
      observation,
      payer,
      destinationBank
    });

    console.log(`✅ Transfer webhook processed successfully for transaction ${transactionId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Transfer webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing Transfer webhook' },
      { status: 500 }
    );
  }
}

async function handleTransferWebhook(data: {
  transactionId: number;
  status: string;
  value: number;
  endToEndId?: string;
  processedAt?: string;
  orderId?: string;
  observation?: string;
  payer?: any;
  destinationBank?: any;
}) {
  console.log('💱 Processing Transfer webhook:', data);

  // Find transaction by orderId, endToEndId, or Bettrix transaction ID
  let transaction = null;

  // Try to find by orderId first
  if (data.orderId) {
    transaction = await prisma.pIXTransaction.findFirst({
      where: {
        externalId: data.orderId,
        type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] }
      },
      include: {
        wallet: true
      }
    });
  }

  // Try to find by endToEndId
  if (!transaction && data.endToEndId) {
    transaction = await prisma.pIXTransaction.findFirst({
      where: {
        endToEndId: data.endToEndId,
        type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] }
      },
      include: {
        wallet: true
      }
    });
  }

  // Try to find by Bettrix transaction ID in metadata
  if (!transaction) {
    const transactions = await prisma.pIXTransaction.findMany({
      where: {
        type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    for (const tx of transactions) {
      const metadata = JSON.parse(tx.metadata || '{}');
      if (metadata.bettrixTransactionId === data.transactionId) {
        transaction = await prisma.pIXTransaction.findUnique({
          where: { id: tx.id },
          include: { wallet: true }
        });
        break;
      }
    }
  }

  if (!transaction) {
    console.warn(`⚠️ Transaction not found for Transfer webhook: orderId=${data.orderId}, endToEndId=${data.endToEndId}, bettrixId=${data.transactionId}`);
    return;
  }

  // Skip if transaction is already completed
  if (transaction.status === 'COMPLETED') {
    console.log(`ℹ️ Transaction ${transaction.id} already completed, skipping`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Update transaction status
    await tx.pIXTransaction.update({
      where: { id: transaction.id },
      data: {
        status: data.status.toUpperCase() as any,
        endToEndId: data.endToEndId || transaction.endToEndId,
        processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
        metadata: JSON.stringify({
          ...JSON.parse(transaction.metadata || '{}'),
          webhookData: data,
          payer: data.payer,
          destinationBank: data.destinationBank,
          statusUpdatedAt: new Date().toISOString()
        })
      }
    });

    // For completed transfers, update wallet balance if it's a TRANSFER_IN
    if (data.status === 'completed' && transaction.type === 'TRANSFER_IN') {
      const newBalance = transaction.wallet.balance.plus(data.value);

      await tx.pIXWallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: newBalance,
          totalDeposited: transaction.wallet.totalDeposited.plus(data.value),
        }
      });

      // Update transaction with new balance
      await tx.pIXTransaction.update({
        where: { id: transaction.id },
        data: {
          balanceAfter: newBalance
        }
      });

      console.log(`✅ Transfer-In completed: ${data.value} BRL added to wallet ${transaction.walletId}`);
    } else {
      console.log(`ℹ️ Transfer status updated to: ${data.status} for transaction ${transaction.id}`);
    }
  });
}