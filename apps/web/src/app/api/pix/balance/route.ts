import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não autenticado',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // Get or create PIX wallet
    let pixWallet = await prisma.pIXWallet.findUnique({
      where: { userId: currentUser.id }
    });

    if (!pixWallet) {
      pixWallet = await prisma.pIXWallet.create({
        data: {
          userId: currentUser.id
        }
      });
    }

    const pixBalance = parseFloat(pixWallet.balance.toString());

    return NextResponse.json({
      success: true,
      balance: {
        brlAmount: pixBalance,
        totalDeposited: parseFloat(pixWallet.totalDeposited.toString()),
        totalWithdrawn: parseFloat(pixWallet.totalWithdrawn.toString())
      }
    });

  } catch (error) {
    console.error('❌ Error loading PIX balance:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}