import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    url: 'https://nutzxgate.loca.lt/api/xgate/webhook'
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🧪 TEST WEBHOOK RECEIVED:', JSON.stringify(body, null, 2));
    
    // Simulate webhook from Xgate with NEW format
    const response = await fetch('https://244f05946e0c.ngrok-free.app/api/xgate/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Webhook': 'true'
      },
      body: JSON.stringify({
        id: body.transactionId || 'test_order_123',
        status: 'PAID',
        amount: body.amount || 55.00,
        crypto_amount: body.crypto_amount || 10.00,
        currency: 'BRL',
        cryptocurrency: 'USDT',
        customer_id: 'test_customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Test webhook sent successfully',
      response: result
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test webhook failed',
        details: (error as Error).message 
      },
      { status: 500 }
    );
  }
}