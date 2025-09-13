import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Endpoint para testar/simular pagamento de câmbio
export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'ID da transação é obrigatório'
        },
        { status: 400 }
      );
    }

    // Simular pagamento bem-sucedido
    const confirmResponse = await fetch(`${request.nextUrl.origin}/api/exchange/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactionId })
    });

    const result = await confirmResponse.json();

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error testing exchange:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}