import { NextRequest, NextResponse } from 'next/server';
import { multiWalletService } from '@/lib/multiWalletService';
import { prisma } from '@/lib/prisma';

interface StarkbankPixWebhook {
  id: string;
  event: string;
  subscription: string;
  created: string;
  log: {
    id: string;
    created: string;
    type: string;
    pixRequest?: {
      id: string;
      amount: number;
      external_id: string;
      description: string;
      tags: string[];
      status: string;
      fee: number;
      created: string;
      updated: string;
    };
    reversal?: {
      id: string;
      amount: number;
      external_id: string;
      end_to_end_id: string;
      reason: string;
      tags: string[];
      status: string;
      created: string;
      updated: string;
    };
  };
}

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  
  try {
    const payload: StarkbankPixWebhook = await request.json();
    
    console.log(`🏦 [${timestamp}] Starkbank PIX webhook received from IP: ${ip}`);
    console.log('🏦 Starkbank PIX webhook payload:', {
      event: payload.event,
      log_type: payload.log?.type,
      pix_id: payload.log?.pixRequest?.id || payload.log?.reversal?.id,
      amount: payload.log?.pixRequest?.amount || payload.log?.reversal?.amount,
      status: payload.log?.pixRequest?.status || payload.log?.reversal?.status
    });
    
    // Registrar webhook no audit log
    try {
      await prisma.auditLog.create({
        data: {
          action: 'WEBHOOK_RECEIVED',
          resource: 'starkbank_pix_webhook',
          resourceId: payload.log?.pixRequest?.id || payload.log?.reversal?.id || payload.id,
          details: JSON.stringify({
            event: payload.event,
            type: payload.log?.type,
            amount: payload.log?.pixRequest?.amount || payload.log?.reversal?.amount,
            timestamp: timestamp,
            ip: ip
          }),
          ipAddress: ip
        }
      });
    } catch (auditError) {
      console.error('⚠️ Failed to log Starkbank webhook in audit:', auditError);
    }

    // Processar webhook baseado no tipo de evento
    if (payload.log?.type === 'credited' && payload.log?.pixRequest) {
      await handlePixCredited(payload.log.pixRequest);
    } else if (payload.log?.type === 'failed' && payload.log?.pixRequest) {
      await handlePixFailed(payload.log.pixRequest);
    } else if (payload.log?.type === 'success' && payload.log?.reversal) {
      await handlePixReversal(payload.log.reversal);
    } else {
      console.log(`📦 Starkbank PIX event não processado: ${payload.log?.type}`);
    }

    return NextResponse.json({
      success: true,
      received: true,
      event: payload.event,
      type: payload.log?.type,
      processed: true
    });

  } catch (error) {
    console.error('❌ Error processing Starkbank PIX webhook:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Webhook processing error'
    }, { status: 200 }); // Still return 200 to avoid retries
  }
}

async function handlePixCredited(pixRequest: any): Promise<void> {
  try {
    console.log('💰 Processing PIX credited from Starkbank:', pixRequest.id);
    
    // Extrair userId do external_id ou tags
    let userId: string | null = null;
    
    if (pixRequest.external_id && pixRequest.external_id.startsWith('user_')) {
      userId = pixRequest.external_id.replace('user_', '');
    } else if (pixRequest.tags && pixRequest.tags.length > 0) {
      const userTag = pixRequest.tags.find((tag: string) => tag.startsWith('user_'));
      if (userTag) {
        userId = userTag.replace('user_', '');
      }
    }

    if (!userId) {
      console.error('❌ Cannot determine userId from Starkbank PIX request');
      return;
    }

    console.log(`👤 Processing PIX credit for user: ${userId}`);

    // Creditar saldo PIX usando multiWalletService
    const result = await multiWalletService.processPIXPayment(
      userId,
      pixRequest.amount / 100, // Starkbank usa centavos
      pixRequest.id,
      `PIX recebido via Starkbank: R$ ${(pixRequest.amount / 100).toFixed(2)}`
    );

    if (result.success) {
      console.log('✅ PIX balance credited from Starkbank:', {
        pixId: pixRequest.id,
        amount: `R$ ${(pixRequest.amount / 100).toFixed(2)}`,
        newBalance: result.newBalance,
        userId: userId
      });
    } else {
      console.error('❌ Failed to credit PIX balance from Starkbank');
    }

  } catch (error) {
    console.error('❌ Error handling PIX credited:', error);
  }
}

async function handlePixFailed(pixRequest: any): Promise<void> {
  try {
    console.log('❌ Processing PIX failed from Starkbank:', pixRequest.id);
    
    // TODO: Implement PIX failure handling
    // - Update transaction status to failed
    // - Notify user about failure
    // - Log failure reason
    
    console.log('📝 PIX failure logged');
  } catch (error) {
    console.error('❌ Error handling PIX failed:', error);
  }
}

async function handlePixReversal(reversal: any): Promise<void> {
  try {
    console.log('🔄 Processing PIX reversal from Starkbank:', reversal.id);
    
    // TODO: Implement PIX reversal handling
    // - Deduct amount from PIX balance
    // - Create reversal transaction record
    // - Notify user about reversal
    
    console.log('📝 PIX reversal logged');
  } catch (error) {
    console.error('❌ Error handling PIX reversal:', error);
  }
}

// GET endpoint for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Starkbank PIX webhook endpoint',
    status: 'active',
    description: 'Handles PIX transactions from Starkbank API',
    timestamp: new Date().toISOString()
  });
}