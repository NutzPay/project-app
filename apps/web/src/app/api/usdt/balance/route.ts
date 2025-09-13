import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';

const prisma = new PrismaClient();

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

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        usdtWallet: true,
      }
    });

    if (!user || !user.usdtWallet) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Carteira USDT não encontrada',
          code: 'WALLET_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const usdtToBrl = 5.42;
    
    return NextResponse.json({
      success: true,
      wallet: {
        balance: parseFloat(user.usdtWallet.balance.toString()),
        frozenBalance: parseFloat(user.usdtWallet.frozenBalance.toString()),
        totalDeposited: parseFloat(user.usdtWallet.totalDeposited.toString()),
        totalWithdrawn: parseFloat(user.usdtWallet.totalWithdrawn.toString()),
        availableBalance: parseFloat(user.usdtWallet.balance.toString()) - parseFloat(user.usdtWallet.frozenBalance.toString()),
        brlEquivalent: parseFloat(user.usdtWallet.balance.toString()) * usdtToBrl,
        exchangeRate: usdtToBrl
      }
    });

  } catch (error) {
    console.error('❌ Error loading USDT balance:', error);
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