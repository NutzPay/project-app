import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bettrixService } from '@/lib/bettrix';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    console.log('💸 Bettrix Cash-Out webhook received:', JSON.stringify(webhookData, null, 2));

    const {
      transactionId,
      status,
      value,
      endToEndId,
      processedAt,
      orderId,
      observation,
      destinationBank
    } = webhookData;

    if (!transactionId || !status) {
      console.error('❌ Invalid Cash-Out webhook data - missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Map Bettrix status to our internal status
    const internalStatus = bettrixService.mapStatus(status);

    await handleCashOutWebhook({
      transactionId,
      status: internalStatus,
      value: value / 100, // Convert cents to BRL
      endToEndId,
      processedAt,
      orderId,
      observation,
      destinationBank
    });

    console.log(`✅ Cash-Out webhook processed successfully for transaction ${transactionId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Cash-Out webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing Cash-Out webhook' },
      { status: 500 }
    );
  }
}

async function handleCashOutWebhook(data: {
  transactionId: number;
  status: string;
  value: number;
  endToEndId?: string;
  processedAt?: string;
  orderId?: string;
  observation?: string;
  destinationBank?: any;
}) {
  console.log('💸 Processing Cash-Out webhook:', data);

  // Find transaction by orderId or bettrix transaction ID
  let transaction = null;

  if (data.orderId) {
    transaction = await prisma.pIXTransaction.findFirst({
      where: {
        externalId: data.orderId,
        type: 'WITHDRAWAL'
      },
      include: {
        wallet: true
      }
    });
  }

  if (!transaction) {
    // Try to find by Bettrix transaction ID in metadata
    const transactions = await prisma.pIXTransaction.findMany({
      where: {
        type: 'WITHDRAWAL',
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
    console.warn(`⚠️ Transaction not found for Cash-Out webhook: orderId=${data.orderId}, bettrixId=${data.transactionId}`);
    return;
  }

  // Skip if already completed
  if (transaction.status === 'COMPLETED') {
    console.log(`ℹ️ Transaction ${transaction.id} already completed, skipping`);
    return;
  }

  // Update transaction with new status
  await prisma.pIXTransaction.update({
    where: { id: transaction.id },
    data: {
      status: data.status.toUpperCase() as any,
      endToEndId: data.endToEndId || transaction.endToEndId,
      processedAt: data.processedAt ? new Date(data.processedAt) : new Date(),
      metadata: JSON.stringify({
        ...JSON.parse(transaction.metadata || '{}'),
        webhookData: data,
        destinationBank: data.destinationBank,
        statusUpdatedAt: new Date().toISOString()
      })
    }
  });

  console.log(`✅ Cash-Out status updated to: ${data.status} for transaction ${transaction.id}`);

  // If payout failed or cancelled, refund the user's balance
  if (data.status === 'failed' || data.status === 'cancelled') {
    console.log(`⚠️ Cash-Out ${data.status} - refunding balance for transaction ${transaction.id}`);

    // Get fee information from metadata
    const metadata = JSON.parse(transaction.metadata || '{}');
    const feeCalculation = metadata.feeCalculation;
    const totalDeducted = feeCalculation?.totalDeducted || transaction.amount.toNumber();

    // Refund the full amount (requested + fee) back to wallet
    await prisma.pIXWallet.update({
      where: { id: transaction.wallet.id },
      data: {
        balance: transaction.wallet.balance.plus(totalDeducted),
        totalWithdrawn: transaction.wallet.totalWithdrawn.minus(transaction.amount)
      }
    });

    console.log(`✅ Refunded R$ ${totalDeducted} to wallet ${transaction.wallet.id}`);
  }
}