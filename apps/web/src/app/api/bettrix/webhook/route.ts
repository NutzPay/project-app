import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bettrixService } from '@/lib/bettrix';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    console.log('🔔 Bettrix webhook received (DEPRECATED - use specific endpoints):', JSON.stringify(webhookData, null, 2));

    const { object } = webhookData;

    // Redirect to specific webhook endpoints for better organization
    console.warn(`⚠️ DEPRECATED: Use specific webhook endpoints instead:
    - Cash-In: /api/bettrix/webhook/cashin
    - Cash-Out: /api/bettrix/webhook/cashout
    - Transfer: /api/bettrix/webhook/transfer`);

    return NextResponse.json({
      success: false,
      error: 'Use specific webhook endpoints',
      redirectTo: {
        cashin: '/api/bettrix/webhook/cashin',
        cashout: '/api/bettrix/webhook/cashout',
        transfer: '/api/bettrix/webhook/transfer'
      }
    }, { status: 410 }); // Gone status

  } catch (error) {
    console.error('❌ Webhook parsing error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid webhook data' },
      { status: 400 }
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

      // Update wallet balance
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

      console.log(`✅ Cash-In completed: ${data.value} BRL added to wallet ${transaction.walletId}`);

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

  // If payout failed, we might need to refund the user's balance
  if (data.status === 'failed' || data.status === 'cancelled') {
    console.log(`⚠️ Cash-Out failed/cancelled - consider implementing balance refund for transaction ${transaction.id}`);
  }
}