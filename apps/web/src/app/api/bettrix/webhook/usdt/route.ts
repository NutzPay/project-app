import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bettrixService } from '@/lib/bettrix';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    console.log('💲 Bettrix USDT Purchase webhook received:', JSON.stringify(webhookData, null, 2));

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
      console.error('❌ Invalid USDT webhook data - missing required fields');
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Map Bettrix status to our internal status
    const internalStatus = bettrixService.mapStatus(status);

    await handleUSDTPurchaseWebhook({
      transactionId,
      status: internalStatus,
      value: value / 100, // Convert cents to BRL
      endToEndId,
      processedAt,
      orderId,
      observation,
      payer
    });

    console.log(`✅ USDT Purchase webhook processed successfully for transaction ${transactionId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ USDT Purchase webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Error processing USDT Purchase webhook' },
      { status: 500 }
    );
  }
}

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
  console.log('💲 Processing USDT Purchase webhook:', data);

  // Find USDT transaction by orderId or Bettrix transaction ID
  let usdtTransaction = null;

  if (data.orderId) {
    usdtTransaction = await prisma.uSDTTransaction.findFirst({
      where: {
        externalId: data.orderId,
        type: 'DEPOSIT'
      },
      include: {
        wallet: true
      }
    });
  }

  if (!usdtTransaction && data.transactionId) {
    // Try to find by Bettrix transaction ID in pixTransactionId field
    usdtTransaction = await prisma.uSDTTransaction.findFirst({
      where: {
        pixTransactionId: data.transactionId.toString(),
        type: 'DEPOSIT'
      },
      include: {
        wallet: true
      }
    });
  }

  if (!usdtTransaction) {
    console.warn(`⚠️ USDT Transaction not found for webhook: orderId=${data.orderId}, bettrixId=${data.transactionId}`);
    return;
  }

  // Skip if transaction is already completed
  if (usdtTransaction.status === 'COMPLETED') {
    console.log(`ℹ️ USDT Transaction ${usdtTransaction.id} already completed, skipping`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    if (data.status === 'completed') {
      // PIX was paid - convert BRL to USDT and credit user's USDT wallet

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

      // Credit USDT to wallet (amount was already calculated during purchase)
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
      // Update transaction status for other statuses (failed, refund, etc.)
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