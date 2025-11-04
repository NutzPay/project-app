import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { bettrixService } from '@/lib/bettrix';
import { prisma } from '@/lib/prisma';

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

    console.log('🔄 Getting PIX balance via Bettrix for user:', currentUser.id);

    try {
      // Get balance from Bettrix
      const bettrixBalance = await bettrixService.getBalance();

      // Get or create local PIX wallet for transaction history
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

      // Convert cents to BRL
      const balance = bettrixBalance.balance / 100;
      const retention = bettrixBalance.retention / 100;
      const toAnticipate = bettrixBalance.toAnticipate / 100;
      const finalBalance = bettrixBalance.finalBalance / 100;

      console.log('✅ Bettrix balance retrieved:', {
        balance,
        retention,
        toAnticipate,
        finalBalance
      });

      return NextResponse.json({
        success: true,
        balance: {
          brlAmount: finalBalance, // Use final balance as main balance
          available: balance, // Raw balance
          retention: retention, // Amount in retention
          toAnticipate: toAnticipate, // Amount to anticipate
          finalBalance: finalBalance, // Final available balance
          // Local wallet statistics for reference
          localDeposited: parseFloat(pixWallet.totalDeposited.toString()),
          localWithdrawn: parseFloat(pixWallet.totalWithdrawn.toString())
        },
        provider: 'bettrix'
      });

    } catch (bettrixError) {
      console.warn('⚠️ Bettrix balance error, falling back to local balance:', bettrixError);

      // Fallback to local wallet balance if Bettrix is unavailable
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

      const localBalance = parseFloat(pixWallet.balance.toString());

      return NextResponse.json({
        success: true,
        balance: {
          brlAmount: localBalance,
          available: localBalance,
          retention: 0,
          toAnticipate: 0,
          finalBalance: localBalance,
          localDeposited: parseFloat(pixWallet.totalDeposited.toString()),
          localWithdrawn: parseFloat(pixWallet.totalWithdrawn.toString())
        },
        provider: 'local',
        warning: 'Using local balance due to Bettrix API unavailability'
      });
    }

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