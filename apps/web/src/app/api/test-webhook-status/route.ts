import { NextRequest, NextResponse } from 'next/server';

// Armazenar logs temporariamente em memória (em produção usaria Redis ou banco)
const recentWebhookCalls: Array<{
  timestamp: string;
  method: string;
  headers: Record<string, string>;
  payload?: any;
  userAgent?: string;
  ip?: string;
}> = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        webhookEndpoint: '/api/xgate/webhook',
        status: 'active',
        timestamp: new Date().toISOString(),
        recentCalls: {
          count: recentWebhookCalls.length,
          lastHour: recentWebhookCalls.filter(call => 
            new Date(call.timestamp).getTime() > Date.now() - 60 * 60 * 1000
          ).length,
          calls: recentWebhookCalls.slice(-10) // Últimas 10 chamadas
        },
        instructions: {
          checkLogs: 'GET /api/webhook-logs',
          testWebhook: 'POST /api/test-webhook-status com payload de teste',
          manualProcess: 'POST /api/manual-process'
        }
      });
    }

    if (action === 'clear') {
      recentWebhookCalls.length = 0;
      return NextResponse.json({
        success: true,
        message: 'Webhook call history cleared',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      webhookEndpoint: '/api/xgate/webhook',
      availableActions: ['status', 'clear'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in webhook status check:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headers = Object.fromEntries(request.headers.entries());
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

    // Registrar a chamada
    const callInfo = {
      timestamp: new Date().toISOString(),
      method: 'POST',
      headers: {
        'content-type': headers['content-type'] || '',
        'user-agent': userAgent,
        'x-forwarded-for': forwarded || '',
        authorization: headers.authorization ? '[REDACTED]' : ''
      },
      payload: body,
      userAgent,
      ip
    };

    recentWebhookCalls.push(callInfo);

    // Manter apenas as últimas 100 chamadas
    if (recentWebhookCalls.length > 100) {
      recentWebhookCalls.splice(0, recentWebhookCalls.length - 100);
    }

    console.log('📞 Test webhook call received:', {
      timestamp: callInfo.timestamp,
      ip: callInfo.ip,
      userAgent: userAgent.substring(0, 50),
      payloadKeys: Object.keys(body)
    });

    // Se for um teste de webhook XGate, simular processamento
    if (body.status === 'PAID' && body.id) {
      console.log('🧪 Simulating XGate PAID webhook processing...');
      
      return NextResponse.json({
        success: true,
        message: 'Test webhook received and would be processed',
        receivedAt: callInfo.timestamp,
        payload: body,
        processing: {
          action: 'would_complete_transaction',
          pixTransactionId: body.id,
          amount: body.crypto_amount,
          brlAmount: body.amount
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test webhook call received',
      receivedAt: callInfo.timestamp,
      callInfo: {
        method: callInfo.method,
        ip: callInfo.ip,
        userAgent: userAgent.substring(0, 100),
        payloadSize: JSON.stringify(body).length
      }
    });

  } catch (error) {
    console.error('❌ Error processing test webhook:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}