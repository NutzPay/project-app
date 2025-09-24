import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Get current authenticated user
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

    // Get user data from database with wallets
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: {
        usdtWallet: true,
        pixWallet: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // Calculate conversion rate (mock for now, should use real API)
    const usdtToBrl = 5.42; // Approximate USDT to BRL rate

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      accountType: user.accountType,
      companyName: user.companyName,
      document: user.document,
      // USDT Wallet
      usdtBalance: user.usdtWallet?.balance || 0,
      usdtFrozenBalance: user.usdtWallet?.frozenBalance || 0,
      usdtTotalDeposited: user.usdtWallet?.totalDeposited || 0,
      usdtTotalWithdrawn: user.usdtWallet?.totalWithdrawn || 0,
      // PIX Wallet (separate balance)
      pixBalance: user.pixWallet?.balance || 0,
      pixTotalDeposited: user.pixWallet?.totalDeposited || 0,
      pixTotalWithdrawn: user.pixWallet?.totalWithdrawn || 0,
      // Conversion for reference
      brlEquivalent: (parseFloat(user.usdtWallet?.balance?.toString() || '0') * usdtToBrl),
      conversionRate: usdtToBrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    console.log('✅ User profile loaded from database:', {
      id: profile.id,
      email: profile.email,
      usdtBalance: profile.usdtBalance,
      brlEquivalent: profile.brlEquivalent
    });

    return NextResponse.json({
      success: true,
      profile
    });

  } catch (error) {
    console.error('❌ Error loading user profile:', error);
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