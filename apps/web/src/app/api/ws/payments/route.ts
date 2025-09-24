import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');

  if (!transactionId) {
    return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 });
  }

  // For Next.js, WebSockets need to be handled differently
  // This endpoint provides transaction status instead
  return NextResponse.json({
    message: 'WebSocket endpoint - use polling for now',
    transactionId,
    endpoint: `/api/transactions/${transactionId}`,
    note: 'WebSocket support requires custom server implementation'
  });
}

