import { NextRequest, NextResponse } from 'next/server';
import { multiWalletService } from '@/lib/multiWalletService';
import { prisma } from '@/lib/prisma';
import { broadcast } from '@/lib/websocket-manager';
import { priceCalculator } from '@/lib/priceCalculator';
import { addDebugLog } from '@/lib/debug-logger';
import { formatBRL, formatCrypto } from '@/lib/currency';
import { commissionService } from '@/lib/commissionService';

interface XGateWebhookPayload {
  id: string;
  status: 'PAID' | 'ERROR' | 'PROCESSING' | 'REJECTED' | 'WAITING_PAYMENT' | 'EXPIRED';
  amount: number;
  crypto_amount?: number;
  currency?: string;
  cryptocurrency?: string;
  customer_id?: string;
  customerId?: string; // Alternative field name
  name?: string; // New field from XGate
  operation?: string; // New field from XGate
  transaction_id?: string;
  pix_code?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, any>;
  // Legacy fields for backward compatibility
  eventType?: string;
  orderId?: string;
  data?: any;
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const userAgent = request.headers.get('user-agent') || '';
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  
  try {
    const payload: XGateWebhookPayload = await request.json();
    
    // Log detalhado do webhook recebido - FORÇANDO DEBUG
    try {
      addDebugLog(`🔔 XGate webhook received from IP: ${ip}`);
      addDebugLog(`📦 RAW PAYLOAD: ${JSON.stringify(payload, null, 2)}`);
    } catch (debugError) {
      console.error('❌ Debug log failed:', debugError);
    }
    
    console.log(`🔔 [${timestamp}] XGate webhook received from IP: ${ip}`);
    console.log('📦 RAW PAYLOAD:', JSON.stringify(payload, null, 2));
    console.log('🚨 WEBHOOK PROCESSING STARTED - DEBUG TEST');
    
    console.log('🔔 XGate webhook received:', {
      id: payload.id || payload.orderId,
      status: payload.status || payload.eventType,
      amount: payload.amount ? `${payload.amount} ${payload.name || payload.cryptocurrency || 'units'}` : 'N/A',
      crypto_amount: payload.crypto_amount ? `${payload.crypto_amount} ${payload.cryptocurrency}` : 'N/A',
      customer_id: payload.customer_id || payload.customerId,
      operation: payload.operation,
      name: payload.name,
      full_payload: JSON.stringify(payload)
    });
    
    // Validate required fields
    const transactionId = payload.id || payload.orderId;
    const status = payload.status || payload.eventType;
    
    if (!transactionId || !status) {
      console.error('❌ Invalid webhook payload - missing required fields');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Registrar webhook recebido no banco de dados
    try {
      await prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_RECEIVED',
          resource: 'xgate_webhook',
          resourceId: transactionId,
          details: JSON.stringify({
            status: status,
            amount: payload.amount,
            crypto_amount: payload.crypto_amount,
            customer_id: payload.customer_id,
            timestamp: timestamp,
            ip: ip,
            userAgent: userAgent
          }),
          ipAddress: ip,
          userAgent: userAgent
        }
      });
    } catch (auditError) {
      console.error('⚠️ Failed to log webhook in audit:', auditError);
    }

    // Process webhook based on status (new format) or eventType (legacy format)
    if (payload.status) {
      // New XGate format
      addDebugLog(`🔄 Processing NEW format with status: ${payload.status}`);
      console.log('🔄 Processing NEW format with status:', payload.status);
      await processNewFormat(payload);
      addDebugLog(`✅ processNewFormat completed for ${payload.id}`);
    } else if (payload.eventType) {
      // Legacy format
      addDebugLog(`🔄 Processing LEGACY format with eventType: ${payload.eventType}`);
      console.log('🔄 Processing LEGACY format with eventType:', payload.eventType);
      await processLegacyFormat(payload);
    } else {
      addDebugLog(`⚠️ Unknown webhook format - no status or eventType found`);
      addDebugLog(`Available fields: ${Object.keys(payload).join(', ')}`);
      console.warn('⚠️ Unknown webhook format - no status or eventType found');
      console.warn('Available fields:', Object.keys(payload));
    }

    // Always respond with 200 OK to acknowledge receipt
    return NextResponse.json({ 
      success: true, 
      received: true,
      transaction_id: transactionId,
      processed_status: status
    });

  } catch (error) {
    console.error('❌ Error processing XGate webhook:', error);
    
    // Still return 200 to avoid webhook retries for parsing errors
    return NextResponse.json({ 
      success: false, 
      error: 'Webhook processing error' 
    }, { status: 200 });
  }
}

async function processNewFormat(payload: XGateWebhookPayload) {
  console.log('🔄 processNewFormat called with status:', payload.status);
  console.log('🔄 About to switch on status:', payload.status);
  
  switch (payload.status) {
    case 'PAID':
      console.log('✅ Matched PAID status - calling handlePaidStatus');
      await handlePaidStatus(payload);
      break;
      
    case 'ERROR':
    case 'REJECTED':
      await handleErrorStatus(payload);
      break;
      
    case 'PROCESSING':
      await handleProcessingStatus(payload);
      break;
      
    case 'EXPIRED':
      await handleExpiredStatus(payload);
      break;
      
    case 'WAITING_PAYMENT':
      console.log('💭 Payment waiting - no action needed');
      break;
      
    default:
      console.warn(`⚠️ Unknown status: ${payload.status}`);
  }
}

async function processLegacyFormat(payload: XGateWebhookPayload) {
  const { eventType, orderId, data } = payload;
  
  switch (eventType) {
    case 'payment.received':
    case 'payment.confirmed':
      console.log(`✅ Payment confirmed for order ${orderId}`);
      await handlePaymentConfirmed(orderId, data);
      break;
      
    case 'payment.failed':
      console.log(`❌ Payment failed for order ${orderId}`);
      await handlePaymentFailed(orderId, data);
      break;
      
    case 'payment.expired':
      console.log(`⏰ Payment expired for order ${orderId}`);
      await handlePaymentExpired(orderId, data);
      break;
      
    case 'usdt.delivered':
      console.log(`🪙 USDT delivered for order ${orderId}`);
      await handleUsdtDelivered(orderId, data);
      break;
      
    default:
      console.log(`📦 Unknown XGate event: ${eventType}`);
      break;
  }
}

// New format handlers
async function handlePaidStatus(payload: XGateWebhookPayload): Promise<void> {
  console.log('🚀 handlePaidStatus STARTED for ID:', payload.id);
  try {
    console.log('💰 Processing PAID status for PIX payment:', payload.id);
    console.log('🔍 Looking for transaction in database...');
    
    console.log(`🎉 XGate Payment confirmed - crediting to USDT wallet:`, {
      transaction_id: payload.id,
      amount_paid: `R$ ${payload.amount}`,
      customer: payload.customer_id,
      note: 'XGate -> USDT (PIX balance vem da Starkbank apenas)'
    });
    
    // Buscar a transação USDT pendente para obter userId
    const existingTransaction = await prisma.uSDTTransaction.findFirst({
      where: {
        OR: [
          { pixTransactionId: payload.id },
          { externalId: payload.id }
        ]
      },
      include: {
        wallet: {
          select: { 
            userId: true,
            balance: true,
            totalDeposited: true
          }
        }
      }
    });

    if (!existingTransaction) {
      console.error('❌ No pending transaction found for PIX ID:', payload.id);
      return;
    }

    const userId = existingTransaction.wallet.userId;
    console.log(`👤 Found user ${userId} for USDT payment processing`);
    
    // NOVA ESTRATÉGIA: Usar o valor ESPERADO da transação pendente, não o que XGate retornou
    console.log('🎯 Using expected USDT amount from pending transaction, not XGate amount');

    let usdtAmount: number = existingTransaction.amount.toNumber(); // Valor ESPERADO pelo usuário
    let brlAmount: number = existingTransaction.brlAmount?.toNumber() || payload.amount;

    console.log('💰 Using transaction expected amounts (not XGate amounts):', {
      expectedUSDT: usdtAmount,
      expectedBRL: brlAmount,
      xgateReturnedAmount: payload.amount,
      xgateAmountIgnored: true,
      interpretation: 'Using expected transaction amounts'
    });
    
    const result = await prisma.$transaction(async (tx) => {
      const currentBalance = Number(existingTransaction.wallet.balance);
      const newBalance = currentBalance + usdtAmount;
      
      // Atualizar saldo USDT
      await tx.uSDTWallet.update({
        where: { userId },
        data: {
          balance: newBalance,
          totalDeposited: Number(existingTransaction.wallet.totalDeposited) + usdtAmount
        }
      });

      // Atualizar transação existente
      await tx.uSDTTransaction.update({
        where: { id: existingTransaction.id },
        data: {
          status: 'COMPLETED',
          amount: usdtAmount,
          brlAmount: brlAmount,
          exchangeRate: brlAmount / usdtAmount, // Taxa efetiva
          balanceAfter: newBalance,
          processedAt: new Date(),
          description: `Compra de USDT: ${formatBRL(brlAmount)} → ${formatCrypto(usdtAmount, 'USDT', { maximumFractionDigits: 2 })}`
        }
      });

      return {
        success: true,
        newBalance: newBalance,
        creditedAmount: usdtAmount,
        type: 'USDT_CREDITED'
      };
    });

    if (result.success) {
      console.log('✅ USDT balance successfully credited:', {
        transactionId: payload.id,
        newBalance: `${result.newBalance} USDT`,
        creditedAmount: `${result.creditedAmount} USDT`,
        exchangeRate: brlAmount / usdtAmount,
        userId: userId
      });

      console.log('📝 XGate transaction processed as USDT credit');

      // 🏆 Processar comissão para o time comercial
      try {
        console.log('💰 Processing commission for USDT purchase...');
        await commissionService.processTransactionCommission(
          'USDT_PURCHASE',
          usdtAmount, // Usar valor USDT como base para comissão
          userId,
          existingTransaction.id,
          `Compra USDT via XGate: ${formatBRL(brlAmount)} → ${formatCrypto(usdtAmount, 'USDT', { maximumFractionDigits: 2 })}`
        );
        console.log('✅ Commission processing completed for transaction:', existingTransaction.id);
      } catch (commissionError) {
        console.error('⚠️ Failed to process commission (transaction still successful):', commissionError);
        // Não falhar a transação por erro de comissão
      }
      
      // Broadcast payment confirmation via WebSocket
      try {
        broadcast(payload.id, {
          status: 'confirmed',
          usdtAmount: result.creditedAmount,
          brlAmount: brlAmount,
          message: `Pagamento confirmado! ${result.creditedAmount} USDT creditado em sua conta.`
        });
        console.log('📡 WebSocket notification sent for transaction:', payload.id);
      } catch (wsError) {
        console.error('❌ Error broadcasting WebSocket notification:', wsError);
      }
      
      // TODO: Send payment confirmation email/notification
      // await sendPaymentConfirmation(payload.customer_id, payload);
    } else {
      console.error('❌ Failed to credit USDT balance to wallet');
    }
    
  } catch (error) {
    console.error('❌ Error handling PAID status:', error);
    console.error('❌ Full error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      payload: JSON.stringify(payload)
    });
    
    // Don't throw - we want to acknowledge the webhook even if processing fails
    // But log everything for debugging
  }
}

async function handleErrorStatus(payload: XGateWebhookPayload): Promise<void> {
  try {
    console.log('❌ Processing ERROR/REJECTED status for transaction:', payload.id);
    
    console.log(`💥 Payment failed:`, {
      transaction_id: payload.id,
      status: payload.status,
      amount: `R$ ${payload.amount}`,
      customer: payload.customer_id
    });
    
    // Broadcast payment failure via WebSocket
    try {
      broadcast(payload.id, {
        status: 'failed',
        brlAmount: payload.amount,
        message: `Pagamento falhou. Tente novamente.`
      });
      console.log('📡 WebSocket failure notification sent for transaction:', payload.id);
    } catch (wsError) {
      console.error('❌ Error broadcasting WebSocket failure notification:', wsError);
    }
    
    // TODO: Implement error handling
    // await updateTransactionStatus(payload.id, 'FAILED');
    // await notifyPaymentFailure(payload.customer_id, payload);
    
  } catch (error) {
    console.error('❌ Error handling ERROR status:', error);
    throw error;
  }
}

async function handleProcessingStatus(payload: XGateWebhookPayload): Promise<void> {
  try {
    console.log('⚙️ Processing PROCESSING status for transaction:', payload.id);
    
    console.log(`⏳ Payment processing:`, {
      transaction_id: payload.id,
      amount: `R$ ${payload.amount}`,
      customer: payload.customer_id
    });
    
    // Broadcast processing status via WebSocket
    try {
      broadcast(payload.id, {
        status: 'processing',
        brlAmount: payload.amount,
        message: `Pagamento detectado! Processando...`
      });
      console.log('📡 WebSocket processing notification sent for transaction:', payload.id);
    } catch (wsError) {
      console.error('❌ Error broadcasting WebSocket processing notification:', wsError);
    }
    
    // TODO: Implement processing updates
    // await updateTransactionStatus(payload.id, 'PROCESSING');
    
  } catch (error) {
    console.error('❌ Error handling PROCESSING status:', error);
    throw error;
  }
}

async function handleExpiredStatus(payload: XGateWebhookPayload): Promise<void> {
  try {
    console.log('⏰ Processing EXPIRED status for transaction:', payload.id);
    
    console.log(`⌛ Payment expired:`, {
      transaction_id: payload.id,
      amount: `R$ ${payload.amount}`,
      customer: payload.customer_id
    });
    
    // Broadcast expiration via WebSocket
    try {
      broadcast(payload.id, {
        status: 'expired',
        brlAmount: payload.amount,
        message: `PIX expirou. Gere um novo para continuar.`
      });
      console.log('📡 WebSocket expiration notification sent for transaction:', payload.id);
    } catch (wsError) {
      console.error('❌ Error broadcasting WebSocket expiration notification:', wsError);
    }
    
    // TODO: Implement expiration handling
    // await updateTransactionStatus(payload.id, 'EXPIRED');
    
  } catch (error) {
    console.error('❌ Error handling EXPIRED status:', error);
    throw error;
  }
}

// Legacy format handlers
async function handlePaymentConfirmed(orderId: string, data: any) {
  try {
    console.log(`📝 Updating order ${orderId} status to payment_confirmed`);
    // TODO: Database updates for legacy format
    console.log(`✅ Order ${orderId} payment confirmed notification processed`);
  } catch (error) {
    console.error(`❌ Error handling payment confirmed for ${orderId}:`, error);
  }
}

async function handlePaymentFailed(orderId: string, data: any) {
  try {
    console.log(`📝 Updating order ${orderId} status to payment_failed`);
    // TODO: Database updates for legacy format
    console.log(`✅ Order ${orderId} payment failed notification processed`);
  } catch (error) {
    console.error(`❌ Error handling payment failed for ${orderId}:`, error);
  }
}

async function handlePaymentExpired(orderId: string, data: any) {
  try {
    console.log(`📝 Updating order ${orderId} status to expired`);
    // TODO: Database updates for legacy format
    console.log(`✅ Order ${orderId} expiration notification processed`);
  } catch (error) {
    console.error(`❌ Error handling payment expired for ${orderId}:`, error);
  }
}

async function handleUsdtDelivered(orderId: string, data: any) {
  try {
    console.log(`📝 Updating order ${orderId} status to completed - USDT delivered`);
    // TODO: Database updates for legacy format
    console.log(`✅ Order ${orderId} USDT delivery notification processed`);
  } catch (error) {
    console.error(`❌ Error handling USDT delivered for ${orderId}:`, error);
  }
}

// GET endpoint for webhook verification (if needed by XGate)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    console.log('🔍 Webhook verification challenge received');
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ 
    message: 'XGate webhook endpoint',
    status: 'active',
    timestamp: new Date().toISOString()
  });
}